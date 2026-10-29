import { redirect } from 'next/navigation';

export default function LegacyProductDetail({ params }: { params: { locale: string; id: string } }) {
  redirect('/' + params.locale + '/katalog/' + encodeURIComponent(params.id));
}
