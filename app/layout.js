import './globals.css';
import { Outfit, Caveat } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import RegisterSW from '@/components/RegisterSW';
import InstallHint from '@/components/InstallHint';

const body = Outfit({ subsets: ['latin'], variable: '--font-body' });
const hand = Caveat({ subsets: ['latin'], weight: '600', variable: '--font-hand' });

export const metadata = {
  title: 'Local Connect: every shop in your neighbourhood',
  description: 'Browse local shops, order products, book services and track your order.',
  manifest: '/manifest.json',
  icons: { apple: '/apple-touch-icon.png', icon: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Local Connect', statusBarStyle: 'default' },
  other: { 'mobile-web-app-capable': 'yes', 'apple-mobile-web-app-title': 'Local Connect' },
};
export const viewport = { themeColor: '#F6F5FA', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${hand.variable}`}>
      <body>
        <AppProvider>
          <ToastProvider>
            <Navbar />
            <main className="w-full pb-nav mx-auto max-w-6xl px-3 pt-2 sm:px-6 lg:px-8">{children}</main>
            <InstallHint />
            <RegisterSW />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
