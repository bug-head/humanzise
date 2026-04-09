# Humanzise backend — Docker image for Hugging Face Spaces (Docker SDK).
#
# HF Spaces requirements met here:
#   - Listens on 0.0.0.0:7860
#   - Runs as non-root user with UID 1000 (`user`)
#   - $HOME = /home/user so HF Hub cache persists under the user
#
# Build size strategy:
#   - CPU-only torch wheel (~500 MB instead of ~2 GB CUDA)
#   - --no-cache-dir on every pip install
#   - Slim Debian base

FROM python:3.11-slim

# System deps needed for occasional source builds
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        git \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces mandates a non-root user with UID 1000
RUN useradd --create-home --uid 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface \
    TRANSFORMERS_CACHE=/home/user/.cache/huggingface \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /home/user/app

# Install CPU-only torch first so transformers picks it up and doesn't pull CUDA
RUN pip install --no-cache-dir --user --upgrade pip && \
    pip install --no-cache-dir --user \
        --index-url https://download.pytorch.org/whl/cpu \
        torch

# Install the rest of the deps
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Pre-download the small NLP models so cold requests don't pay the download tax
RUN python -m spacy download en_core_web_sm && \
    python -c "import nltk; \
        nltk.download('punkt', quiet=True); \
        nltk.download('punkt_tab', quiet=True); \
        nltk.download('averaged_perceptron_tagger', quiet=True); \
        nltk.download('averaged_perceptron_tagger_eng', quiet=True); \
        nltk.download('wordnet', quiet=True)"

# Copy application code
COPY --chown=user:user api ./api
COPY --chown=user:user utils ./utils

EXPOSE 7860

# The desklib model (~1.75 GB) downloads lazily on the first /detect request
# and is cached under $HF_HOME for the life of the container.
CMD ["uvicorn", "api.humanize_api:app", "--host", "0.0.0.0", "--port", "7860"]
