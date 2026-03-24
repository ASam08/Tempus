interface TempusLogoProps {
  width?: number;
  height?: number;
  className?: string;
  showTagline?: boolean;
}

export default function TempusLogoBrand({
  width = 455,
  height = 178,
  className = "",
  showTagline = true,
}: TempusLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 455 178"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded rect */}
      <rect
        x="40"
        y="20"
        width="110"
        height="110"
        rx="16"
        fill="none"
        stroke="#3B7BE8"
        strokeWidth="2.5"
      />

      {/* Top header bar */}
      <rect x="40" y="20" width="110" height="26" rx="16" fill="#3B7BE8" />
      <rect x="40" y="32" width="110" height="14" fill="#3B7BE8" />

      {/* Inner grid lines - vertical */}
      <line
        x1="77"
        y1="46"
        x2="77"
        y2="130"
        stroke="#3B7BE8"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <line
        x1="113"
        y1="46"
        x2="113"
        y2="130"
        stroke="#3B7BE8"
        strokeWidth="1.5"
        opacity="0.35"
      />

      {/* Inner grid lines - horizontal */}
      <line
        x1="40"
        y1="72"
        x2="150"
        y2="72"
        stroke="#3B7BE8"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <line
        x1="40"
        y1="98"
        x2="150"
        y2="98"
        stroke="#3B7BE8"
        strokeWidth="1.5"
        opacity="0.35"
      />

      {/* Filled blocks */}
      <rect
        x="44"
        y="76"
        width="29"
        height="18"
        rx="4"
        fill="#3B7BE8"
        opacity="0.9"
      />
      <rect
        x="80"
        y="50"
        width="29"
        height="18"
        rx="4"
        fill="#3B7BE8"
        opacity="0.9"
      />
      <rect
        x="116"
        y="102"
        width="30"
        height="18"
        rx="4"
        fill="#3B7BE8"
        opacity="0.7"
      />
      <rect
        x="44"
        y="102"
        width="29"
        height="18"
        rx="4"
        fill="#3B7BE8"
        opacity="0.5"
      />

      {/* Wordmark - switches between dark and light text */}
      <text
        x="170"
        y="92"
        fontFamily="'Geist', latin"
        fontSize="52"
        fontWeight="500"
        letterSpacing="-1"
        className="fill-[#1a1a1a] dark:fill-white"
      >
        Tempus
      </text>

      {/* Tagline */}
      {showTagline && (
        <>
          <text
            x="172"
            y="122"
            fontFamily="'Geist Mono', monospace"
            fontSize="15"
            fontWeight="400"
            letterSpacing="2"
            className="fill-[#666666] dark:fill-[#aaaaaa]"
          >
            YOUR WEEK, AT A GLANCE
          </text>

          {/* Thin rule - switches between light and dark */}
          <line
            x1="30"
            y1="158"
            x2="425"
            y2="158"
            strokeWidth="1"
            className="stroke-[#e0e0e0] dark:stroke-[#333333]"
          />
        </>
      )}
    </svg>
  );
}
