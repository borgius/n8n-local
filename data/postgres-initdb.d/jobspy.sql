CREATE SCHEMA IF NOT EXISTS jobspy;

CREATE TABLE jobspy.jobs (
  id VARCHAR(50) PRIMARY KEY,
  site VARCHAR(50) NOT NULL,
  job_url TEXT,
  job_url_direct TEXT,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date_posted BIGINT,
  job_type VARCHAR(50),
  salary_source VARCHAR(50),
  interval VARCHAR(50),
  min_amount NUMERIC,
  max_amount NUMERIC,
  currency VARCHAR(10),
  is_remote BOOLEAN,
  job_level VARCHAR(100),
  job_function VARCHAR(100),
  listing_type VARCHAR(100),
  emails TEXT,
  description TEXT,
  company_industry VARCHAR(255),
  company_url TEXT,
  company_logo TEXT,
  company_url_direct TEXT,
  company_addresses TEXT,
  company_num_employees VARCHAR(100),
  company_revenue VARCHAR(100),
  company_description TEXT,
  skills JSONB,
  experience_range VARCHAR(100),
  company_rating VARCHAR(50),
  company_reviews_count VARCHAR(50),
  vacancy_count VARCHAR(50),
  work_from_home_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common search fields
CREATE INDEX idx_jobs_title ON jobspy.jobs(title);
CREATE INDEX idx_jobs_company ON jobspy.jobs(company);
CREATE INDEX idx_jobs_location ON jobspy.jobs(location);
CREATE INDEX idx_jobs_date_posted ON jobspy.jobs(date_posted);
CREATE INDEX idx_jobs_salary_range ON jobspy.jobs(min_amount, max_amount);
CREATE INDEX idx_jobs_is_remote ON jobspy.jobs(is_remote);