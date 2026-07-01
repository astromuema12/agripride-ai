import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AgriPride AI - Agricultural Intelligence Platform',
  description: 'Empowering African farmers with AI-driven agricultural intelligence, disease diagnosis, weather monitoring, and sustainable farming practices.',
  keywords: 'agriculture, AI, farming, crop disease, weather, Africa, sustainability',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
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
