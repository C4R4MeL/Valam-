import { Metadata } from 'next';
import { ChatHub } from './ChatHub';

export const metadata: Metadata = {
  title: 'Tanya Nila — Asisten AI Minyak Nilam Valam',
  description:
    'Hubungi Nila, asisten pintar berbasis AI di platform Valam. Panduan platform; akses langsung ke harga, stok, dokumen batch dan akun belum tersedia.',
  keywords: [
    'nila ai',
    'asisten ai nilam',
    'valam chat',
    'harga minyak nilam',
    'kualitas minyak nilam',
  ],
  openGraph: {
    title: 'Tanya Nila — Asisten AI Minyak Nilam Valam',
    description:
      'Hubungi Nila, asisten pintar berbasis AI di platform Valam untuk panduan dan informasi minyak nilam.',
    type: 'website',
  },
};

export default function ChatPage() {
  return <ChatHub />;
}
