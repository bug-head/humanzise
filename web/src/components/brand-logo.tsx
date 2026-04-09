interface BrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * Humanzise brand mark.
 * A rounded dark square with an italic serif "h" in mint,
 * offset by a small mint sparkle accent.
 */
export function BrandLogo({ size = 36, className = "" }: BrandLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft mint glow */}
      <div className="absolute inset-0 rounded-[10px] bg-[#7fffc3] opacity-30 blur-md" />

      {/* Dark mark */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#0f1a17] shadow-[inset_0_1px_0_rgba(127,255,195,0.15)]">
        {/* Subtle gradient sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(127,255,195,0.18),transparent_60%)]" />

        {/* Italic serif h */}
        <span
          className="font-display relative leading-none text-[#7fffc3]"
          style={{
            fontSize: size * 0.7,
            fontStyle: "italic",
            transform: "translateY(2%)",
          }}
        >
          h
        </span>
      </div>

      {/* Sparkle dot top-right */}
      <svg
        className="absolute -right-0.5 -top-0.5"
        width={size * 0.3}
        height={size * 0.3}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z"
          fill="#7fffc3"
          className="drop-shadow-[0_0_4px_#7fffc3]"
        />
      </svg>
    </div>
  );
}
