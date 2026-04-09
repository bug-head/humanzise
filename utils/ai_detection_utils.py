"""
AI text detection powered by the desklib DeBERTa-v3 classifier.

Scores the FULL text and each sentence. Returns the per-sentence bucket
breakdown the frontend expects PLUS the honest raw mean probability.
"""
import nltk
from nltk.tokenize import sent_tokenize

from utils.model_loaders import load_detector_model, predict_ai_probability

nltk.download("punkt", quiet=True)


def classify_text_hf(text, threshold_ai=0.75, threshold_mid=0.4, threshold_soft=0.15):
    """Classify the input text.

    Returns:
      classification_map: dict[sentence] -> label bucket
      percentages: dict[bucket] -> percentage of sentences
      mean_ai_probability: float 0..1 (full-text score)

    The full-text probability is also used as the headline AI score because
    detectors are more reliable on full paragraphs than individual sentences.
    """
    model, tokenizer, device = load_detector_model()

    # Overall score: run the full text through the model once
    full_prob = predict_ai_probability(text, model, tokenizer, device)

    sentences = sent_tokenize(text) or [text]
    classification_map = {}
    counts = {
        "AI-generated": 0,
        "AI-generated & AI-refined": 0,
        "Human-written": 0,
        "Human-written & AI-refined": 0,
    }

    for sentence in sentences:
        if not sentence.strip():
            continue
        prob = predict_ai_probability(sentence, model, tokenizer, device)

        if prob >= threshold_ai:
            label = "AI-generated"
        elif prob >= threshold_mid:
            label = "AI-generated & AI-refined"
        elif prob >= threshold_soft:
            label = "Human-written & AI-refined"
        else:
            label = "Human-written"

        classification_map[sentence] = label
        counts[label] += 1

    total = sum(counts.values())
    percentages = {
        cat: round((count / total) * 100, 2) if total > 0 else 0
        for cat, count in counts.items()
    }
    return classification_map, percentages, full_prob
