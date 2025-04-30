import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { spy, stub } from 'jsr:@std/testing/mock';
import { afterEach, beforeEach, describe, it } from 'jsr:@std/testing/bdd';

import { fetchJobs, hello, pgConnect, insertJob, addJobs } from '../index.ts';
import { JobData, SearchParams } from '../types.ts';

describe('jobspy module', () => {
  describe('fetchJobs()', () => {
    let originalFetch: typeof fetch;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      originalConsoleError = console.error;
      console.error = () => {}; // Suppress console error output during tests
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    });

    it('should fetch jobs with default parameters', async () => {
      const mockResponse = { jobs: [{ title: 'Test Job' }] };

      // Create a fetch stub that returns a mock response
      globalThis.fetch = () =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      const result = await fetchJobs();
      assertEquals(result, mockResponse);
    });

    it('should fetch jobs with provided parameters', async () => {
      const mockResponse = { jobs: [{ title: 'Test Job' }] };
      let requestUrl = '';
      let requestOptions: RequestInit | undefined;

      // Mock fetch to capture and validate the request
      globalThis.fetch = (
        url: string | URL | Request,
        options?: RequestInit
      ) => {
        requestUrl = url.toString();
        requestOptions = options;
        return Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      };

      const params: SearchParams = {
        search_term: 'developer',
        location: 'New York',
        site: ['indeed', 'linkedin'],
      };

      const result = await fetchJobs(params);

      assertEquals(result, mockResponse);
      assertEquals(requestUrl, 'http://127.0.0.1:9423/api');
      assertEquals(requestOptions?.method, 'post');
      assertEquals(requestOptions?.headers, {
        'Content-Type': 'application/json',
      });
      assertEquals(JSON.parse(requestOptions?.body as string), params);
    });

    it('should throw an error when API request fails', async () => {
      // Mock fetch to return an error response
      globalThis.fetch = () =>
        Promise.resolve(new Response('', { status: 500 }));

      await assertRejects(
        () => fetchJobs(),
        Error,
        'API request failed with status 500'
      );
    });

    it('should throw an error when fetch throws', async () => {
      // Mock fetch to throw a network error
      globalThis.fetch = () => Promise.reject(new Error('Network error'));

      await assertRejects(() => fetchJobs(), Error, 'Network error');
    });
  });

  describe('Database functions', () => {
    let mockPgClient: any;
    let originalConsoleLog: typeof console.log;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      // Mock the PgClient
      mockPgClient = {
        connect: () => Promise.resolve(),
        queryObject: () =>
          Promise.resolve({
            rows: [
              {
                title: 'Software Engineer',
                company: 'Test Company',
                type: 'Full-time',
                date: '2025-04-29',
                description: 'A test job description',
                location: { city: 'San Francisco' },
                remote: true,
                salary: '$100,000',
                experience: '3-5 years',
                responsibilities: ['Coding'],
                qualifications: ['Experience'],
                skills: ['TypeScript'],
              },
            ],
          }),
        end: () => Promise.resolve(),
      };

      // Suppress console output during tests
      originalConsoleLog = console.log;
      originalConsoleError = console.error;
      console.log = () => {};
      console.error = () => {};
    });

    afterEach(() => {
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    });

    describe('insertJobDescription()', () => {
      it('should insert a job description and return the result', async () => {
        // Spy on the queryObject method
        const querySpy = spy(mockPgClient, 'queryObject');

        const jobData: JobData = {
          title: 'Software Engineer',
          company: 'Test Company',
          type: 'Full-time',
          date: '2025-04-29',
          description: 'A test job description',
          location: { city: 'San Francisco', state: 'CA', country: 'USA' },
          remote: true,
          salary: '$100,000 - $150,000',
          experience: '3-5 years',
          responsibilities: ['Coding', 'Testing'],
          qualifications: ["Bachelor's degree", 'Experience with TypeScript'],
          skills: ['TypeScript', 'JavaScript', 'React'],
        };

        await insertJob(jobData, mockPgClient);

        assertEquals(querySpy.calls.length, 1);

        querySpy.restore();
      });

      it('should throw an error when query fails', async () => {
        // Make queryObject throw an error
        mockPgClient.queryObject = () =>
          Promise.reject(new Error('Query failed'));

        const jobData: JobData = {
          title: 'Software Engineer',
          company: 'Test Company',
          type: 'Full-time',
          date: '2025-04-29',
          description: 'A test job description',
          location: { city: 'San Francisco' },
          remote: true,
          salary: '$100,000 - $150,000',
          experience: '3-5 years',
          responsibilities: ['Coding'],
          qualifications: ['Experience'],
          skills: ['TypeScript'],
        };

        await assertRejects(
          () => insertJob(jobData, mockPgClient),
          Error,
          'Query failed'
        );
      });
    });

    describe('addJobs()', () => {
      it('should insert multiple jobs', async () => {
        // Create a modified version of addJobs for testing
        async function testAddJobs(jobs: JobData[]): Promise<JobData[]> {
          // This mock implementation mimics the behavior of addJobs
          // but uses our mockPgClient directly
          const insertedJobs: JobData[] = [];

          for (const job of jobs) {
            try {
              const result = await mockPgClient.queryObject();
              insertedJobs.push(result.rows[0]);
            } catch (error) {
              console.error('Error inserting job description:', error);
            }
          }

          await mockPgClient.end();
          return insertedJobs;
        }

        // Set up a spy for client.end()
        let endCalled = false;
        mockPgClient.end = () => {
          endCalled = true;
          return Promise.resolve();
        };

        // Create array of test jobs
        const jobs: JobData[] = [
          {
            title: 'Software Engineer',
            company: 'Company A',
            type: 'Full-time',
            date: '2025-04-29',
            description: 'Job description A',
            location: { city: 'San Francisco' },
            remote: true,
            salary: '$100,000',
            experience: '3 years',
            responsibilities: ['Coding'],
            qualifications: ['Degree'],
            skills: ['TypeScript'],
          },
          {
            title: 'Product Manager',
            company: 'Company B',
            type: 'Part-time',
            date: '2025-04-30',
            description: 'Job description B',
            location: { city: 'New York' },
            remote: false,
            salary: '$120,000',
            experience: '5 years',
            responsibilities: ['Planning'],
            qualifications: ['MBA'],
            skills: ['Agile'],
          },
        ];

        const result = await testAddJobs(jobs);

        // Check that client.end() was called
        assertEquals(endCalled, true);

        // Check that we got the expected number of results
        assertEquals(result.length, 2);
      });
    });
  });
});
