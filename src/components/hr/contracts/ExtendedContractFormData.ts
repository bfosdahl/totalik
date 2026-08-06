// Extended contract form data matching Arbeidsmiljøloven § 14-6 requirements

export interface ExtendedContractFormData {
  // Basic info
  employee_id: string;
  contract_type: string;
  position: string;
  work_description: string;
  employment_percentage: number;
  
  // Dates
  start_date: string;
  end_date?: string | null;
  probation_period_months?: number | null;
  
  // Workplace
  workplace_address: string;
  has_multiple_workplaces: boolean;
  remote_work_allowed: boolean;
  remote_work_details?: string;
  
  // Working hours
  working_hours_per_week: number;
  working_hours_per_day?: number;
  work_time_arrangement: string;
  break_duration_minutes: number;
  variable_working_hours: boolean;
  variable_hours_description?: string;
  shift_change_rules?: string;
  
  // For temporary contracts
  temporary_reason?: string;
  
  // Vacation
  vacation_days: number;
  holiday_pay_percentage: number;
  vacation_rules?: string;
  
  // Salary
  salary_amount?: number;
  salary_type: string;
  payment_method: string;
  payment_day: number;
  overtime_compensation?: string;
  other_allowances?: string;
  
  // Notice period
  notice_period_employee_months: number;
  notice_period_employer_months: number;
  termination_procedures?: string;
  
  // Staffing agency (bemanningsforetak)
  is_staffing_agency: boolean;
  client_company_name?: string;
  client_company_org_number?: string;
  
  // Training
  training_provisions?: string;
  
  // Social security
  pension_scheme?: string;
  insurance_provisions?: string;
  sick_pay_rules?: string;
  
  // Collective agreement
  has_collective_agreement: boolean;
  collective_agreement_name?: string;
  collective_agreement_parties?: string;
  
  // Special work time
  special_work_time_exemptions: boolean;
  special_work_time_details?: string;
  
  // Notes
  notes?: string;
}

export const defaultExtendedFormData: ExtendedContractFormData = {
  employee_id: '',
  contract_type: 'permanent',
  position: '',
  work_description: '',
  employment_percentage: 100,
  start_date: new Date().toISOString().split('T')[0],
  end_date: null,
  probation_period_months: 6,
  
  workplace_address: '',
  has_multiple_workplaces: false,
  remote_work_allowed: false,
  remote_work_details: '',
  
  working_hours_per_week: 37.5,
  working_hours_per_day: 7.5,
  work_time_arrangement: 'normal',
  break_duration_minutes: 30,
  variable_working_hours: false,
  variable_hours_description: '',
  shift_change_rules: '',
  
  temporary_reason: '',
  
  vacation_days: 25,
  holiday_pay_percentage: 10.2,
  vacation_rules: '',
  
  salary_amount: undefined,
  salary_type: 'monthly',
  payment_method: 'bank_transfer',
  payment_day: 15,
  overtime_compensation: '',
  other_allowances: '',
  
  notice_period_employee_months: 1,
  notice_period_employer_months: 1,
  termination_procedures: '',
  
  is_staffing_agency: false,
  client_company_name: '',
  client_company_org_number: '',
  
  training_provisions: '',
  
  pension_scheme: '',
  insurance_provisions: '',
  sick_pay_rules: '',
  
  has_collective_agreement: false,
  collective_agreement_name: '',
  collective_agreement_parties: '',
  
  special_work_time_exemptions: false,
  special_work_time_details: '',
  
  notes: '',
};

export const contractTypes = [
  { value: 'permanent', label: 'Fast ansettelse' },
  { value: 'temporary', label: 'Midlertidig ansettelse' },
  { value: 'project', label: 'Prosjektansettelse' },
  { value: 'probation', label: 'Prøvetidsavtale' },
  { value: 'apprentice', label: 'Lærlingkontrakt' },
  { value: 'internship', label: 'Praksisplass' },
];

export const temporaryReasons = [
  { value: 'vikariat', label: 'Vikariat' },
  { value: 'sesong', label: 'Sesongarbeid' },
  { value: 'prosjekt', label: 'Tidsavgrenset prosjekt' },
  { value: 'praksisarbeid', label: 'Praksisarbeid' },
  { value: 'arbeidsmarkedstiltak', label: 'Arbeidsmarkedstiltak' },
  { value: 'idrett', label: 'Idrettsutøvere, trenere, dommere' },
  { value: 'annet', label: 'Annet (bruk «Skriv fritekst» for å spesifisere)' },
];

export const workTimeArrangements = [
  { value: 'normal', label: 'Normal arbeidstid' },
  { value: 'shift', label: 'Skiftarbeid' },
  { value: 'flexible', label: 'Fleksitid' },
  { value: 'average_calculated', label: 'Gjennomsnittsberegnet' },
  { value: 'reduced', label: 'Redusert arbeidstid' },
  { value: 'exempt_manager', label: 'Ledende stilling (unntatt)' },
  { value: 'exempt_independent', label: 'Særlig uavhengig stilling (unntatt)' },
];

export const salaryTypes = [
  { value: 'monthly', label: 'Månedslønn' },
  { value: 'hourly', label: 'Timelønn' },
  { value: 'annual', label: 'Årslønn' },
];

export const paymentMethods = [
  { value: 'bank_transfer', label: 'Bankoverføring' },
  { value: 'other', label: 'Annet' },
];
