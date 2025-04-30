export interface SearchParams {
  search_term?: string;
  site?: string | string[];
  location?: string;
  country?: string;
  remoteness?: string;
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  [key: string]: string | undefined;
}

// export interface JobData {
//   title: string;
//   company: string;
//   type: string;
//   date: string;
//   description: string;
//   location: Location;
//   remote: boolean;
//   salary: string;
//   experience: string;
//   responsibilities: string[];
//   qualifications: string[];
//   skills: string[];
//   [key: string]: string | string[] | number | boolean | Location | undefined;
// }

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
  message: string; // Changed from number to string based on mock.json
}
