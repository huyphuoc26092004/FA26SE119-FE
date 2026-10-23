// CCV brand logo, drawn inline so the wordmark uses the page's Plus Jakarta Sans 800
// (an <img> SVG cannot load web fonts). Same paths and colours as public/ccv-logo-*.svg.

type CcvLogoProps = {
  /** "light" for light backgrounds, "dark" for dark backgrounds (no filled box). */
  tone?: 'light' | 'dark';
  /** Rendered height in px. Brand minimum is 24. */
  height?: number;
  /** Show only the C + tick mark, without the CCV wordmark. */
  markOnly?: boolean;
  className?: string;
};

const palette = {
  light: { ink: '#14231e', accent: '#0b6b52' },
  dark: { ink: '#ffffff', accent: '#7fd6b8' },
};

export function CcvLogo({ tone = 'light', height = 32, markOnly = false, className }: CcvLogoProps) {
  const { ink, accent } = palette[tone];
  // The source file is 220 x 56; the wordmark ends near x = 146, so the empty right side is trimmed.
  const width = markOnly ? 48 : 152;
  const viewHeight = markOnly ? 48 : 56;

  return (
    <svg
      role="img"
      aria-label="CCV"
      viewBox={`0 0 ${width} ${viewHeight}`}
      height={height}
      width={(height * width) / viewHeight}
      className={className}
    >
      <g transform={markOnly ? undefined : 'translate(4 4)'}>
        <path d="M24 11A13 13 0 0 0 24 37" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
        <path
          d="M27 24.5l5.5 5.5 9-12"
          fill="none"
          stroke={accent}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {!markOnly && (
        <text
          x={64}
          y={40}
          fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
          fontSize={38}
          fontWeight={800}
          letterSpacing={-1.2}
          fill={ink}
        >
          CC<tspan fill={accent}>V</tspan>
        </text>
      )}
    </svg>
  );
}

export default CcvLogo;
