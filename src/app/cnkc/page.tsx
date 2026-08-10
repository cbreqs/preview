import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/SiteShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSite } from '@/lib/sites';

const SLUG = 'cnkc';

export const metadata: Metadata = {
  title: 'CNKC — Preview',
  description: 'Preview of the CNKC site.',
};

// Sections planned for this site. Each becomes a route under /cnkc once its
// content exists; until then this is the honest state of play.
const SECTIONS = [
  { name: 'Home', note: 'Landing page and introduction.' },
  { name: 'Calendar', note: 'Events, backed by Firestore.' },
  { name: 'Documents', note: 'Downloadable files, backed by Firebase Storage.' },
  { name: 'Contact', note: 'How to get in touch.' },
];

export default function CnkcPage() {
  const site = getSite(SLUG);
  if (!site) notFound();

  return (
    <SiteShell site={site}>
      <section>
        <h2 className="mb-4 text-lg font-medium">Planned sections</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.name}>
              <CardHeader>
                <CardTitle className="text-base">{section.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{section.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-muted-foreground mt-10 text-sm leading-relaxed">
        Nothing here is built yet — this page exists so the address works and you can
        watch it fill in. The calendar and documents both need content before they do
        anything useful.
      </p>
    </SiteShell>
  );
}
