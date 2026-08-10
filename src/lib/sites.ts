export type SiteStatus = 'in-progress' | 'review' | 'live';

export interface Site {
  /** URL segment — the site lives at preview.reqs.tech/{slug}. */
  slug: string;
  name: string;
  /** One line the client reads. Plain language, no jargon. */
  summary: string;
  status: SiteStatus;
}

/**
 * Every client site hosted under preview.reqs.tech. Adding a client means
 * adding an entry here and a folder at src/app/{slug}/ — the index page reads
 * from this list, so the two stay in step.
 */
export const SITES: Site[] = [
  {
    slug: 'cnkc',
    name: 'CNKC',
    summary: 'Multi-page site with a calendar and file downloads.',
    status: 'in-progress',
  },
  {
    slug: 'rubi',
    name: 'Rubi',
    summary: 'Single-page site.',
    status: 'in-progress',
  },
];

export const STATUS_LABELS: Record<SiteStatus, string> = {
  'in-progress': 'In progress',
  review: 'Ready for review',
  live: 'Live',
};

export function getSite(slug: string): Site | undefined {
  return SITES.find((site) => site.slug === slug);
}
