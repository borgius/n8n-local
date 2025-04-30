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

export const addJobs = async (jobs: JobSpySchema[]): Promise<JobSpySchema[]> => {
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
    ) RETURNING *
  `;

  // Validate the job data against jobSpySchema
  const validatedData = jobSpySchema.parse(jobData);

  // Generate a unique ID if not present
  const id =
    validatedData.id ||
    `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Use the appropriate field names from the schema
  const values = [
    id, // id
    validatedData.site || 'unknown', // site
    validatedData.jobUrl || '', // job_url
    validatedData.jobUrlDirect || null, // job_url_direct
    validatedData.title || '', // title (changed from jobTitle)
    validatedData.company || '', // company (changed from companyName)
    validatedData.location || null, // location as string
    validatedData.datePosted || null, // date_posted as timestamp
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
    console.error('Error inserting job into jobs table:', error);
    throw error;
  }
};

/**
 * Establishes a connection to PostgreSQL database
 *
 * @async
 * @function pgConnect
 * @param {PgConfig} config - PostgreSQL connection configuration
 * @returns {Promise<PgClient>} - PostgreSQL client instance
 * @throws {Error} If the connection fails
 */
export const pgConnect = async (
  config: Partial<ClientOptions> = {}
): Promise<PgClient> => {
  const defaultConfig: ClientOptions = {
    hostname: Deno.env.get('POSTGRES_HOST') || 'localhost',
    port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432', 10),
    database: Deno.env.get('POSTGRES_DB') || 'n8n',
    user: Deno.env.get('POSTGRES_USER') || 'root',
    password: Deno.env.get('POSTGRES_PASSWORD') || 'password',
    tls: {
      enforce: false,
    },
    host_type: 'tcp',
  };

  const connectionConfig = { ...defaultConfig, ...config };
  console.log('Connecting to PostgreSQL with config:', connectionConfig);
  const client = new PgClient(connectionConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    return client;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    throw error;
  }
};
