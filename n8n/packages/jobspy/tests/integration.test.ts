import { assertEquals, assertExists } from 'jsr:@std/assert';
import { describe, it, beforeAll, afterAll } from 'jsr:@std/testing/bdd';
import { Client as PgClient, ClientOptions } from 'jsr:@db/postgres';

import { fetchJobs, pgConnect, addJobs } from '../index.ts';
import { JobSpyResponse, JobSpySchema, SearchParams } from '../types.ts';

/**
 * This file contains integration tests for the jobspy module.
 *
 * These tests use mocks to simulate external API calls and database operations.
 * To run these tests:
 * deno test --allow-net --allow-env --allow-read integration.test.ts
 */

const SITES = [
  'indeed',
  'linkedin',
  'glassdoor',
  'google',
  // 'zip_recruiter',
  // 'bayt',
  // 'naukri',
];

const mockFilePath = (site: string) =>
  new URL(`../mocks/${site}.mock.json`, import.meta.url).pathname;

const getMockData = async (site: string) => {
  const decoder = new TextDecoder();
  try {
    return JSON.parse(decoder.decode(await Deno.readFile(mockFilePath(site))));
  } catch (error) {
    console.error('Error reading mock data:', error);
    return { jobs: [], count: 0 };
  }
};

describe('jobspy integration tests', () => {
  let pgClient: PgClient;
  let mockData: JobSpyResponse;

  beforeAll(async () => {
    pgClient = await pgConnect();
  });

  afterAll(async () => {
    // await pgClient.queryObject(`DELETE FROM jobspy.jobs WHERE site like 'mock-%'`);
    await pgClient.end();
  });
  // Mock the pgClient to simulate database operations

  describe('fetchJobs() - External API integration', () => {
    SITES.forEach((site) => {
      it.skip(`should fetch jobs from jobspy API for ${site}`, async () => {
        const params: SearchParams = {
          searchTerm: 'frontend developer',
          siteNames: site,
          location: 'remote',
          linkedinFetchDescription: true,
        };

        const result = await fetchJobs(params);

        // Verify the result structure
        assertExists(result);
        assertExists(result.jobs);
        assertEquals(Array.isArray(result.jobs), true);

        // save result as mock to a file for later use
        const file = await Deno.open(mockFilePath(site), {
          write: true,
          create: true,
          truncate: true,
        });
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(result, null, 2));
        await file.write(data);
        await file.close();
        // Verify that the file was created
        const fileInfo = await Deno.stat(mockFilePath(site));

        assertExists(fileInfo);
        assertEquals(fileInfo.isFile, true);
      });
    });

    it('should test comprehensive search parameters', async () => {
      // Mock fetch to capture the normalized parameters
      let requestUrl = '';
      let requestOptions: RequestInit | undefined;
      let requestBody: any;

      const mockFetchResponse = {
        jobs: [{ title: 'Test Job' }],
        count: 1,
      };

      // Save original fetch
      const originalFetch = globalThis.fetch;

      // Mock fetch to capture request details
      globalThis.fetch = (
        url: string | URL | Request,
        options?: RequestInit
      ) => {
        requestUrl = url.toString();
        requestOptions = options;
        if (options?.body) {
          requestBody = JSON.parse(options.body as string);
        }
        return Promise.resolve(
          new Response(JSON.stringify(mockFetchResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      };

      try {
        // Test with all parameters in camelCase format
        const comprehensiveParams: SearchParams = {
          siteNames: ['linkedin', 'indeed'],
          searchTerm: 'senior developer',
          location: 'New York',
          distance: 25,
          jobType: 'fulltime',
          googleSearchTerm: 'senior developer jobs in New York',
          resultsWanted: 50,
          easyApply: true,
          descriptionFormat: 'markdown',
          offset: 10,
          hoursOld: 48,
          verbose: 1,
          countryIndeed: 'USA',
          isRemote: true,
          linkedinFetchDescription: true,
          linkedinCompanyIds: [123456, 789012],
          enforceAnnualSalary: true,
          proxies: ['proxy1.example.com', 'proxy2.example.com'],
          caCert: '/path/to/cert.pem',
          format: 'json',
          timeout: 90000,
        };

        const result = await fetchJobs(comprehensiveParams);

        // Verify request properties
        assertEquals(requestUrl, 'http://127.0.0.1:9423/api');
        assertEquals(requestOptions?.method, 'post');
        assertEquals(requestOptions?.headers, {
          'Content-Type': 'application/json',
        });
        // Verify parameters were correctly normalized to snake_case for the API
        assertEquals(requestBody.siteNames, ['linkedin', 'indeed']);
        assertEquals(requestBody.searchTerm, 'senior developer');
        assertEquals(requestBody.location, 'New York');
        assertEquals(requestBody.distance, 25);
        assertEquals(requestBody.jobType, 'fulltime');
        assertEquals(
          requestBody.googleSearchTerm,
          'senior developer jobs in New York'
        );
        assertEquals(requestBody.resultsWanted, 50);
        assertEquals(requestBody.easyApply, true);
        assertEquals(requestBody.descriptionFormat, 'markdown');
        assertEquals(requestBody.offset, 10);
        assertEquals(requestBody.hoursOld, 48);
        assertEquals(requestBody.verbose, 1);
        assertEquals(requestBody.countryIndeed, 'USA');
        assertEquals(requestBody.isRemote, true);
        assertEquals(requestBody.linkedinFetchDescription, true);
        assertEquals(requestBody.linkedinCompanyIds, [123456, 789012]);
        assertEquals(requestBody.enforceAnnualSalary, true);
        assertEquals(requestBody.proxies, [
          'proxy1.example.com',
          'proxy2.example.com',
        ]);
        assertEquals(requestBody.caCert, '/path/to/cert.pem');
        assertEquals(requestBody.format, 'json');
        assertEquals(requestBody.timeout, 90000);

        // Verify the response was correctly returned
        assertEquals(result, mockFetchResponse);
      } finally {
        // Restore original fetch
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('Database operations - PostgreSQL integration', () => {
    SITES.forEach((site) => {
      it.only(`should insert multiple jobs with addJobs function using mock data for ${site}`, async () => {
        const mockData = await getMockData(site);

        // Verify the mock data structure
        assertEquals(Array.isArray(mockData.jobs), true);
        const firstJob = mockData.jobs[0];

        const jobs = mockData.jobs.map((job: JobSpySchema) => ({
          ...job,
          site: `mock-${job.site}`,
        }));

        await addJobs(jobs);

        // Verify that the data was "inserted" by querying the mock database
        const queryResult = await pgClient.queryObject(
          `SELECT * FROM jobspy.jobs WHERE company = $1`,
          [firstJob.company]
        );

        assertEquals(queryResult.rows.length > 0, true);
        const row = queryResult.rows[0] as { title: string }; // Explicitly cast to expected type
        assertEquals(row.title, firstJob.title);
      });
    });
  });
});
