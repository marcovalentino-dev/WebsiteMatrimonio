import type { Metadata } from 'next';
import {
  Playfair_Display,
  Manrope,
  Cormorant_Garamond,
  Nunito,
  Prata,
  Montserrat
} from 'next/font/google';
import './globals.css';
import { ConfigProvider } from '@/components/providers/ConfigProvider';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-playfair' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-nunito' });
const prata = Prata({ subsets: ['latin'], weight: '400', variable: '--font-prata' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: 'Wedding Site',
  description: 'Elegant modern wedding website'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${playfair.variable} ${manrope.variable} ${cormorant.variable} ${nunito.variable} ${prata.variable} ${montserrat.variable}`}
    >
      <body className="bg-[#f8f5f1] text-[#201a19] antialiased">
        <ConfigProvider>{children}</ConfigProvider>
      </body>
    </html>
  );
}

