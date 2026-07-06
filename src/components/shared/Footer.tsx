'use client';

import Link from 'next/link';
import { Wheat, Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebook, FaInstagram } from 'react-icons/fa';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#0f766e] text-white dark:bg-[#0a3a36]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                <Wheat className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AgriPride AI</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/governance" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.governance')}</Link></li>
              <li><Link href="/analytics" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.analytics')}</Link></li>
              <li><Link href="/market" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.market')}</Link></li>
              <li><Link href="/horizon" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.analytics')}</Link></li>
              <li><Link href="/pricing" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.pricing')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.contact')}</Link></li>
              <li><Link href="/support" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.support')}</Link></li>
              <li><Link href="/testimonials" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('nav.testimonials')}</Link></li>
              <li><Link href="/privacy" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('footer.privacy')}</Link></li>
              <li><Link href="/terms" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('footer.terms')}</Link></li>
              <li><Link href="/account-deletion" className="text-white/70 transition-colors hover:text-[#6ee7b7]">{t('footer.terms')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold tracking-wide text-white">{t('footer.contactUs')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:musauedwin2004@gmail.com" className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#6ee7b7]"><Mail className="h-4 w-4 text-[#6ee7b7] transition-transform group-hover:scale-110" /> <span className="break-all">musauedwin2004@gmail.com</span></a></li>
              <li className="flex items-center gap-2 text-white/70"><MapPin className="h-4 w-4 text-[#6ee7b7] shrink-0" /> Nairobi, Kenya</li>
              <li><a href="https://whatsapp.com/dl/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#6ee7b7]"><FaWhatsapp className="h-4 w-4 text-[#6ee7b7] transition-transform group-hover:scale-110 shrink-0" /> WhatsApp</a></li>
              <li><a href="https://www.linkedin.com/in/edwin-musau-b8363a318" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#6ee7b7]"><FaLinkedinIn className="h-4 w-4 text-[#6ee7b7] transition-transform group-hover:scale-110 shrink-0" /> LinkedIn</a></li>
              <li><a href="https://www.facebook.com/share/18D8KpS3Ut/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#6ee7b7]"><FaFacebook className="h-4 w-4 text-[#6ee7b7] transition-transform group-hover:scale-110 shrink-0" /> Facebook</a></li>
              <li><a href="https://www.instagram.com/edwin_musau" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#6ee7b7]"><FaInstagram className="h-4 w-4 text-[#6ee7b7] transition-transform group-hover:scale-110 shrink-0" /> Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-4 border-t border-white/20 pt-8 text-center text-sm sm:flex-row sm:justify-between">
          <p className="text-white/70">&copy; {new Date().getFullYear()} AgriPride AI Ltd. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
