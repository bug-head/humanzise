const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface DetectResponse {
  percentages: Record<string, number>;
  classification: Record<string, string>;
  ai_score: number;
  human_score: number;
}

export interface HumanizeResponse {
  humanized_text: string;
  orig_word_count: number;
  orig_sentence_count: number;
  new_word_count: number;
  new_sentence_count: number;
  words_added: number;
  sentences_added: number;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export function detectText(text: string) {
  return postJSON<DetectResponse>("/detect", { text });
}

export async function extractFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/extract-file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Extract ${res.status}: ${msg}`);
  }
  const data = (await res.json()) as { text: string; filename: string };
  return data.text;
}

export function humanizeText(
  text: string,
  opts: { p_syn?: number; p_trans?: number; preserve_linebreaks?: boolean } = {}
) {
  return postJSON<HumanizeResponse>("/humanize", {
    text,
    p_syn: opts.p_syn ?? 0.3,
    p_trans: opts.p_trans ?? 0.2,
    preserve_linebreaks: opts.preserve_linebreaks ?? true,
  });
}
