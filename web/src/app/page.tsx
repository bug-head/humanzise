import { SiteHeader } from "@/components/site-header";
import { DetectorTool } from "@/components/detector-tool";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#e5f0ed] text-[#0f1a17]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-[#d6ffec] via-[#e5f0ed] to-[#e5f0ed]" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />

      <div className="relative z-10 flex flex-1 flex-col">
        <SiteHeader />

        <main className="flex-1">
          <section className="mx-auto max-w-6xl px-6 pb-24 pt-20">
            <div className="mb-14 flex flex-col items-center text-center">
              <span className="typo-label mb-6 inline-flex items-center gap-2 rounded-full border border-[#80c1a2]/40 bg-white/60 px-4 py-1.5 text-[#0f1a17] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7fffc3] shadow-[0_0_8px_#7fffc3]" />
                100% Free
              </span>

              <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-[-0.03em] text-[#0f1a17] sm:text-6xl md:text-7xl">
                Make AI text
                <br />
                sound{" "}
                <span className="relative inline-block italic">
                  human
                  <svg
                    className="absolute -bottom-2 left-0 h-3 w-full"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q 50 2, 100 6 T 198 4"
                      stroke="#7fffc3"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-[#0f1a17]/70 sm:text-lg">
                Paste any AI-generated text and we&apos;ll rewrite it to feel
                natural — while keeping your citations and meaning intact.
                Forever free.
              </p>
            </div>

            <DetectorTool />
          </section>
        </main>

        <footer className="border-t border-[#0f1a17]/10 bg-[#e5f0ed]/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-6">
            <p className="typo-label text-[#0f1a17]/60">
              © {new Date().getFullYear()} Humanzise
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
