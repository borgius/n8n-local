export interface SearchParams {
  search_term?: string;
  site?: string | string[];
  location?: string;
  country?: string;
  remoteness?: string;
  [key: string]: any;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  [key: string]: any;
}

export interface JobData {
  title: string;
  company: string;
  type: string;
  date: string;
  description: string;
  location: Location;
  remote: boolean;
  salary: string;
  experience: string;
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  [key: string]: any;
}

export interface PgConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
