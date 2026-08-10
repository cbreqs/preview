import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/SiteShell';
import { getSite } from '@/lib/sites';

const SLUG = 'rubi';

export const metadata: Metadata = {
  title: 'Rubi — Preview',
  description: 'Preview of the Rubi site.',
};

export default function RubiPage() {
  const site = getSite(SLUG);
  if (!site) notFound();

  return (
    <SiteShell site={site}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Nothing here is built yet — this page exists so the address works. Send over
        the text and images you want on it and it can take shape from there.
      </p>
    </SiteShell>
  );
}
