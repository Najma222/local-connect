import './globals.css';
import { Outfit, Caveat } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import Navbar from '@/components/Navbar';

const body = Outfit({ subsets: ['latin'], variable: '--font-body' });
const hand = Caveat({ subsets: ['latin'], weight: '600', variable: '--font-hand' });

export const metadata = {
  title: 'Local Connect: every shop in your neighbourhood',
  description: 'Browse local shops, order products, book services and track your order.',
  manifest: '/manifest.json',
  icons: { apple: '/apple-touch-icon.png', icon: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Local Connect', statusBarStyle: 'default' },
};
export const viewport = { themeColor: '#F6F5FA', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${hand.variable}`}>
      <body>
        <AppProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-5 pb-32 pt-2">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
