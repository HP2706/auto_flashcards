import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata = {
  title: "Auto Flashcards",
  description: "Markdown + pluggable SRS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', margin: 0 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Auto Flashcards</h1>
            <nav style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <a href="/">Study</a>
              <a href="/cards">Cards</a>
              <a href="/about">About</a>
              <a href="/stats">Stats</a>
              <span style={{ opacity: 0.5 }}>|</span>
              <a href="/cards/new">New</a>
              <a href="/groups/new">New Group</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
