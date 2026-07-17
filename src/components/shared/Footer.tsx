'use client';

import Link from 'next/link';
import { Wheat, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebook, FaInstagram } from 'react-icons/fa';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#0f2219] text-white dark:bg-[#0a0f0c]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Top section — asymmetric */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-8">
          {/* Brand — takes more space */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <Wheat className="h-5 w-5 text-[#5e9a6b]" />
              <span className="font-display text-xl text-white">AgriPride</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50 max-w-sm font-body">
              {t('footer.description')}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white">
                <FaLinkedinIn className="h-4 w-4" />
              </a>
              <a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white">
                <FaFacebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white">
                <FaInstagram className="h-4 w-4" />
              </a>
              <a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white">
                <FaWhatsapp className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links — staggered columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <h4 className="mb-4 text-xs font-semibold tracking-widest uppercase text-white/30 font-body">{t('footer.platform')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/governance" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.governance')}</Link></li>
                <li><Link href="/analytics" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.analytics')}</Link></li>
                <li><Link href="/market" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.market')}</Link></li>
                <li><Link href="/horizon" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.analytics')}</Link></li>
                <li><Link href="/pricing" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold tracking-widest uppercase text-white/30 font-body">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/contact" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.contact')}</Link></li>
                <li><Link href="/support" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.support')}</Link></li>
                <li><Link href="/testimonials" className="text-white/60 transition-colors hover:text-white font-body">{t('nav.testimonials')}</Link></li>
                <li><Link href="/privacy" className="text-white/60 transition-colors hover:text-white font-body">{t('footer.privacy')}</Link></li>
                <li><Link href="/terms" className="text-white/60 transition-colors hover:text-white font-body">{t('footer.terms')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold tracking-widest uppercase text-white/30 font-body">{t('footer.contactUs')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:musauedwin2004@gmail.com" className="group flex items-center gap-2 text-white/60 transition-colors hover:text-white font-body">
                    <Mail className="h-3.5 w-3.5 text-[#c4704b]" />
                    <span className="break-all text-xs">musauedwin2004@gmail.com</span>
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/60 font-body">
                  <MapPin className="h-3.5 w-3.5 text-[#c4704b] shrink-0" /> {t('footer.location')}
                </li>
                <li>
                  <a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-white/60 transition-colors hover:text-white font-body">
                    <FaWhatsapp className="h-3.5 w-3.5 text-[#c4704b]" /> {t('footer.whatsapp')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/30 sm:flex-row font-body">
          <p>&copy; {new Date().getFullYear()} AgriPride AI Ltd. {t('footer.rights')}</p>
          <div className="flex items-center gap-1">
            <span>{t('footer.builtIn')}</span>
            <MapPin className="h-3 w-3 text-[#c4704b]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
