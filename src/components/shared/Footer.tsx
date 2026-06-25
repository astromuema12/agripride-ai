import Link from 'next/link';
import { Wheat, Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebook, FaInstagram } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="border-t border-gray-800 dark:border-gray-800 bg-gray-950 dark:bg-gray-950 text-gray-300 dark:text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <Wheat className="h-5 w-5 text-white dark:text-white" />
              </div>
              <span className="text-lg font-bold text-white dark:text-slate-900">AgriPride AI</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400 dark:text-gray-400">
              Empowering African agriculture with responsible artificial intelligence. Built in Kenya, for Africa.
            </p>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/governance" className="transition-colors hover:text-emerald-400">AI Governance</Link></li>
              <li><Link href="/analytics" className="transition-colors hover:text-emerald-400">Analytics</Link></li>
              <li><Link href="/market" className="transition-colors hover:text-emerald-400">Market Intelligence</Link></li>
              <li><Link href="/horizon" className="transition-colors hover:text-emerald-400">Impact Dashboard</Link></li>
              <li><Link href="/pricing" className="transition-colors hover:text-emerald-400">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="transition-colors hover:text-emerald-400">Contact</Link></li>
              <li><Link href="/support" className="transition-colors hover:text-emerald-400">Support</Link></li>
              <li><Link href="/testimonials" className="transition-colors hover:text-emerald-400">Testimonials</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-emerald-400">Terms of Service</Link></li>
              <li><Link href="/account-deletion" className="transition-colors hover:text-emerald-400">Account Deletion Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white dark:text-slate-900">Contact & Social</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:musauedwin2004@gmail.com" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><Mail className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" /> <span className="break-all">musauedwin2004@gmail.com</span></a></li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-400 shrink-0" /> Nairobi, Kenya</li>
              <li><a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaWhatsapp className="h-4 w-4 text-green-400 transition-transform group-hover:scale-110 shrink-0" /> WhatsApp</a></li>
              <li><a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaLinkedinIn className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110 shrink-0" /> LinkedIn</a></li>
              <li><a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaFacebook className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110 shrink-0" /> Facebook</a></li>
              <li><a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-emerald-400"><FaInstagram className="h-4 w-4 text-pink-400 transition-transform group-hover:scale-110 shrink-0" /> Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-4 border-t border-gray-800 dark:border-gray-800 pt-8 text-center text-sm sm:flex-row sm:justify-between">
          <p className="text-gray-300 dark:text-gray-300">&copy; {new Date().getFullYear()} AgriPride AI Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
