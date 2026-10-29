export type CrawlSourceSite = 'ITVIEC' | 'TOPCV';

export type CrawlRunStatus = 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

export type CrawlItemStatus =
  | 'SEARCH_FETCHED'
  | 'SEARCH_FETCH_FAILED'
  | 'IMPORTED'
  | 'DUPLICATE'
  | 'EXPIRED'
  | 'WRONG_REGION'
  | 'FETCH_FAILED'
  | 'REJECTED'
  | 'IMPORT_FAILED';

/** One search the scheduler (or a manual run) performs on a job site. */
export interface CrawlSource {
  sourceSite: CrawlSourceSite;
  keyword: string;
  roleCategory: string;
  location: string;
  limit: number;
  maxPages: number;
}

export interface CrawlRunInput extends CrawlSource {
  /** Explicit job detail URLs; when given the site search is skipped. */
  urls: string[];
}

export interface CrawlSettings {
  enabled: boolean;
  /** ISO-8601 duration, e.g. PT6H. */
  fixedDelay: string;
  actorId: string | null;
  sources: CrawlSource[];
  configurationSource: 'ENVIRONMENT' | 'DATABASE';
  version: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface CrawlSettingsInput {
  enabled: boolean;
  fixedDelay: string;
  actorId: string | null;
  sources: CrawlSource[];
}

export interface CrawlItem {
  id: string;
  sourceUrl: string | null;
  status: CrawlItemStatus | string;
  httpStatus: number | null;
  jobTitle: string | null;
  message: string | null;
  createdAt: string | null;
}

export interface CrawlRun {
  id: string;
  sourceSite: string;
  keyword: string;
  roleCategory: string;
  location: string | null;
  requestedLimit: number;
  status: CrawlRunStatus | string;
  message: string | null;
  searchPagesChecked: number;
  candidateUrlsDiscovered: number;
  detailPagesChecked: number;
  fetchedUrls: number;
  parsedJobs: number;
  importedJobs: number;
  importedSkills: number;
  skippedDuplicates: number;
  wrongRegionPages: number;
  rejectedPages: number;
  requestedBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Only present when the run is loaded on its own (detail or fresh result). */
  items?: CrawlItem[];
}
