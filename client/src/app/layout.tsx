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
      <body className="min-h-screen bg-[#0D0D0E] text-bone antialiased overflow-x-hidden">
        <Navbar />
        <main className="relative min-h-[calc(100vh-3.8rem)] w-full">{children}</main>
      </body>
    </html>
  );
}
