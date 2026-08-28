'use client';

import { motion } from 'framer-motion';
import type { InsightAuthor } from '@/lib/valam-insights/types';

interface AuthorCardProps {
  author: InsightAuthor;
  locale: string;
}

export function AuthorCard({ author, locale }: AuthorCardProps) {
  const isEn = locale === 'en';
  const isSupplier = !!author.supplier_profile_id;
  const bio = isEn && author.bio_en
    ? author.bio_en
    : author.bio_id || (isEn
      ? 'Contributing writer & industry specialist at Valam Insights.'
      : 'Penulis kontributor & spesialis industri di Valam Insights.');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-emerald-50 to-white
        border border-emerald-100 rounded-2xl p-6 my-8"
    >
      <p className="text-xs font-semibold text-gray-400 uppercase
        tracking-widest mb-4">
        {isEn ? 'About the Author' : 'Tentang Penulis'}
      </p>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-800 ring-2 ring-emerald-200">
              {author.name.charAt(0)}
            </div>
          )}
          {isSupplier && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{author.name}</h3>
            {isSupplier && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                ✓ {isEn ? 'Verified Cooperative' : 'Koperasi Terverifikasi'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {bio}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {isSupplier && author.supplier_profile_id && (
              <>
                <a
                  href={`/marketplace/supplier/${author.supplier_profile_id}`}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  {isEn ? 'View Supplier Profile →' : 'Lihat Profil Supplier →'}
                </a>

                <motion.a
                  href={`/marketplace?supplier=${author.supplier_profile_id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isEn ? 'Request RFQ' : 'Ajukan RFQ'}
                </motion.a>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AuthorCard;
