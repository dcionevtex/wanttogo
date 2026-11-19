export function MapArt() {
  return (
    <svg
      viewBox="0 0 540 450"
      fill="none"
      aria-hidden="true"
      className="map-art"
    >
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" stroke="#b9c1ad" strokeWidth=".6" />
        </pattern>
      </defs>
      <circle
        cx="270"
        cy="230"
        r="192"
        stroke="#d5d9cb"
        strokeDasharray="3 7"
      />
      <g transform="rotate(-9 270 230)">
        <path
          d="m74 105 133 24 132-25 128 25v244l-128-24-132 25-133-25Z"
          fill="#e6eadc"
          stroke="#b7bfae"
        />
        <path d="m74 105 133 24v245L74 349Z" fill="#f3f2e5" />
        <path d="m339 104 128 25v244l-128-24Z" fill="#f3f2e5" />
        <path
          d="m74 105 133 24 132-25 128 25v244l-128-24-132 25-133-25Z"
          fill="url(#grid)"
        />
        <path
          d="M80 290c55-88 106-16 164-78s120-55 218-15"
          stroke="#b8d3d1"
          strokeWidth="27"
        />
        <path
          d="m91 157 74 51 83-36 74 71 113 41M128 334l25-83 78 25 65 70M377 130l-32 77 39 99"
          stroke="#faf9f1"
          strokeWidth="12"
        />
        <path
          d="M207 130v243m132-269v245"
          stroke="#bac0b1"
          strokeDasharray="5 5"
        />
        <path
          d="M156 270c19-26 40-65 74-54s41 75 74 52 25-67 66-86"
          stroke="#b34b37"
          strokeWidth="2.5"
          strokeDasharray="5 7"
        />
        <circle
          cx="157"
          cy="269"
          r="7"
          fill="#b34b37"
          stroke="#fffaf0"
          strokeWidth="4"
        />
        <g transform="translate(350 135)">
          <path
            d="M20 0C9 0 0 9 0 20c0 16 20 34 20 34s20-18 20-34C40 9 31 0 20 0Z"
            fill="#b34b37"
          />
          <circle cx="20" cy="19" r="7" fill="#fff8e9" />
        </g>
      </g>
      <g transform="rotate(8 399 348)">
        <rect
          x="326"
          y="314"
          width="160"
          height="62"
          rx="4"
          fill="#fffdf6"
          stroke="#d1c9b9"
        />
        <circle cx="352" cy="345" r="12" stroke="#9cae9a" />
        <path d="m347 345 4 4 7-8" stroke="#546b53" strokeWidth="2" />
        <text
          x="374"
          y="342"
          fill="#323d31"
          fontSize="12"
          fontFamily="var(--font-helvetica)"
        >
          A little closer
        </text>
        <text
          x="374"
          y="358"
          fill="#73776a"
          fontSize="10"
          fontFamily="var(--font-helvetica)"
        >
          to your next discovery.
        </text>
      </g>
      <path d="m95 67 5-15 5 15 15 5-15 5-5 15-5-15-15-5Z" fill="#b34b37" />
      <text
        x="433"
        y="75"
        fill="#6b7764"
        fontSize="12"
        fontFamily="var(--font-helvetica)"
      >
        N
      </text>
      <path d="m438 86-5 16 5-3 5 3Z" fill="#6b7764" />
    </svg>
  );
}
