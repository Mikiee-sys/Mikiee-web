export function HeroArt() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[5/3] w-full overflow-hidden bg-purple sm:aspect-[4/3] lg:aspect-[4/5]"
    >
      <svg
        viewBox="0 0 640 760"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="64" y="72" width="340" height="520" fill="#fbfaf6" />
        <rect x="64" y="72" width="340" height="10" fill="#f0c400" />
        <rect x="112" y="250" width="180" height="6" fill="#2a1248" />
        <rect x="112" y="278" width="112" height="6" fill="#2a1248" fillOpacity="0.28" />
        <rect x="436" y="168" width="64" height="64" fill="#f0c400" />
      </svg>
    </div>
  );
}
