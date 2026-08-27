from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import MarianMTModel, MarianTokenizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str

@app.post("/translate", response_model=TranslationResponse)
def translate(request: TranslationRequest):
    tokenizer, model = get_model(request.source_lang, request.target_lang)
    inputs = tokenizer(request.text, return_tensors="pt", padding=True)
    translated = model.generate(**inputs)
    output = tokenizer.decode(translated[0], skip_special_tokens=True)
    return TranslationResponse(translated_text=output)

@app.get("/languages")
def get_languages():
    return {"pairs": [{"source": s, "target": t} for (s, t) in SUPPORTED_LANGUAGES.keys()]}

@app.get("/")
def root():
    return {"status": "Translation API running"}