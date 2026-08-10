import Link from 'next/link';
import type { ReactNode } from 'react';
import { STATUS_LABELS, type Site } from '@/lib/sites';

/**
 * Common frame for a client site preview: a way back to the index and a
 * header naming the site. Individual sites fill in the body.
 */
export function SiteShell({ site, children }: { site: Site; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
      >
        ← All previews
      </Link>

      <header className="mt-8 mb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{site.name}</h1>
          <span className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
            {STATUS_LABELS[site.status]}
          </span>
        </div>
        <p className="text-muted-foreground mt-3 leading-relaxed">{site.summary}</p>
      </header>

      {children}
    </main>
  );
}
