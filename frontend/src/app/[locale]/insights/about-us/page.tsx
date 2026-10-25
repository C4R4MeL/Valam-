import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { teamMembers } from '@/lib/team';

type PageProps = { params: { locale: string } };

export function generateMetadata({ params: { locale } }: PageProps): Metadata {
  return {
    title: 'About Us | Tim VALAM',
    description: locale === 'en'
      ? 'Meet the VALAM team: Muhammad Azlan, Maulana Shidqi Albadawie, and Muhammad Farhan Alafif.'
      : 'Kenali tim VALAM: Muhammad Azlan, Maulana Shidqi Albadawie, dan Muhammad Farhan Alafif.',
  };
}

export default function AboutUsPage({ params }: PageProps) {
  const locale = params.locale === 'en' ? 'en' : 'id';
  const isEn = locale === 'en';

  return (
    <div className="flex min-h-screen flex-col font-sans valam-grid-bg selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-200/70 pt-28 pb-10 sm:pt-32 sm:pb-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-transparent to-gold-50/50" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav aria-label={isEn ? 'Breadcrumb' : 'Jejak navigasi'} className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
              <Link href="/insights" className="rounded-sm transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4">
                Insights
              </Link>
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              <span aria-current="page" className="text-emerald-800">About Us</span>
            </nav>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">About Us</p>
            <h1 className="max-w-3xl text-balance font-serif text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              {isEn ? 'Meet the people behind VALAM.' : 'Kenali tim di balik VALAM.'}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base">
              {isEn
                ? 'Meet Muhammad Azlan, Maulana Shidqi Albadawie, and Muhammad Farhan Alafif — the team behind VALAM, a platform for the Indonesian patchouli oil ecosystem.'
                : 'Berkenalan dengan Muhammad Azlan, Maulana Shidqi Albadawie, dan Muhammad Farhan Alafif — tim di balik VALAM, platform untuk ekosistem minyak nilam Indonesia.'}
            </p>
          </div>
        </section>

        <section aria-labelledby="team-heading" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mb-7 sm:mb-9">
            <div aria-hidden="true" className="mb-4 h-0.5 w-10 bg-gold-400" />
            <h2 id="team-heading" className="font-serif text-2xl font-bold text-zinc-900 sm:text-3xl">
              {isEn ? 'Our team' : 'Tim kami'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {teamMembers.map((member) => (
              <article key={member.id} aria-labelledby={`name-${member.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                <div className="relative mx-4 mt-4 aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 via-emerald-50 to-gold-50">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={isEn ? `Portrait of ${member.name}` : `Potret ${member.name}`}
                      fill
                      priority
                      sizes="(min-width: 1280px) 352px, (min-width: 768px) 30vw, calc(100vw - 66px)"
                      className="object-contain object-bottom"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                      <div aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-700/10 bg-white/60 font-serif text-3xl text-emerald-800 shadow-sm sm:h-28 sm:w-28">
                        {member.initials}
                      </div>
                      <p className="text-xs font-medium tracking-wide text-emerald-800/80">
                        {isEn ? 'Photo coming soon' : 'Foto segera hadir'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col px-6 pt-6 pb-7 lg:px-7">
                  <h3 id={`name-${member.id}`} className="min-h-[3.5rem] font-serif text-xl font-bold leading-snug text-zinc-900">
                    {member.name}
                  </h3>
                  <p className={`mt-3 text-xs font-medium ${member.role ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {member.role?.[locale] ?? (isEn ? 'Role to be added' : 'Peran akan dilengkapi')}
                  </p>
                  <div className="mt-5 border-t border-zinc-100 pt-4">
                    <p className="text-sm leading-relaxed text-zinc-500">
                      {member.bio?.[locale] ?? (isEn ? 'A short profile will be added soon.' : 'Profil singkat akan ditambahkan.')}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Link href="/insights" className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4 sm:mt-12">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {isEn ? 'Back to Insights' : 'Kembali ke Insights'}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
