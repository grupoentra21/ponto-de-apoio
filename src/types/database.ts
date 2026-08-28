export type UserRole = 'user' | 'professional' | 'admin';
export type ServiceMode = 'online' | 'in_person' | 'hybrid';
export type ProfessionalStatus =
  'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
export type Professional = {
  id: string;
  profile_id: string;
  professional_type: string;
  registration_number: string;
  registration_region: string;
  bio: string | null;
  service_mode: ServiceMode;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  avatar_path: string | null;
  status: ProfessionalStatus;
  is_published: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
