import type { Metadata } from 'next';
import { Cormorant_Garamond, Pinyon_Script, Prata } from 'next/font/google';
import './globals.css';

const headingFont = Prata({ subsets: ['latin'], weight: '400', variable: '--font-heading' });
// Pinyon Script: fallback cross-platform per Lucida Calligraphy (non disponibile su iOS/Android)
const pinyonFont = Pinyon_Script({ subsets: ['latin'], weight: '400', variable: '--font-pinyon' });
const bodyFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Salvatore e Donatella',
  description: 'Invito al matrimonio di Salvatore e Donatella'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${headingFont.variable} ${bodyFont.variable} ${pinyonFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}

