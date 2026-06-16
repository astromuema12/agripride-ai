'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-xs sm:text-sm text-gray-600">
              We use essential cookies for authentication and security. Analytics cookies help us improve the platform.
              By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-emerald-600 underline hover:text-emerald-700">Privacy Policy</Link>.
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={reject}>
                Reject All
              </Button>
              <Button size="sm" onClick={accept}>
                Accept All
              </Button>
              <button onClick={reject} className="ml-1 rounded-full p-1 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
