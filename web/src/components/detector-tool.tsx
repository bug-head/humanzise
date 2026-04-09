"use client";

import { useMemo, useRef, useState } from "react";
import { SAMPLES } from "@/lib/samples";
import {
  detectText,
  extractFile,
  humanizeText,
  type DetectResponse,
  type HumanizeResponse,
} from "@/lib/api";
import {
  ArrowDown,
  Check,
  ClipboardPaste,
  Copy,
  FileText,
  Loader2,
  Paperclip,
  ScanSearch,
  Sparkles,
  Wand2,
} from "lucide-react";

const MAX_WORDS = 10000;

type Mode = "idle" | "humanizing" | "uploading" | "detecting";

export function DetectorTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [humanizeResult, setHumanizeResult] =
    useState<HumanizeResponse | null>(null);
  const [detectResult, setDetectResult] = useState<DetectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text]
  );
  const canRun = text.trim().length > 0 && mode === "idle";
  const isEmpty = text.trim().length === 0;

  async function handleHumanize() {
    setError(null);
    setHumanizeResult(null);
    setDetectResult(null);
    setCopied(false);
    setMode("humanizing");
    try {
      const res = await humanizeText(text);
      setHumanizeResult(res);
      // Note: we do NOT overwrite `text` — the original stays in the textarea
      // so the user can compare and re-run.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Humanization failed");
    } finally {
      setMode("idle");
    }
  }

  async function handleDetect() {
    setError(null);
    setDetectResult(null);
    setHumanizeResult(null);
    setMode("detecting");
    try {
      const res = await detectText(text);
      setDetectResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed");
    } finally {
      setMode("idle");
    }
  }

  function loadSample(name: keyof typeof SAMPLES) {
    setText(SAMPLES[name]);
    setHumanizeResult(null);
    setDetectResult(null);
    setCopied(false);
    setError(null);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handlePasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setHumanizeResult(null);
        setDetectResult(null);
        setTimeout(() => textareaRef.current?.focus(), 0);
      } else {
        textareaRef.current?.focus();
      }
    } catch {
      // Clipboard API unavailable (insecure origin, permission denied) — just focus
      textareaRef.current?.focus();
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMode("uploading");
    try {
      const extracted = await extractFile(file);
      setText(extracted);
      setHumanizeResult(null);
      setDetectResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setMode("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCopyOriginal() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={handleFile}
      />

      <div className="relative">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -inset-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(127,255,195,0.4),transparent_65%)] blur-3xl" />

        <div className="relative overflow-hidden rounded-3xl border border-[#0f1a17]/10 bg-white shadow-[0_30px_80px_-30px_rgba(15,26,23,0.25)]">
          {/* Tab header */}
          <div className="flex items-center justify-between border-b border-[#0f1a17]/8 bg-[#f5faf8] px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fffc3] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7fffc3]" />
              </span>
              <span className="typo-label text-[#0f1a17]/60">
                Input · ready
              </span>
            </div>
            <span className="typo-label text-[#0f1a17]/40">
              PDF · TXT · MD
            </span>
          </div>

          <div className="relative">
            {/* Decorative soft gradient behind textarea */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(214,255,236,0.6),transparent_60%)]" />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={mode === "uploading"}
              placeholder={isEmpty ? "" : "Paste your text here..."}
              className="relative min-h-[460px] w-full resize-none bg-transparent px-10 py-8 text-[15px] leading-[1.75] text-[#0f1a17] placeholder:text-[#0f1a17]/30 focus:outline-none disabled:opacity-40"
            />

            {isEmpty && mode !== "uploading" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
                {/* Decorative icon cluster */}
                <div className="relative">
                  <div className="absolute -inset-6 rounded-full bg-[#7fffc3]/30 blur-2xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0f1a17]/10 bg-white shadow-lg shadow-[#7fffc3]/30">
                    <Wand2 className="h-7 w-7 text-[#0f1a17]" />
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7fffc3] ring-2 ring-white">
                      <Sparkles className="h-3 w-3 text-[#0f1a17]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <h3 className="font-display text-2xl tracking-tight text-[#0f1a17]">
                    Drop your AI text here
                  </h3>
                  <p className="text-sm text-[#0f1a17]/50">
                    Paste, upload a file, or pick a sample below
                  </p>
                </div>

                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="typo-button inline-flex items-center gap-2 rounded-full border border-[#0f1a17]/15 bg-white px-5 py-2.5 text-[#0f1a17] shadow-sm transition hover:border-[#0f1a17] hover:bg-[#0f1a17] hover:text-[#7fffc3]"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Paste
                  </button>
                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="typo-button inline-flex items-center gap-2 rounded-full border border-[#0f1a17]/15 bg-white px-5 py-2.5 text-[#0f1a17] shadow-sm transition hover:border-[#0f1a17] hover:bg-[#0f1a17] hover:text-[#7fffc3]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Type
                  </button>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="typo-button inline-flex items-center gap-2 rounded-full border border-[#0f1a17]/15 bg-white px-5 py-2.5 text-[#0f1a17] shadow-sm transition hover:border-[#0f1a17] hover:bg-[#0f1a17] hover:text-[#7fffc3]"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Upload
                  </button>
                </div>

                <div className="pointer-events-auto flex flex-col items-center gap-2.5">
                  <span className="typo-label text-[#0f1a17]/40">
                    Or try a sample
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(Object.keys(SAMPLES) as (keyof typeof SAMPLES)[]).map(
                      (k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => loadSample(k)}
                          className="typo-label rounded-full border border-[#0f1a17]/10 bg-white px-3 py-1.5 text-[#0f1a17]/70 transition hover:-translate-y-0.5 hover:border-[#80c1a2] hover:bg-[#d6ffec] hover:text-[#0f1a17]"
                        >
                          {k}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {mode === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-[#0f1a17]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="typo-label">Extracting file</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#0f1a17]/8 bg-[#f5faf8] px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="typo-label text-[#0f1a17]/60">
                <span
                  className={
                    wordCount > MAX_WORDS
                      ? "text-red-600"
                      : "text-[#0f1a17]"
                  }
                >
                  {wordCount.toLocaleString()}
                </span>
                <span className="text-[#0f1a17]/40">
                  {" "}
                  / {MAX_WORDS.toLocaleString()} words
                </span>
              </div>

              {!isEmpty && (
                <>
                  <span className="h-4 w-px bg-[#0f1a17]/15" />
                  <button
                    type="button"
                    onClick={handleCopyOriginal}
                    className="typo-label inline-flex items-center gap-1.5 text-[#0f1a17]/60 transition hover:text-[#0f1a17]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setText("");
                      setHumanizeResult(null);
                      setDetectResult(null);
                      setCopied(false);
                    }}
                    className="typo-label text-[#0f1a17]/40 transition hover:text-red-600"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={!canRun}
                onClick={handleDetect}
                className="typo-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#0f1a17]/20 bg-white px-5 text-[#0f1a17] transition hover:border-[#0f1a17] hover:bg-[#0f1a17] hover:text-[#7fffc3] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode === "detecting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Check for AI
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!canRun}
                onClick={handleHumanize}
                className="typo-button group relative inline-flex h-11 min-w-[170px] items-center justify-center gap-2 overflow-hidden rounded-full bg-[#0f1a17] px-7 text-[#7fffc3] shadow-[0_10px_30px_-8px_rgba(127,255,195,0.55)] transition hover:shadow-[0_14px_36px_-8px_rgba(127,255,195,0.75)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#7fffc3]/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {mode === "humanizing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Humanizing
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Humanize
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-300/50 bg-red-50 px-5 py-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {detectResult && <DetectPanel result={detectResult} />}
      {humanizeResult && <HumanizedPanel result={humanizeResult} />}
    </div>
  );
}

function HumanizedPanel({ result }: { result: HumanizeResponse }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.humanized_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* Connector arrow */}
      <div className="mt-6 mb-2 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#80c1a2]/40 bg-white shadow-sm">
          <ArrowDown className="h-4 w-4 text-[#0f1a17]" />
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(127,255,195,0.35),transparent_70%)] blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-[#80c1a2]/40 bg-white shadow-[0_20px_60px_-20px_rgba(127,255,195,0.4)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#0f1a17]/8 bg-[#d6ffec] px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f1a17]">
                <Check className="h-3.5 w-3.5 text-[#7fffc3]" />
              </div>
              <span className="typo-label text-[#0f1a17]">Humanized</span>
              <span className="typo-label text-[#0f1a17]/40">
                · {result.new_word_count} words
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="typo-button inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0f1a17] px-4 text-[#7fffc3] transition hover:shadow-lg hover:shadow-[#7fffc3]/30"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="whitespace-pre-wrap px-8 py-7 text-[15px] leading-[1.75] text-[#0f1a17]">
            {result.humanized_text}
          </div>

          <div className="grid grid-cols-4 divide-x divide-[#0f1a17]/8 border-t border-[#0f1a17]/8 bg-[#f5faf8]">
            <Stat label="Words" value={result.new_word_count} />
            <Stat label="Sentences" value={result.new_sentence_count} />
            <Stat label="Words +" value={`+${result.words_added}`} />
            <Stat label="Sentences +" value={`+${result.sentences_added}`} />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4">
      <span className="typo-label text-[#0f1a17]/50">{label}</span>
      <span className="font-display text-2xl text-[#0f1a17]">{value}</span>
    </div>
  );
}

