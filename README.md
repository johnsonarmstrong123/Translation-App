# Twi Bridge

A web-based multilingual machine translation platform built with **Angular** and **FastAPI**, integrating pretrained neural translation models from **Hugging Face** (Helsinki-NLP / OPUS-MT). The platform supports authenticated translation between English and French, Spanish, and German (bidirectional), and English to Twi (unidirectional), alongside user account management and an administrator analytics dashboard.

---

## Features

- **Multilingual neural machine translation**
  - English ↔ French
  - English ↔ Spanish
  - English ↔ German
  - English → Twi
- **User authentication** — signup and login with hashed passwords (bcrypt) and JWT-based session tokens
- **Protected translation access** — the `/translate` endpoint requires a valid, logged-in user
- **Translation usage logging** — every translation is recorded (user, language pair, timestamp)
- **Administrator dashboard** — real-time statistics on total users, total translations, and usage broken down by language pair
- **Responsive navbar** — shows the logged-in user's email, an Admin Dashboard link (visible only to admins), and Sign Out
- **Automated backend test suite** — 8 passing `pytest` tests covering authentication, access control, and translation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular (standalone components), Bootstrap 5 |
| Backend | Python, FastAPI |
| Translation engine | Hugging Face `transformers` library, running pretrained **Helsinki-NLP OPUS-MT (MarianMT)** models |
| Database | SQLite, accessed via SQLAlchemy ORM |
| Authentication | JWT (`python-jose`) + password hashing (`passlib` / `bcrypt`) |
| Testing | `pytest`, `httpx`, FastAPI `TestClient` |

---

## How Translation Works

Twi Bridge does **not** call an external translation API. Instead, the FastAPI backend loads pretrained Helsinki-NLP OPUS-MT models directly, in-process, using Hugging Face's `transformers` library:

```python
from transformers import MarianMTModel, MarianTokenizer

tokenizer = MarianTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-fr")
model = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-en-fr")
```

The first time a language pair is used, its model is downloaded once from the Hugging Face Model Hub (`huggingface.co`) and cached locally (visible under `~/.cache/huggingface/hub`). To keep memory usage manageable, the backend:
- keeps only one model loaded in memory at a time (evicting the previous one when a new pair is requested),
- applies dynamic INT8 quantization to shrink each model's footprint, and
- runs inference under `torch.no_grad()` to avoid unnecessary memory overhead.

---

## Project Structure

```
translation-app/
├── backend/
│   ├── main.py              # FastAPI app: routes, auth wiring, translation logic
│   ├── auth.py               # Password hashing + JWT creation/verification
│   ├── database.py           # SQLAlchemy models (User, TranslationLog) + session setup
│   ├── test_main.py          # pytest test suite (8 tests)
│   ├── requirements.txt
│   └── app.db                 # SQLite database (created automatically on first run)
│
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── translator/        # Main translation UI
│   │   │   ├── login/             # Login page
│   │   │   ├── signup/            # Signup page
│   │   │   ├── navbar/            # Persistent navbar (Sign Out, Admin link)
│   │   │   └── admin-dashboard/   # Admin-only usage statistics page
│   │   ├── services/
│   │   │   └── translation.ts     # HTTP client wrapper for all backend calls
│   │   └── auth-guard.ts          # Route guard restricting access to logged-in users
│   └── ...
│
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/signup` | Create a new user account | No |
| POST | `/login` | Authenticate and receive a JWT | No |
| GET | `/me` | Get the current user's email and admin status | Yes |
| GET | `/languages` | List supported translation language pairs | No |
| POST | `/translate` | Translate text between a supported language pair | Yes |
| GET | `/admin/stats` | Get usage statistics (users, translations, language-pair breakdown) | Yes (admin only) |

Interactive API documentation is available at `/docs` when the backend is running.

---

## Running the Project Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend runs at `http://localhost:4200`.

---

## Running the Test Suite

```bash
cd backend
venv\Scripts\activate
pytest -v
```

This runs 8 automated tests covering:
- User signup (success and duplicate-email rejection)
- User login (success and wrong-password rejection)
- Retrieving supported languages
- Translation access control (rejecting unauthenticated requests)
- Successful authenticated translation
- Admin-only access control on `/admin/stats`

---

## Known Limitations

- **Twi is currently one-directional (English → Twi only).** No reliable, openly available pretrained Twi → English model could be identified at the time of development. Bidirectional Twi support is identified as future work.
- **No formal translation-quality evaluation (BLEU / perplexity) has been conducted.** The system is currently validated through automated software testing and manual verification rather than translation-quality benchmarking.
- **No rate limiting or per-user translation history** is implemented; the `TranslationLog` table exists solely to power the administrator dashboard's aggregate statistics.
- **Public backend hosting is memory-constrained.** Free-tier cloud hosts (tested: Render, 512MB RAM) struggle to run transformer-based translation models reliably. The system is fully functional when run locally; public deployment is a documented ongoing consideration.

---

## Author

**Johnson Boamah Sharon Armstrong**
Kumasi Technical University — Department of Computer Science
Supervisor: Mavis Sarah Gyimah
