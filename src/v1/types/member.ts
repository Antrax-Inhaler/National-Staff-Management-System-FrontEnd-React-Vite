import type { Affiliate, AffiliateFilter, BaseFilter } from "@v1/types";

export interface AffiliatePositionFilter {
  position_name?: string[];
}

export interface MemberFilter extends AffiliateFilter {
  state?: string | null;
  employment_status?: string[];
  self_id?: string[];
  level?: string[];
  gender?: string[];
  date_of_hire_to?: string | null;
  date_of_hire_from?: string | null;
  date_of_birth_to?: string | null;
  date_of_birth_from?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ExportFilter extends MemberFilter {
  ids?: string;
  affiliate_uid?: string;
}

export type SelectedMemberData = {
  id: number;
  user_id: number;
  affiliate_id: number;
};

export type Member = {
  id: number;
  user_id: number;
  affiliate_id: number;
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  level: string | null;
  employment_status: string | null;
  status: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  work_email: string | null;
  official_email: string | null;
  work_phone: string | null;
  work_fax: string | null;
  home_email: string | null;
  home_phone: string | null;
  self_id: string | null;
  non_nso: boolean;
  state_id: string | null;
  mobile_phone: string | null;
  date_of_birth: string | null;
  date_of_hire: string | null;
  gender: string | null;
  photo_signed_url: string | null;
  public_uid: string;
  current_positions:
    | [
        {
          id: number;
          affiliate_id: number;
          position_id: number;
          member_id: number;
          start_date: string;
          end_date: string | null;
          is_vacant: boolean;
          is_primary: boolean;
          position: {
            id: number;
            name: string;
          };
        },
      ]
    | null;
  affiliate: Affiliate | null;
};

export interface RestoreMembers {
  ids: number[];
}

export interface DeleteMembers extends RestoreMembers {
  force: boolean;
}
