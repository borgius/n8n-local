import { Client as PgClient } from "jsr:@db/postgres";
import { SearchParams, JobData, PgConfig } from "./types.ts";
import { JobDescriptionSchema } from "./schemas.ts";

const JOBSPY_PORT = Deno.env.get("JOBSPY_PORT") || "9423";
const JOBSPY_HOST = Deno.env.get("JOBSPY_HOST") || "127.0.0.1";

export const hello = async (world: string = 'world'): Promise<string> => {
  const res = `Hello ${world}!!!`;
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

export const addJobs = async (jobs: JobData[]): Promise<JobData[]> => {
  const pgClient = await pgConnect();
  const insertedJobs: JobData[] = [];
  for (const job of jobs) {
    try {
      const insertedJob = await insertJobDescription(job, pgClient);  
      insertedJobs.push(insertedJob);
    } catch (error) {
      console.error('Error inserting job description:', error);
    }
  }
  await pgClient.end();
  return insertedJobs;
};

/**
 * Function to insert a job description into PostgreSQL database
 * @param {JobData} jobData - Job data conforming to jobDescriptionSchema
 * @param {PgClient} pgClient - PostgreSQL client instance
 * @returns {Promise<JobData>} - The inserted record
 */
export const insertJobDescription = async (
  jobData: JobData,
  pgClient: PgClient
): Promise<JobData> => {
  const query = `
    INSERT INTO jobspy.job_descriptions (
      title,
      company,
      type,
      date,
      description,
      location,
      remote,
      salary,
      experience,
      responsibilities,
      qualifications,
      skills
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *
  `;

  // Validate the job data against schema before inserting
  const validatedData = JobDescriptionSchema.parse(jobData);

  const values = [
    validatedData.title,
    validatedData.company,
    validatedData.type,
    validatedData.date,
    validatedData.description,
    JSON.stringify(validatedData.location),
    validatedData.remote,
    validatedData.salary,
    validatedData.experience,
    JSON.stringify(validatedData.responsibilities),
    JSON.stringify(validatedData.qualifications),
    JSON.stringify(validatedData.skills),
  ];

  try {
    const result = await pgClient.queryObject(query, values);
    return result.rows[0] as JobData;
  } catch (error) {
    console.error('Error inserting job description:', error);
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
export const pgConnect = async (config: Partial<PgConfig> = {}): Promise<PgClient> => {
  const defaultConfig: PgConfig = {
    host: Deno.env.get("POSTGRES_HOST") || 'localhost',
    port: parseInt(Deno.env.get("POSTGRES_PORT") || '5432', 10),
    database: Deno.env.get("POSTGRES_DB") || 'n8n',
    user: Deno.env.get("POSTGRES_USER") || 'root',
    password: Deno.env.get("POSTGRES_PASSWORD") || 'password',
  };

  const connectionConfig = { ...defaultConfig, ...config };
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

