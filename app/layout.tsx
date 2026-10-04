import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reel Finder",
  description: "Search TV shows from the TVmaze catalogue",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800&family=Public+Sans:wght@400;600&display=swap"
        />
      </head>
      <body>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
