import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#0f1a17]/10 bg-[#e5f0ed]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="group flex items-center gap-3">
          <BrandLogo size={34} />
          <span className="font-display text-2xl tracking-tight text-[#0f1a17]">
            humanzise<span className="text-[#7fffc3]">.</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="typo-label text-[#0f1a17]/70 transition hover:text-[#0f1a17]"
          >
            Humanizer
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#80c1a2]/40 bg-[#d6ffec] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f1a17]" />
            <span className="typo-label text-[#0f1a17]">Free · No signup</span>
          </span>
        </div>
      </div>
    </header>
  );
}
