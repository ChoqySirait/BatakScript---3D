import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BatakScript 3D — Pelajari Surat Batak Toba',
  description:
    'Platform interaktif berbasis web untuk mempelajari Surat Batak Toba dengan visualisasi 3D, mesin transliterasi cerdas, dan X-Ray Inspector.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-charcoal text-bone antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-charcoal-border py-6 text-center text-xs text-bone-dim">
          <span className="batak-text mr-2 text-lg text-gold">ᯅᯖᯂ᯲</span>
          BatakScript 3D · Melestarikan Surat Batak Toba
        </footer>
      </body>
    </html>
  );
}
