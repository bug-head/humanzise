import re
from typing import Dict, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from utils.ai_detection_utils import classify_text_hf
from utils.pdf_utils import extract_text_from_pdf
from utils.humanizer_core import (
    count_sentences,
    count_words,
    extract_citations,
    minimal_rewriting,
    preserve_linebreaks_rewrite,
    restore_citations,
)


DESCRIPTION = """
AI Text Humanizer & Detector API

Provides server-side access to the project's text humanization and AI-detection
pipelines. The API is consumed by the Next.js frontend in /web.
"""

tags_metadata = [
    {"name": "humanize", "description": "Transform AI-generated text into human-like prose."},
    {"name": "detect", "description": "Classify text as AI-generated or human-written."},
]

app = FastAPI(
    title="AI Text Humanizer API",
    version="0.3",
    description=DESCRIPTION,
    openapi_tags=tags_metadata,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HumanizeRequest(BaseModel):
    text: str = Field(..., description="The input text to humanize. Must be non-empty.")
    p_syn: Optional[float] = Field(0.2, ge=0.0, le=1.0)
    p_trans: Optional[float] = Field(0.2, ge=0.0, le=1.0)
    preserve_linebreaks: Optional[bool] = Field(True)


class HumanizeResponse(BaseModel):
    humanized_text: str
    orig_word_count: int
    orig_sentence_count: int
    new_word_count: int
    new_sentence_count: int
    words_added: int
    sentences_added: int


class DetectRequest(BaseModel):
    text: str = Field(..., description="The input text to analyze.")


class DetectResponse(BaseModel):
    percentages: Dict[str, float]
    classification: Dict[str, str]
    ai_score: float
    human_score: float


@app.get("/health", tags=["humanize"], summary="Health check")
def health():
    return {"status": "ok"}


@app.post("/humanize", response_model=HumanizeResponse, tags=["humanize"])
def humanize(req: HumanizeRequest):
    text = req.text or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="`text` must be a non-empty string")

    orig_wc = count_words(text)
    orig_sc = count_sentences(text)

    no_refs_text, placeholders = extract_citations(text)

    if req.preserve_linebreaks:
        rewritten = preserve_linebreaks_rewrite(no_refs_text, p_syn=req.p_syn, p_trans=req.p_trans)
    else:
        rewritten = minimal_rewriting(no_refs_text, p_syn=req.p_syn, p_trans=req.p_trans)

    final_text = restore_citations(rewritten, placeholders)
    final_text = re.sub(r"[ \t]+([.,;:!?])", r"\1", final_text)
    final_text = re.sub(r"(\()[ \t]+", r"\1", final_text)
    final_text = re.sub(r"[ \t]+(\))", r"\1", final_text)
    final_text = re.sub(r"[ \t]{2,}", " ", final_text)
    final_text = re.sub(r"``\s*(.+?)\s*''", r'"\1"', final_text)

    new_wc = count_words(final_text)
    new_sc = count_sentences(final_text)

    return {
        "humanized_text": final_text,
        "orig_word_count": orig_wc,
        "orig_sentence_count": orig_sc,
        "new_word_count": new_wc,
        "new_sentence_count": new_sc,
        "words_added": new_wc - orig_wc,
        "sentences_added": new_sc - orig_sc,
    }


@app.post("/extract-file", tags=["humanize"], summary="Extract text from uploaded file")
async def extract_file(file: UploadFile = File(...)):
    """Accept a PDF, TXT or MD file and return its plain-text contents."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    name = file.filename.lower()

    try:
        if name.endswith(".pdf"):
            text = extract_text_from_pdf(content)
        elif name.endswith((".txt", ".md")):
            text = content.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Use .pdf, .txt, or .md",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract: {exc}")

    return {"text": text, "filename": file.filename}


@app.post("/detect", response_model=DetectResponse, tags=["detect"])
def detect(req: DetectRequest):
    text = req.text or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="`text` must be a non-empty string")

    classification_map, percentages, mean_ai_prob = classify_text_hf(text)

    # Use the raw mean probability as the headline score — it's a more honest
    # signal than bucket-counting (which collapses to 0 for borderline text).
    ai_score = round(mean_ai_prob * 100, 2)
    human_score = round(100 - ai_score, 2)

    return {
        "percentages": percentages,
        "classification": classification_map,
        "ai_score": ai_score,
        "human_score": human_score,
    }
