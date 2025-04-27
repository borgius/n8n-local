const fetch = require('node-fetch');
const pg = require('pg');

const JOBSPY_PORT = process.env.JOBSPY_PORT || 9423;
const JOBSPY_HOST = process.env.JOBSPY_HOST || '127.0.0.1';

const hello = async (world = 'world') => {
  const res = `Hello ${world}!!!`;
  return res;
};

/**
 * @typedef {import('./types').SearchParams} SearchParams
 */

/**
 * Fetches job listings from various job sites based on provided search parameters.
 *
 * @async
 * @function fetchJobs
 * @param {SearchParams} params - Search parameters for the job search.
 * @returns {Promise<Object>} A promise that resolves to the job search results.
 * @throws {Error} If the API request fails.
 */
const fetchJobs = async (params = {}) => {
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

/**
 * Function to insert a job description into PostgreSQL database
 * @param {Object} jobData - Job data conforming to jobDescriptionSchema
 * @param {Object} pgClient - PostgreSQL client instance
 * @returns {Promise<Object>} - The inserted record
 */
const insertJobDescription = async (jobData, pgClient) => {
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
  const validatedData = jobDescriptionSchema.parse(jobData);

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
    const result = await pgClient.query(query, values);
    return result.rows[0];
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
 * @param {Object} config - PostgreSQL connection configuration
 * @param {string} config.host - Database host
 * @param {number} config.port - Database port
 * @param {string} config.database - Database name
 * @param {string} config.user - Database user
 * @param {string} config.password - Database password
 * @returns {Promise<Object>} - PostgreSQL client instance
 * @throws {Error} If the connection fails
 */
const pgConnect = async (config = {}) => {
  const defaultConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'n8n',
    user: process.env.POSTGRES_USER || 'root',
    password: process.env.POSTGRES_PASSWORD || 'password',
  };

  const connectionConfig = { ...defaultConfig, ...config };
  const client = new pg.Client(connectionConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    return client;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    throw error;
  }
};

module.exports = {
  hello,
  fetchJobs,
  insertJobDescription,
  pgConnect,
};
