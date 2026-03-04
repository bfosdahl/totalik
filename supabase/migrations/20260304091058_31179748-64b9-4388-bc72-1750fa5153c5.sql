ALTER TABLE public.deviations DROP CONSTRAINT deviations_category_check;
ALTER TABLE public.deviations ADD CONSTRAINT deviations_category_check CHECK (category = ANY (ARRAY[
  'quality'::text, 'safety'::text, 'environment'::text, 'documentation'::text, 
  'other'::text, 'process'::text, 'equipment'::text, 'personnel'::text,
  'temperature'::text, 'cleaning'::text, 'pest_control'::text, 'allergen'::text,
  'traceability'::text, 'hygiene'::text, 'storage'::text, 'pests'::text,
  'expiry'::text, 'contamination'::text, 'receiving'::text, 'other_food'::text
]));