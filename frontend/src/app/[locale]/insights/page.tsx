import { Metadata } from 'next';
import { Suspense } from 'react';
import { InsightsHub } from './InsightsHub';

export const metadata: Metadata = {
  title: 'Insights Minyak Nilam — Harga, Kualitas & Tren Pasar | VALAM',
  description:
    'Pusat informasi VALAM mengenai harga minyak nilam, kualitas Patchouli Alcohol (PA), tren permintaan, dan rantai pasok untuk petani, penyuling, koperasi, dan buyer.',
  keywords: [
    'insights minyak nilam',
    'harga nilam Aceh',
    'patchouli alcohol',
    'pasar minyak nilam',
    'kualitas nilam',
    'supply chain nilam',
  ],
  openGraph: {
    title: 'Insights Minyak Nilam | VALAM',
    description:
      'Informasi pasar, harga, kualitas, dan tren industri minyak nilam untuk keputusan yang lebih tepat.',
    type: 'website',
  },
};

export default function InsightsPage() {
  return (
    <Suspense fallback={null}>
      <InsightsHub />
    </Suspense>
  );
}
