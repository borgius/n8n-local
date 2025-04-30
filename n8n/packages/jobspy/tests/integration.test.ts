import { assertEquals, assertExists } from 'jsr:@std/assert';
import { describe, it, beforeAll, afterAll } from 'jsr:@std/testing/bdd';
import { Client as PgClient, ClientOptions } from 'jsr:@db/postgres';

import { fetchJobs, pgConnect, addJobs } from '../index.ts';
import { JobSpyResponse, SearchParams } from '../types.ts';

/**
 * This file contains integration tests for the jobspy module.
 *
 * These tests use mocks to simulate external API calls and database operations.
 * To run these tests:
 * deno test --allow-net --allow-env --allow-read integration.test.ts
 */

const mockFilePath = new URL('../mocks/mock.json', import.meta.url).pathname;

describe('jobspy integration tests', () => {
  let pgClient: PgClient;
  const decoder = new TextDecoder();
  let mockData: JobSpyResponse;

  beforeAll(async () => {
    pgClient = await pgConnect();
    mockData = JSON.parse(
      decoder.decode(await Deno.readFile('./mocks/mock.json'))
    );
  });

  afterAll(async () => {
    await pgClient.queryObject(`DELETE FROM jobspy.jobs WHERE site = 'mock'`);
    await pgClient.end();
  });
  // Mock the pgClient to simulate database operations

  describe('fetchJobs() - External API integration', () => {
    it.skip('should fetch jobs from jobspy API', async () => {
      const params: SearchParams = {
        search_term: 'software engineer',
        site: 'indeed',
        location: 'remote',
        country: 'usa',
        limit: 1, // Limit to one result for faster test
      };

      const result = await fetchJobs(params);

      // Verify the result structure
      assertExists(result);
      assertExists(result.jobs);
      assertEquals(Array.isArray(result.jobs), true);

      // If we got any jobs, verify the first job has the expected structure
      if (result.jobs.length > 0) {
        const job = result.jobs[0];
        assertExists(job.title);
        assertExists(job.company);
        assertExists(job.description);
      }
      // save result as mock to a file for later use
      const file = await Deno.open(mockFilePath, {
        write: true,
        create: true,
      });
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(result, null, 2));
      await file.write(data);
      await file.close();
      // Verify that the file was created
      const fileInfo = await Deno.stat(mockFilePath);

      assertExists(fileInfo);
      assertEquals(fileInfo.isFile, true);
    });

    it('should use mock data for API testing', async () => {
      // Instead of making a real API call, load the mock data

      // Verify the mock data structure
      assertExists(mockData);
      assertExists(mockData.jobs);
      assertEquals(Array.isArray(mockData.jobs), true);

      // Verify job structure if we have any jobs
      if (mockData.jobs.length > 0) {
        const job = mockData.jobs[0];
        // Check that job has expected format
        assertEquals(typeof job.description, 'string');
        assertEquals(typeof job.location, 'string');
        // assertEquals(typeof job.company, 'string');
      }
    });
  });

  describe('Database operations - PostgreSQL integration', () => {
    it('should insert multiple jobs with addJobs function using mock data', async () => {
      assertEquals(Array.isArray(mockData.jobs), true);
      const firstJob = mockData.jobs[0];

      const jobs = mockData.jobs.map((job) => ({
        ...job,
        site: 'mock',
      }));

      await addJobs(jobs);

      // Verify that the data was "inserted" by querying the mock database
      const queryResult = await pgClient.queryObject(
        `
        SELECT * FROM jobspy.jobs
        WHERE company = $1
      `,
        [firstJob.company]
      );

      assertEquals(queryResult.rows.length, 1);
      const row = queryResult.rows[0] as { title: string }; // Explicitly cast to expected type
      assertEquals(row.title, firstJob.title);
    });
  });
});
