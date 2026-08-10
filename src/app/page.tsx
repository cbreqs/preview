import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SITES, STATUS_LABELS } from '@/lib/sites';

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-24">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preview</h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          Work in progress, published early so you can see it and say what you think.
          Pick your site below. Nothing here is final.
        </p>
      </header>

      <ul className="space-y-4">
        {SITES.map((site) => (
          <li key={site.slug}>
            <Link
              href={`/${site.slug}`}
              className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{site.name}</span>
                    <span className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {STATUS_LABELS[site.status]}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{site.summary}</p>
                  <p className="text-muted-foreground/70 mt-2 font-mono text-xs">
                    preview.reqs.tech/{site.slug}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="text-muted-foreground mt-16 border-t pt-6 text-sm">
        Built by{' '}
        <a href="https://reqs.tech" className="hover:text-foreground underline underline-offset-4">
          reqs.tech
        </a>
      </footer>
    </main>
  );
}
