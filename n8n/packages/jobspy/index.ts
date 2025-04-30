import { Client as PgClient, ClientOptions } from 'jsr:@db/postgres';
import { SearchParams, JobSpySchema } from './types.ts';
import { jobSpySchema } from './schemas.ts';

const JOBSPY_PORT = Deno.env.get('JOBSPY_PORT') || '9423';
const JOBSPY_HOST = Deno.env.get('JOBSPY_HOST') || '127.0.0.1';

export const hello = (world: string = 'world'): string => {
  const res = `Hello ${world} 4`;
  return res;
};

/**
 * Fetches job listings from various job sites based on provided search parameters.
 *
 * @async
 * @function fetchJobs
 * @param {SearchParams} params - Search parameters for the job search.
 * @returns {Promise<Object>} A promise that resolves to the job search results.
 * @throws {Error} If the API request fails.
 */
export const fetchJobs = async (params: SearchParams = {}): Promise<any> => {
  try {
    // Create a sanitized copy of params to avoid serialization issues
    const sanitizedParams = JSON.parse(JSON.stringify(params));

    const response = await fetch(`http://${JOBSPY_HOST}:${JOBSPY_PORT}/api`, {
      method: 'post',
      body: JSON.stringify(sanitizedParams),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

export const addJobs = async (
  jobs: JobSpySchema[]
): Promise<JobSpySchema[]> => {
  const pgClient = await pgConnect();
  const insertedJobs: JobSpySchema[] = [];
  console.log('Inserting jobs:', jobs.length);
  for (const job of jobs) {
    try {
      const insertedJob = await insertJob(job, pgClient);
      insertedJobs.push(insertedJob);
    } catch (error) {
      console.error('Error inserting job description:', error);
    }
  }
  await pgClient.end();
  return insertedJobs;
};

/**
 * Parses an ISO 8601 date string or timestamp to a PostgreSQL TIMESTAMP format
 * @param {string|number|null} dateValue - Date value to parse (ISO 8601 string or timestamp)
 * @returns {string|null} - Formatted date for PostgreSQL or null if invalid
 */
function parseDate(dateValue: string | number | null): string | null {
  if (!dateValue) return null;

  try {
    // For numeric timestamps
    if (!isNaN(Number(dateValue))) {
      // Check if it's milliseconds (13 digits) or seconds (10 digits)
      const timestamp =
        String(dateValue).length > 10
          ? Number(dateValue)
          : Number(dateValue) * 1000;
      return new Date(timestamp).toISOString();
    }

    // For ISO 8601 strings (or any parsable date string)
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    console.warn(`Could not parse date: ${dateValue}`);
    return null;
  } catch (error) {
    console.warn(`Error parsing date: ${dateValue}`, error);
    return null;
  }
}

export const insertJob = async (
  jobData: JobSpySchema,
  pgClient: PgClient
): Promise<JobSpySchema> => {
  const query = `
    INSERT INTO jobspy.jobs (
      id,
      site,
      job_url,
      job_url_direct,
      title,
      company,
      location,
      date_posted,
      job_type,
      salary_source,
      interval,
      min_amount,
      max_amount,
      currency,
      is_remote,
      job_level,
      job_function,
      listing_type,
      emails,
      description,
      company_industry,
      company_url,
      company_logo,
      company_url_direct,
      company_addresses,
      company_num_employees,
      company_revenue,
      company_description,
      skills,
      experience_range,
      company_rating,
      company_reviews_count,
      vacancy_count,
      work_from_home_type,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, CURRENT_TIMESTAMP
    ) 
    ON CONFLICT (id) 
    DO UPDATE SET 
      site = EXCLUDED.site,
      job_url = EXCLUDED.job_url,
      job_url_direct = EXCLUDED.job_url_direct,
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      location = EXCLUDED.location,
      date_posted = EXCLUDED.date_posted,
      job_type = EXCLUDED.job_type,
      salary_source = EXCLUDED.salary_source,
      interval = EXCLUDED.interval,
      min_amount = EXCLUDED.min_amount,
      max_amount = EXCLUDED.max_amount,
      currency = EXCLUDED.currency,
      is_remote = EXCLUDED.is_remote,
      job_level = EXCLUDED.job_level,
      job_function = EXCLUDED.job_function,
      listing_type = EXCLUDED.listing_type,
      emails = EXCLUDED.emails,
      description = EXCLUDED.description,
      company_industry = EXCLUDED.company_industry,
      company_url = EXCLUDED.company_url,
      company_logo = EXCLUDED.company_logo,
      company_url_direct = EXCLUDED.company_url_direct,
      company_addresses = EXCLUDED.company_addresses,
      company_num_employees = EXCLUDED.company_num_employees,
      company_revenue = EXCLUDED.company_revenue,
      company_description = EXCLUDED.company_description,
      skills = EXCLUDED.skills,
      experience_range = EXCLUDED.experience_range,
      company_rating = EXCLUDED.company_rating,
      company_reviews_count = EXCLUDED.company_reviews_count,
      vacancy_count = EXCLUDED.vacancy_count,
      work_from_home_type = EXCLUDED.work_from_home_type,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  // Validate the job data against jobSpySchema
  const validatedData = jobSpySchema.parse(jobData);

  // Generate a unique ID if not present
  const id =
    validatedData.id ||
    `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Parse the date_posted field to ensure it's in proper format for PostgreSQL
  const datePosted = parseDate(validatedData.datePosted || null);

  // Use the appropriate field names from the schema
  const values = [
    id, // id
    validatedData.site || 'unknown', // site
    validatedData.jobUrl || '', // job_url
    validatedData.jobUrlDirect || null, // job_url_direct
    validatedData.title || '', // title (changed from jobTitle)
    validatedData.company || '', // company (changed from companyName)
    validatedData.location || null, // location as string
    datePosted, // date_posted as timestamp
    validatedData.jobType || null, // job_type
    validatedData.salarySource || null, // salary_source
    validatedData.interval || null, // interval (changed from salaryPeriod)
    validatedData.minAmount || null, // min_amount
    validatedData.maxAmount || null, // max_amount
    validatedData.currency || 'USD', // currency (changed from salaryCurrency)
    validatedData.isRemote || false, // is_remote
    validatedData.jobLevel || null, // job_level
    validatedData.jobFunction || null, // job_function
    validatedData.listingType || null, // listing_type
    validatedData.emails || null, // emails
    validatedData.description || '', // description
    validatedData.companyIndustry || null, // company_industry
    validatedData.companyUrl || null, // company_url
    validatedData.companyLogo || null, // company_logo
    validatedData.companyUrlDirect || null, // company_url_direct
    validatedData.companyAddresses || null, // company_addresses
    validatedData.companyNumEmployees || null, // company_num_employees
    validatedData.companyRevenue || null, // company_revenue
    validatedData.companyDescription || null, // company_description
    Array.isArray(validatedData.skills)
      ? JSON.stringify(validatedData.skills)
      : '[]', // skills as JSON
    validatedData.experienceRange || validatedData.experience || null, // experience_range
    validatedData.companyRating || null, // company_rating
    validatedData.companyReviewsCount || null, // company_reviews_count
    validatedData.vacancyCount || null, // vacancy_count
    validatedData.workFromHomeType || null, // work_from_home_type
  ];

  try {
    const result = await pgClient.queryObject(query, values);
    return result.rows[0] as JobSpySchema;
  } catch (error) {
    console.error('Error inserting job:', error);
    throw error;
  }
};

// Utility function to connect to PostgreSQL
export async function pgConnect(): Promise<PgClient> {
  // Use environment variables or default values
  const options: ClientOptions = {
    user: Deno.env.get('POSTGRES_USER') || 'root',
    password: Deno.env.get('POSTGRES_PASSWORD') || 'password',
    database: Deno.env.get('POSTGRES_DB') || 'n8n',
    hostname: Deno.env.get('POSTGRES_HOST') || 'localhost',
    port: Number(Deno.env.get('POSTGRES_PORT') || 5432),
    tls: {
      enabled: false,
    },
  };

  const client = new PgClient(options);
  await client.connect();
  return client;
}
