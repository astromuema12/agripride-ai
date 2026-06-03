import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/shared/Navbar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriPride AI - Agricultural Intelligence Platform',
  description: 'Empowering African farmers with AI-driven agricultural intelligence, disease diagnosis, weather monitoring, and sustainable farming practices.',
  keywords: 'agriculture, AI, farming, crop disease, weather, Africa, sustainability',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
