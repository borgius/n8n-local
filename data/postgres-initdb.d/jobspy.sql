CREATE SCHEMA IF NOT EXISTS jobspy;

CREATE TABLE jobspy.job_descriptions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  date VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores address, postalCode, city, countryCode, region
  remote VARCHAR(50),
  salary VARCHAR(100),
  experience VARCHAR(100),
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects with name, level and keywords
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN indexes for efficient JSONB querying
CREATE INDEX idx_job_descriptions_location ON jobspy.job_descriptions USING GIN (location);
CREATE INDEX idx_job_descriptions_skills ON jobspy.job_descriptions USING GIN (skills);
CREATE INDEX idx_job_descriptions_responsibilities ON jobspy.job_descriptions USING GIN (responsibilities);
CREATE INDEX idx_job_descriptions_qualifications ON jobspy.job_descriptions USING GIN (qualifications);

-- Standard indexes for common query fields
CREATE INDEX idx_job_descriptions_title ON jobspy.job_descriptions(title);
CREATE INDEX idx_job_descriptions_company ON jobspy.job_descriptions(company);
CREATE INDEX idx_job_descriptions_type ON jobspy.job_descriptions(type);
