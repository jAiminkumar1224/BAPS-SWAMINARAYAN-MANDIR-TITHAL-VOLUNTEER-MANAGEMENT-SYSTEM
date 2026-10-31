export interface SevaVibhag {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Volunteer {
  id: string;
  volunteer_id: string;
  name: string;
  mobile_number: string;
  village_name: string;
  xetra_name: string;
  seva_vibhag_id: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at?: string;
  seva_vibhag?: SevaVibhag | null;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  role: 'super_admin' | 'admin';
  created_at: string;
}

export interface VerificationData {
  volunteer_id: string;
  name: string;
  village_name: string;
  xetra_name: string;
  seva_vibhag_name: string;
  photo_path: string | null;
  created_at: string;
  is_valid: boolean;
}
