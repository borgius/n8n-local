export interface SearchParams {
  siteNames?: string | string[];
  searchTerm?: string;
  location?: string;
  distance?: number;
  jobType?: 'fulltime' | 'parttime' | 'internship' | 'contract' | null;
  googleSearchTerm?: string | null;
  resultsWanted?: number;
  easyApply?: boolean;
  descriptionFormat?: 'markdown' | 'html';
  offset?: number;
  hoursOld?: number;
  verbose?: number;
  countryIndeed?: string;
  isRemote?: boolean;
  linkedinFetchDescription?: boolean;
  linkedinCompanyIds?: string | number[] | null;
  enforceAnnualSalary?: boolean;
  proxies?: string | string[] | null;
  caCert?: string | null;
  format?: 'json' | 'csv';
  timeout?: number;

}

export interface JobSpySchema {
  // ID
  id?: string;
  site?: string;

  // Job Information
  title?: string; // Found in mock instead of jobTitle
  company?: string; // Found in mock instead of companyName
  description?: string;
  keywords?: string[];
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  skills?: string[] | null;
  emails?: string | null;

  // URLs
  jobUrl?: string | null;
  jobUrlDirect?: string | null;

  // Misc Information
  location?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;

  // Dates
  datePosted?: string | number | null; // Number in mock.json (timestamp)
  jobType?: string | null;

  // Salary Information
  salary?: string | null;
  salarySource?: string | null;
  interval?: string | null; // Found in mock instead of salaryPeriod
  currency?: string | null; // Found in mock instead of salaryCurrency
  minAmount?: number | null;
  maxAmount?: number | null;

  // Job Categorization
  jobs?: string[] | null;
  isRemote?: boolean | null;
  jobLevel?: string | null;
  jobFunction?: string | null;
  listingType?: string | null;

  // Experience
  experience?: string | null;
  experienceRange?: string | null;

  // Company Information
  companyName?: string;
  companyIndustry?: string | null;
  companyUrl?: string | null;
  companyLogo?: string | null;
  companyUrlDirect?: string | null;
  companyAddresses?: string | null; // String in mock.json, not string[]
  companyNumEmployees?: string | null;
  companyRevenue?: string | null;
  companyDescription?: string | null;
  companyRating?: string | null;
  companyReviewsCount?: string | null;

  // Additional Information
  postingStatus?: string | null;
  vacancyCount?: string | null;
  workFromHomeType?: string | null;
}

export interface JobSpyResponse {
  jobs: JobSpySchema[];
  count: number;
  message?: string; // Changed from number to string based on mock.json
}
