---
title: Humanzise API
emoji: 🪄
colorFrom: green
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
short_description: Free AI text humanizer and detector
---

# Humanzise

Free, open-source **AI text humanizer** + **AI detector**. Paste any AI-generated text and rewrite it to sound more natural — or check how likely an existing text was written by AI.

- **Frontend**: Next.js 16 + shadcn/ui + Tailwind CSS (deployed on Vercel)
- **Backend**: FastAPI + PyTorch + DeBERTa-v3 detector (deployed on Hugging Face Spaces)
- **Detector model**: [`desklib/ai-text-detector-v1.01`](https://huggingface.co/desklib/ai-text-detector-v1.01) — current leader on the RAID benchmark
- **Humanizer**: rule-based pipeline (WordNet synonyms + contraction expansion + academic transitions + citation preservation)

## Repository layout

```
humanzise/
├── api/                   FastAPI app (entry point: api.humanize_api:app)
│   └── humanize_api.py
├── utils/                 Backend logic
│   ├── humanizer_core.py  Text humanization pipeline
│   ├── ai_detection_utils.py
│   ├── desklib_model.py   Custom DeBERTa-v3 wrapper for desklib weights
│   ├── model_loaders.py
│   └── pdf_utils.py       PDF text extraction
├── web/                   Next.js frontend
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
├── Dockerfile             HF Spaces Docker image
├── requirements.txt       Production deps (lean, CPU-only torch)
├── requirements-local.txt All dev deps
└── DEPLOY.md              Step-by-step deployment guide
```

## Running locally

### Backend (Python 3.12)

```bash
python -m venv venv
source venv/Scripts/activate        # or venv/bin/activate on macOS/Linux
pip install -r requirements-local.txt
python -m spacy download en_core_web_sm

python -m uvicorn api.humanize_api:app --reload --port 8000
```

Scalar docs: http://localhost:8000/docs

### Frontend (Node 20+)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_BASE_URL` in `web/.env.local` if your backend isn't on `http://127.0.0.1:8000`.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET`  | `/health` | Liveness probe |
| `POST` | `/humanize` | Rewrite AI text to sound more natural |
| `POST` | `/detect` | Score text for AI likelihood (desklib DeBERTa-v3) |
| `POST` | `/extract-file` | Extract text from uploaded PDF/TXT/MD |

All endpoints use JSON request/response; `/extract-file` uses `multipart/form-data`.

## Deployment

Free deployment path is documented in [DEPLOY.md](./DEPLOY.md):

- **Frontend** → Vercel (free, `web/` subfolder)
- **Backend** → Hugging Face Spaces (Docker SDK, free 16 GB RAM)

## Credits

Forked from [DadaNanjesha/AI-content-detector-Humanizer](https://github.com/DadaNanjesha/AI-content-detector-Humanizer) — original Streamlit app. This fork replaced the Streamlit UI with a Next.js frontend, modernized the backend, and swapped in the desklib detector.

## License

MIT — see [LICENSE](./LICENSE).
