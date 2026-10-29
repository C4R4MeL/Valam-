import { redirect } from 'next/navigation';
export default function BuyerMatching({ params }: { params: { locale: string } }) { redirect('/' + params.locale + '/matching'); }
