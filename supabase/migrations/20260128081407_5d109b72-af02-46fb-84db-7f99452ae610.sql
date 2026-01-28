-- Add all legally required fields for Norwegian employment contracts (Arbeidsmiljøloven § 14-6)

ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS work_description TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS workplace_address TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS has_multiple_workplaces BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS remote_work_allowed BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS remote_work_details TEXT;

-- Working hours
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS working_hours_per_week NUMERIC(4,1) DEFAULT 37.5;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS working_hours_per_day NUMERIC(4,1);
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS work_time_arrangement TEXT; -- e.g., 'normal', 'shift', 'flexible', 'average_calculated'
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 30;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS variable_working_hours BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS variable_hours_description TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS shift_change_rules TEXT;

-- Temporary employment specifics
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS temporary_reason TEXT; -- Legal basis for temp employment

-- Vacation and holiday pay
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS vacation_days INTEGER DEFAULT 25;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS holiday_pay_percentage NUMERIC(4,2) DEFAULT 10.2;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS vacation_rules TEXT;

-- Salary and compensation
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(12,2);
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'monthly'; -- 'monthly', 'hourly', 'annual'
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS payment_day INTEGER DEFAULT 15;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS overtime_compensation TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS other_allowances TEXT; -- JSON or text for additional allowances

-- Notice period
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS notice_period_employee_months INTEGER DEFAULT 1;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS notice_period_employer_months INTEGER DEFAULT 1;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS termination_procedures TEXT;

-- Staffing agency / Innleie
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS is_staffing_agency BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS client_company_name TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS client_company_org_number TEXT;

-- Training and competence
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS training_provisions TEXT;

-- Social security / Pension / Insurance
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS pension_scheme TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS insurance_provisions TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS sick_pay_rules TEXT;

-- Collective agreement
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS has_collective_agreement BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS collective_agreement_name TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS collective_agreement_parties TEXT;

-- Additional legal requirements
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS special_work_time_exemptions BOOLEAN DEFAULT false;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS special_work_time_details TEXT;

-- Add comments for documentation
COMMENT ON COLUMN employment_contracts.work_description IS 'Description of work duties or job title/category (§14-6 d)';
COMMENT ON COLUMN employment_contracts.workplace_address IS 'Primary workplace address (§14-6 c)';
COMMENT ON COLUMN employment_contracts.has_multiple_workplaces IS 'Whether employee works at multiple locations (§14-6 c)';
COMMENT ON COLUMN employment_contracts.temporary_reason IS 'Legal basis for temporary employment (§14-6 e)';
COMMENT ON COLUMN employment_contracts.vacation_days IS 'Annual vacation days (§14-6 j)';
COMMENT ON COLUMN employment_contracts.holiday_pay_percentage IS 'Holiday pay percentage (§14-6 j)';
COMMENT ON COLUMN employment_contracts.notice_period_employee_months IS 'Employee notice period in months (§14-6 h)';
COMMENT ON COLUMN employment_contracts.notice_period_employer_months IS 'Employer notice period in months (§14-6 h)';
COMMENT ON COLUMN employment_contracts.has_collective_agreement IS 'Whether a collective agreement applies (§14-6 m)';
COMMENT ON COLUMN employment_contracts.pension_scheme IS 'Information about pension scheme (§14-6 l)';
COMMENT ON COLUMN employment_contracts.training_provisions IS 'Right to training offered by employer (§14-6 k)';