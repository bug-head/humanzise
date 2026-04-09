"""
Model loaders for the AI detection pipeline.

Uses `desklib/ai-text-detector-v1.01` — a DeBERTa-v3-large classifier that
currently tops the RAID benchmark for modern LLM detection (ChatGPT, Claude,
Gemini, Llama, Grok, etc). The model ships a custom head, so we load it via
the `DesklibAIDetectionModel` wrapper defined in `utils.desklib_model`.
"""
import logging
from functools import lru_cache

import torch
from transformers import AutoTokenizer

from utils.desklib_model import DesklibAIDetectionModel

logger = logging.getLogger(__name__)

DETECTOR_MODEL_ID = "desklib/ai-text-detector-v1.01"


@lru_cache(maxsize=1)
def load_detector_model():
    """Load the desklib AI detector (DeBERTa-v3-large + custom head).

    Returns (model, tokenizer, device). First call downloads ~1.75 GB
    and caches it under `~/.cache/huggingface`. Subsequent calls return
    the cached in-process instance.
    """
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")

    logger.info("Loading detector %s on %s", DETECTOR_MODEL_ID, device)
    tokenizer = AutoTokenizer.from_pretrained(DETECTOR_MODEL_ID)
    model = DesklibAIDetectionModel.from_pretrained(DETECTOR_MODEL_ID)
    model.to(device)
    model.eval()
    logger.info("Detector ready")
    return model, tokenizer, device


@torch.no_grad()
def predict_ai_probability(text, model, tokenizer, device, max_len=768):
    """Return probability (0..1) that `text` is AI-generated."""
    encoded = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=max_len,
        return_tensors="pt",
    )
    input_ids = encoded["input_ids"].to(device)
    attention_mask = encoded["attention_mask"].to(device)

    outputs = model(input_ids=input_ids, attention_mask=attention_mask)
    logits = outputs["logits"]
    return torch.sigmoid(logits).item()
