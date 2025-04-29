import { z } from 'npm:zod';

export const JobDescriptionSchema = z.object({
    title: z.string(),
    company: z.string(),
    type: z.string(),
    date: z.string(),
    description: z.string(),
    location: z.any(),
    remote: z.boolean(),
    salary: z.string(),
    experience: z.string(),
    responsibilities: z.array(z.string()),
    qualifications: z.array(z.string()),
    skills: z.array(z.string())
  });
  