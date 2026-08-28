import { Metadata } from 'next';
import { InsightsHub } from './InsightsHub';

export const metadata: Metadata = {
  title: 'Valam Insights — Knowledge Hub Industri Nilam',
  description:
    'Artikel, panduan, dan cerita koperasi seputar industri minyak nilam Indonesia. Edukasi mendalam, harga pasar terkini, dan kisah dari produsen terverifikasi.',
  keywords: [
    'nilam insights',
    'patchouli oil article',
    'harga nilam',
    'panduan nilam',
    'koperasi nilam',
    'minyak nilam Aceh',
  ],
  openGraph: {
    title: 'Valam Insights — Knowledge Hub Industri Nilam',
    description:
      'Artikel, panduan, dan cerita koperasi seputar industri minyak nilam Indonesia.',
    type: 'website',
  },
};

export default function InsightsPage() {
  return <InsightsHub />;
}
