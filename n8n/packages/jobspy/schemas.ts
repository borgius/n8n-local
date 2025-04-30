import { z } from 'npm:zod';

export const jobSpySchema = z.object({
  // Core fields
  id: z.string().nullable().optional(),
  site: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  requiredSkills: z.array(z.string()).nullable().optional(),
  niceToHaveSkills: z.array(z.string()).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  emails: z.string().nullable().optional(),

  // URLs
  jobUrl: z.string().nullable().optional(),
  jobUrlDirect: z.string().nullable().optional(),

  // Location information
  location: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),

  // Dates and job type
  datePosted: z.union([z.string(), z.number()]).nullable().optional(),
  jobType: z.string().nullable().optional(),

  // Salary information
  salary: z.string().nullable().optional(),
  salarySource: z.string().nullable().optional(),
  interval: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  minAmount: z.number().nullable().optional(),
  maxAmount: z.number().nullable().optional(),

  // Job categorization
  jobs: z.array(z.string()).nullable().optional(),
  isRemote: z.boolean().nullable().optional(),
  jobLevel: z.string().nullable().optional(),
  jobFunction: z.string().nullable().optional(),
  listingType: z.string().nullable().optional(),

  // Experience
  experience: z.string().nullable().optional(),
  experienceRange: z.string().nullable().optional(),

  // Company Information
  companyName: z.string().nullable().optional(),
  companyIndustry: z.string().nullable().optional(),
  companyUrl: z.string().nullable().optional(),
  companyLogo: z.string().nullable().optional(),
  companyUrlDirect: z.string().nullable().optional(),
  companyAddresses: z.string().nullable().optional(),
  companyNumEmployees: z.string().nullable().optional(),
  companyRevenue: z.string().nullable().optional(),
  companyDescription: z.string().nullable().optional(),
  companyRating: z.string().nullable().optional(),
  companyReviewsCount: z.string().nullable().optional(),

  // Additional Information
  postingStatus: z.string().nullable().optional(),
  vacancyCount: z.string().nullable().optional(),
  workFromHomeType: z.string().nullable().optional(),
});

export const searchParamsSchema = z.object({
  siteNames: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  searchTerm: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  distance: z.number().nullable().optional(),
  jobType: z
    .enum(['fulltime', 'parttime', 'internship', 'contract'])
    .nullable()
    .optional(),
  googleSearchTerm: z.string().nullable().optional(),
  resultsWanted: z.number().nullable().optional(),
  easyApply: z.boolean().nullable().optional(),
  descriptionFormat: z.enum(['markdown', 'html']).nullable().optional(),
  offset: z.number().nullable().optional(),
  hoursOld: z.number().nullable().optional(),
  verbose: z.number().min(0).max(2).nullable().optional(),
  countryIndeed: z.string().nullable().optional(),
  isRemote: z.boolean().nullable().optional(),
  linkedinFetchDescription: z.boolean().nullable().optional(),
  linkedinCompanyIds: z
    .union([z.string(), z.array(z.number())])
    .nullable()
    .optional(),
  enforceAnnualSalary: z.boolean().nullable().optional(),
  proxies: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  caCert: z.string().nullable().optional(),
  format: z.enum(['json', 'csv']).nullable().optional(),
  timeout: z.number().nullable().optional(),

  // Legacy parameters for backward compatibility
  site: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  search_term: z.string().nullable().optional(),
  country_indeed: z.string().nullable().optional(),
  linkedin_fetch_description: z.boolean().nullable().optional(),
  linkedin_company_ids: z
    .union([z.string(), z.array(z.number())])
    .nullable()
    .optional(),
  description_format: z.enum(['markdown', 'html']).nullable().optional(),
  is_remote: z.boolean().nullable().optional(),
  hours_old: z.number().nullable().optional(),
  results_wanted: z.number().nullable().optional(),
  easy_apply: z.boolean().nullable().optional(),
  job_type: z.string().nullable().optional(),
  enforce_annual_salary: z.boolean().nullable().optional(),
});
