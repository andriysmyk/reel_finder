import Link from "next/link";

export default function Marquee({ subtitle }: { subtitle?: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Reel Finder home">Reel <span>Finder</span></Link>
      {subtitle ? <span className="header-caption">{subtitle}</span> : (
        <nav aria-label="Main navigation">
          <Link href="/" className="nav-home">Home</Link>
          <a href="#results">Discover</a>
          <a href="#search" className="nav-search" aria-label="Go to search">⌕</a>
        </nav>
      )}
    </header>
  );
}
