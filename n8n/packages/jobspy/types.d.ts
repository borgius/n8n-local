/**
 * Type definitions for JobSpy package
 */

/**
 * Search parameters for job searches
 */
export interface SearchParams {
  /**
   * Comma-separated list of job sites to search.
   * Options: indeed,linkedin,zip_recruiter,glassdoor,google,bayt,naukri
   * @default "indeed"
   */
  siteNames?: string;
  
  /**
   * Search term for jobs
   * @default "software engineer"
   */
  searchTerm?: string;
  
  /**
   * Location for job search
   * @default "San Francisco, CA"
   */
  location?: string;
  
  /**
   * Google specific search term
   * @default null
   */
  googleSearchTerm?: string | null;
  
  /**
   * Number of results wanted
   * @default 20
   */
  resultsWanted?: number;
  
  /**
   * How many hours old the jobs can be
   * @default 72
   */
  hoursOld?: number;
  
  /**
   * Country for Indeed search
   * @default "USA"
   */
  countryIndeed?: string;
  
  /**
   * Whether to fetch LinkedIn job descriptions (slower)
   * @default false
   */
  linkedinFetchDescription?: boolean;
  
  /**
   * Comma-separated list of proxies
   * @default null
   */
  proxies?: string | null;
  
  /**
   * Output format
   * @default "json"
   */
  format?: 'json' | 'csv';
}