function DetectPanel({ result }: { result: DetectResponse }) {
  const aiScore = result.ai_score;
  const humanScore = result.human_score;
  const verdict =
    aiScore >= 70 ? "Likely AI" : aiScore >= 40 ? "Mixed" : "Likely human";
  const verdictClass =
    aiScore >= 70
      ? "bg-red-100 text-red-800 border-red-200"
      : aiScore >= 40
      ? "bg-amber-100 text-amber-900 border-amber-200"
      : "bg-[#d6ffec] text-[#0f1a17] border-[#80c1a2]/40";

  return (
    <>
      <div className="mt-6 mb-2 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0f1a17]/15 bg-white shadow-sm">
          <ArrowDown className="h-4 w-4 text-[#0f1a17]" />
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(127,255,195,0.25),transparent_70%)] blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-[#0f1a17]/10 bg-white shadow-[0_20px_60px_-20px_rgba(15,26,23,0.15)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#0f1a17]/8 bg-[#f5faf8] px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f1a17]">
                <ScanSearch className="h-3.5 w-3.5 text-[#7fffc3]" />
              </div>
              <span className="typo-label text-[#0f1a17]">
                Detection result
              </span>
            </div>
            <span
              className={`typo-label inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${verdictClass}`}
            >
              {verdict}
            </span>
          </div>

          <div className="space-y-5 px-8 py-7">
            <ScoreRow
              label="Human written"
              value={humanScore}
              fill="bg-gradient-to-r from-[#7fffc3] to-[#80c1a2]"
            />
            <ScoreRow
              label="AI generated"
              value={aiScore}
              fill="bg-gradient-to-r from-[#ff7a7a] to-[#e03a3a]"
            />
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#0f1a17]/8 border-t border-[#0f1a17]/8 bg-[#f5faf8] sm:grid-cols-4">
            {Object.entries(result.percentages).map(([k, v]) => (
              <Stat key={k} label={k} value={`${v.toFixed(1)}%`} />
            ))}
          </div>

          <p className="border-t border-[#0f1a17]/8 bg-white px-6 py-3 text-center text-xs text-[#0f1a17]/50">
            AI detection is probabilistic — treat scores as a signal, not a
            verdict.
          </p>
        </div>
      </div>
    </>
  );
}

function ScoreRow({
  label,
  value,
  fill,
}: {
  label: string;
  value: number;
  fill: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="typo-label text-[#0f1a17]/70">{label}</span>
        <span className="font-display text-xl text-[#0f1a17]">
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#0f1a17]/5">
        <div
          className={`h-full rounded-full ${fill} transition-all duration-700`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
