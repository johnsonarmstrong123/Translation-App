from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from transformers import MarianMTModel, MarianTokenizer

from database import init_db, get_db, User, TranslationLog
from auth import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str

@app.post("/signup", response_model=LoginResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=request.email, hashed_password=hash_password(request.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return LoginResponse(access_token=token)

@app.post("/login", response_model=LoginResponse)
def login(request: SignupRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return LoginResponse(access_token=token)

SUPPORTED_LANGUAGES = {
    ("en", "fr"): "Helsinki-NLP/opus-mt-en-fr",
    ("fr", "en"): "Helsinki-NLP/opus-mt-fr-en",
    ("en", "es"): "Helsinki-NLP/opus-mt-en-es",
    ("es", "en"): "Helsinki-NLP/opus-mt-es-en",
    ("en", "de"): "Helsinki-NLP/opus-mt-en-de",
    ("de", "en"): "Helsinki-NLP/opus-mt-de-en",
}

loaded_models = {}

def get_model(source_lang: str, target_lang: str):
    key = (source_lang, target_lang)
    if key not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language pair")
    if key not in loaded_models:
        model_name = SUPPORTED_LANGUAGES[key]
        tokenizer = MarianTokenizer.from_pretrained(model_name)
        model = MarianMTModel.from_pretrained(model_name)
        loaded_models[key] = (tokenizer, model)
    return loaded_models[key]

@app.post("/translate", response_model=TranslationResponse)
def translate(
    request: TranslationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    tokenizer, model = get_model(request.source_lang, request.target_lang)
    inputs = tokenizer(request.text, return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    output = tokenizer.decode(translated[0], skip_special_tokens=True)

    log = TranslationLog(user_id=user.id, source_lang=request.source_lang, target_lang=request.target_lang)
    db.add(log)
    db.commit()

    return TranslationResponse(translated_text=output)

@app.get("/languages")
def get_languages():
    return {"pairs": [{"source": s, "target": t} for (s, t) in SUPPORTED_LANGUAGES.keys()]}

@app.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"email": user.email, "is_admin": user.is_admin}

@app.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    total_translations = db.query(func.count(TranslationLog.id)).scalar()

    pair_counts = (
        db.query(TranslationLog.source_lang, TranslationLog.target_lang, func.count(TranslationLog.id))
        .group_by(TranslationLog.source_lang, TranslationLog.target_lang)
        .all()
    )

    return {
        "total_users": total_users,
        "total_translations": total_translations,
        "language_pair_usage": [
            {"source": s, "target": t, "count": c} for (s, t, c) in pair_counts
        ]
    }

@app.get("/")
def root():
    return {"status": "Translation API running"}