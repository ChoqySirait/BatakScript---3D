'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Library, Feather, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',        label: 'Sandbox',    icon: Feather },
  { href: '/glyphs',  label: 'Kamus Glyph', icon: Library },
  { href: '/lessons', label: 'Pelajaran',  icon: BookOpen },
  { href: '/quiz',    label: 'Kuis Kilat', icon: Flame },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal-muted bg-charcoal/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="batak-text text-2xl text-gold glyph-glow select-none">ᯅ</span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-bone tracking-wide">BatakScript</p>
            <p className="text-xs text-bone-dim">3D · Surat Batak Toba</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-crimson text-bone'
                    : 'text-bone-muted hover:bg-charcoal-light hover:text-bone',
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

