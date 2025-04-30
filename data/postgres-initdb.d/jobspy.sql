CREATE SCHEMA IF NOT EXISTS jobspy;

CREATE TABLE jobspy.jobs (
  id VARCHAR(50) PRIMARY KEY,
  site VARCHAR(50) NOT NULL,
  job_url TEXT,
  job_url_direct TEXT,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date_posted TIMESTAMP,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common search fields
CREATE INDEX idx_jobs_title ON jobspy.jobs(title);
CREATE INDEX idx_jobs_company ON jobspy.jobs(company);
CREATE INDEX idx_jobs_location ON jobspy.jobs(location);
CREATE INDEX idx_jobs_date_posted ON jobspy.jobs(date_posted);
CREATE INDEX idx_jobs_salary_range ON jobspy.jobs(min_amount, max_amount);
CREATE INDEX idx_jobs_is_remote ON jobspy.jobs(is_remote);

-- Job application status table
CREATE TABLE jobspy.application_status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL,
  idList VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default statuses
INSERT INTO jobspy.application_status (idList, name, description, sort_order) VALUES
  ('6812611faf8c99cfc4f273b2', 'Discovered', 'New job listing discovered but no action taken yet', 10),
  ('681261295a403d6772d001b8', 'Interested', 'Marked as interesting but no application yet', 20),
  ('68126139b7705e7eba7f415a', 'Resume Prepared', 'Resume tailored for this position', 30),
  ('68126142ebebd14effff7422', 'Applied', 'Application submitted', 40),
  ('68126156d1dc0a651f7c2db0', 'In Progress', 'Application is being processed', 50),
  ('6812616162baa968eba3cdac', 'Phone Screen', 'Initial phone/video screening', 60),
  ('6812616e551642c1f23b6133', 'Technical Interview', 'Technical assessment or interview', 70),
  ('6812617d5b2b1bb4a87b52a0', 'Final Interview', 'Final round of interviews', 80),
  ('68126197f4445bb7c4a38ffa', 'Offer Received', 'Job offer received', 90),
  ('681261a7cc11bf0c68f20d93', 'Negotiating', 'Negotiating offer details', 100),
  ('681261b7b14cf65643e89cc0', 'Accepted', 'Offer accepted', 110),
  ('681261c81778794498273823', 'Rejected', 'Application rejected', 120),
  ('681261dd3b4292d58122068c', 'Declined', 'Offer declined by candidate', 130),
  ('681261f5b14cf65643e956a5', 'Withdrawn', 'Application withdrawn by candidate', 140);

-- Job applications table to track the application process
CREATE TABLE jobspy.applications (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(50) NOT NULL REFERENCES jobspy.jobs(id),
  status_id INTEGER NOT NULL REFERENCES jobspy.application_status(id),
  application_date TIMESTAMP,
  resume_version TEXT,
  cover_letter_version TEXT,
  trello_card_id VARCHAR(100),
  trello_list_id VARCHAR(100),
  notes TEXT,
  priority INTEGER DEFAULT 3,  -- 1-5 scale where 1 is highest priority
  next_follow_up_date TIMESTAMP,
  last_contact_date TIMESTAMP,
  salary_offered NUMERIC,
  currency VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id)
);

-- Application history to track status changes
CREATE TABLE jobspy.application_history (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES jobspy.applications(id),
  previous_status_id INTEGER REFERENCES jobspy.application_status(id),
  new_status_id INTEGER NOT NULL REFERENCES jobspy.application_status(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  changed_by VARCHAR(100)
);

-- Application contacts
CREATE TABLE jobspy.contacts (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES jobspy.applications(id),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview table
CREATE TABLE jobspy.interviews (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES jobspy.applications(id),
  interview_date TIMESTAMP NOT NULL,
  interview_type VARCHAR(50) NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(255),
  meeting_link TEXT,
  contact_id INTEGER REFERENCES jobspy.contacts(id),
  preparation_notes TEXT,
  feedback_notes TEXT,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks/reminders table
CREATE TABLE jobspy.tasks (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES jobspy.applications(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  reminder_date TIMESTAMP,
  priority INTEGER DEFAULT 3,  -- 1-5 scale where 1 is highest priority
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume versions table
CREATE TABLE jobspy.resumes (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(100) NOT NULL,
  file_path TEXT,
  json_data JSONB,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover letter versions table
CREATE TABLE jobspy.cover_letters (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(100) NOT NULL,
  template_text TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create additional necessary indexes
CREATE INDEX idx_applications_job_id ON jobspy.applications(job_id);
CREATE INDEX idx_applications_status_id ON jobspy.applications(status_id);
CREATE INDEX idx_applications_next_follow_up ON jobspy.applications(next_follow_up_date);
CREATE INDEX idx_application_history_application_id ON jobspy.application_history(application_id);
CREATE INDEX idx_interviews_application_id ON jobspy.interviews(application_id);
CREATE INDEX idx_interviews_date ON jobspy.interviews(interview_date);
CREATE INDEX idx_tasks_application_id ON jobspy.tasks(application_id);
CREATE INDEX idx_tasks_due_date ON jobspy.tasks(due_date);
CREATE INDEX idx_tasks_completed ON jobspy.tasks(completed);
CREATE INDEX idx_contacts_application_id ON jobspy.contacts(application_id);