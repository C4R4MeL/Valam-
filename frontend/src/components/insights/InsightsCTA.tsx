'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface InsightsCTAProps {
  locale: string;
}

export function InsightsCTA({ locale }: InsightsCTAProps) {
  const isEn = locale === 'en';
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-14 sm:py-20 bg-white relative overflow-hidden border-t border-zinc-100">
      <div className="absolute inset-0 bg-emerald-50/60" aria-hidden />
      <div className="container relative mx-auto px-4 sm:px-6 md:px-8 max-w-3xl text-center">
        <motion.h2
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4 tracking-tight leading-tight text-balance"
        >
          {isEn ? (
            <>
              Ready to find patchouli oil that{' '}
              <span className="text-emerald-700">fits your needs?</span>
            </>
          ) : (
            <>
              Siap menemukan minyak nilam yang{' '}
              <span className="text-emerald-700">sesuai kebutuhan Anda?</span>
            </>
          )}
        </motion.h2>
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-sm sm:text-base text-zinc-600 mb-8 leading-relaxed max-w-xl mx-auto text-pretty"
        >
          {isEn
            ? 'Browse verified products from the VALAM ecosystem.'
            : 'Jelajahi produk terverifikasi dari ekosistem VALAM.'}
        </motion.p>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
        >
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-sm sm:text-base bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-950/20 border-0 font-medium"
          >
            <Link href={`/${locale}/marketplace`}>
              {isEn ? 'Browse Marketplace' : 'Jelajahi Marketplace'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 text-sm sm:text-base rounded-xl bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            <Link href={`/${locale}/register`}>
              {isEn ? 'Join as Supplier' : 'Gabung sebagai Supplier'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
