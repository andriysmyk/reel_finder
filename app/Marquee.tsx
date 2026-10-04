export default function Marquee({ subtitle }: { subtitle: string }) {
  return (
    <header className="marquee">
      <h1 className="marquee__title">Reel Finder</h1>
      <p className="marquee__subtitle">{subtitle}</p>
    </header>
  );
}
