-- Add columns to deviations table to support both Avvik and RUH
ALTER TABLE deviations
ADD COLUMN type text NOT NULL DEFAULT 'avvik' CHECK (type IN ('avvik', 'ruh')),
ADD COLUMN incident_time time,
ADD COLUMN incident_location text,
ADD COLUMN incident_type text,
ADD COLUMN severity text,
ADD COLUMN consequences text,
ADD COLUMN involved_persons text,
ADD COLUMN root_cause_analysis text,
ADD COLUMN immediate_actions text,
ADD COLUMN preventive_measures text,
ADD COLUMN reporter_contact text,
ADD COLUMN responsible_receiver text,
ADD COLUMN notify_arbeidstilsynet boolean DEFAULT false,
ADD COLUMN notify_insurance boolean DEFAULT false,
ADD COLUMN additional_info text,
ADD COLUMN reporter_signature text,
ADD COLUMN receiver_signature text,
ADD COLUMN signed_at timestamptz;

-- Create index for filtering by type
CREATE INDEX idx_deviations_type ON deviations(type);

COMMENT ON COLUMN deviations.type IS 'Type: avvik (quality deviation) or ruh (undesired incident report)';
COMMENT ON COLUMN deviations.incident_time IS 'RUH: Time when incident occurred';
COMMENT ON COLUMN deviations.incident_location IS 'RUH: Specific location/address of incident';
COMMENT ON COLUMN deviations.incident_type IS 'RUH: Type of incident (fall, near-miss, fire, etc.)';
COMMENT ON COLUMN deviations.severity IS 'RUH: Severity level (observation, near-miss, personal injury)';
COMMENT ON COLUMN deviations.consequences IS 'RUH: Description of personal or material damages';
COMMENT ON COLUMN deviations.involved_persons IS 'RUH: Names of involved or affected persons';
COMMENT ON COLUMN deviations.root_cause_analysis IS 'RUH: Analysis of root cause(s)';
COMMENT ON COLUMN deviations.immediate_actions IS 'RUH: Immediate actions taken';
COMMENT ON COLUMN deviations.preventive_measures IS 'RUH: Proposed improvement measures to prevent recurrence';
COMMENT ON COLUMN deviations.reporter_contact IS 'RUH: Contact information for reporter';
COMMENT ON COLUMN deviations.responsible_receiver IS 'RUH: Name of responsible receiver of report';
COMMENT ON COLUMN deviations.notify_arbeidstilsynet IS 'RUH: Should Arbeidstilsynet be contacted?';
COMMENT ON COLUMN deviations.notify_insurance IS 'RUH: Should insurance company be contacted?';
COMMENT ON COLUMN deviations.reporter_signature IS 'RUH: Reporter signature';
COMMENT ON COLUMN deviations.receiver_signature IS 'RUH: Receiver signature';
COMMENT ON COLUMN deviations.signed_at IS 'RUH: Date when report was signed';