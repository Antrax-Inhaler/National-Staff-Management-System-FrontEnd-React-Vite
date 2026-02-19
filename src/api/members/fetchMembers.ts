export interface Position {
  id: number;
  name: string;
}

export interface CurrentPosition {
  id: number;
  affiliate_id: number;
  position_id: number;
  member_id: number;
  start_date: string; // ISO date string
  end_date: string | null;
  is_vacant: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  position: Position;
}

export interface Member {
  id: number;
  user_id: number;
  affiliate_id: number;
  member_id: string;
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  work_email: string | null;
  work_phone: string | null;
  work_fax: string | null;
  home_email: string | null;
  home_phone: string | null;
  self_id: string | null;
  non_nso: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  current_positions?: CurrentPosition[] | null;
}

export const fetchMembers = async (params: {
  affiliate_id?: number | null;
  perPage: number | string;
  page: number;
  search: string;
  filters: {
    position: string[];
    employment_status: string[];
    level: string[];
  };
  token: string;
}) => {
  const { affiliate_id, search, filters, perPage, page } = params;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const baseUrl = `${apiUrl}/api/members/affiliate/members`;

  const query = new URLSearchParams();
  if (affiliate_id) query.set("affiliate_id", affiliate_id?.toString());
  query.set("per_page", perPage.toString());
  query.set("page", page.toString());

  if (search) query.set("search", search);

  if (filters.position.length) {
    query.set("position", filters.position.join(","));
  }
  if (filters.employment_status.length) {
    query.set("employment_status", filters.employment_status.join(","));
  }
  if (filters.level.length) {
    query.set("level", filters.level.join(","));
  }

  const endpoint = `${baseUrl}?${query.toString()}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    console.log(await res.json());
    throw new Error("Network response was not ok");
  }

  return res.json();
};
