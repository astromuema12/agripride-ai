import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { Toaster } from 'sonner';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'AgriPride AI — Intelligence for African Agriculture',
  description: 'AI-powered crop disease diagnosis, weather intelligence, and sustainable farming tools built for African farmers.',
  keywords: 'agriculture, AI, farming, crop disease, weather, Africa, sustainability',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerif.variable}`}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <CookieConsent />
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
