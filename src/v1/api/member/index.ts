// src/api/members/index.ts
import type {
  DeleteMembers,
  ExportFilter,
  MemberFilter,
  RestoreMembers,
} from "@v1/types";
import { request } from "../../lib/apiRequest";

// Remove the problematic import and define the Member interface locally
export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  home_email: string;
  state_id: number | null;
  home_phone: string;
  mobile_phone: string;
  date_of_birth: string;
  date_of_hire: string;
  gender: string;
  self_id: string;
  status: string;
  member_id: string;
  affiliate_id?: string | number | null;
  profile_photo?: File | string;
  // Add position-related fields
  current_positions?: Array<{
    id: number;
    affiliate_id: number;
    position_id: number;
    member_id: number;
    start_date: string;
    end_date: string | null;
    is_vacant: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    position: {
      id: number;
      name: string;
    };
  }>;
  current_position?: {
    id: number;
    affiliate_id: number;
    position_id: number;
    member_id: number;
    start_date: string;
    end_date: string | null;
    is_vacant: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    position: {
      id: number;
      name: string;
    };
  };
  affiliate?: {
    id: number;
    name: string | null;
    created_by: string | null;
    updated_by: string | null;
    public_uid?: string;
  };
  profile_photo_url?: string | null;
  work_email?: string | null;
  official_email?: string | null;
  work_phone?: string | null;
  work_fax?: string | null;
  non_nso?: boolean;
  public_uid?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  [key: string]: any; // For other properties
}

export interface memberFilter {
  positions?: string[]; // For specific positions filter
  specific_positions?: string[]; // Alias for positions (for backward compatibility)
  employment_status?: string[];
  level?: string[];
  gender?: string[];
  status?: string[];
  has_position?: boolean;
  has_email?: boolean;
  has_phone?: boolean;
  affiliate?: string[];
  // Legacy position filter types
  position?: string[];
}

export interface fetchMembers {
  perPage: number | string;
  page: number;
  search: string;
  filters?: memberFilter;
  sort_by?: string;
  sort_order?: string;
  affiliate?: string;
}

export interface fetchArchives {
  perPage: number | string;
  page: number;
  search: string;
  specific?: boolean; // Make optional
  affiliate?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface affiliateMember extends fetchMembers {
  id: string | undefined;
}

export interface memberForm {
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  home_email: string;
  state_id: number | null;
  home_phone: string;
  mobile_phone: string;
  date_of_birth: string;
  date_of_hire: string;
  gender: string;
  self_id: string;
  status: string;
  member_id: string;
  affiliate_id?: string | number | null;
  profile_photo?: File;
  work_email?: string;
  work_phone?: string;
  work_fax?: string;
  non_nso?: boolean;
}

export const members = {
  async all(params: fetchMembers) {
    const { perPage, page, search, filters, sort_by, sort_order, affiliate } =
      params;
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    if (search) query.set("search", search);

    // Handle affiliate filter
    if (affiliate) query.set("affiliate", affiliate);

    // Handle filters - IMPORTANT: Send as individual query params, not nested object
    if (filters) {
      // Handle positions filter - send as 'positions' parameter
      if (filters.positions?.length)
        query.set("positions", filters.positions.join(","));

      // Also send as specific_positions for backward compatibility
      if (filters.specific_positions?.length)
        query.set("specific_positions", filters.specific_positions.join(","));

      // Handle old position filter for compatibility
      if (filters.position?.length)
        query.set("position", filters.position.join(","));

      if (filters.employment_status?.length)
        query.set("employment_status", filters.employment_status.join(","));

      if (filters.level?.length) query.set("level", filters.level.join(","));

      if (filters.gender?.length) query.set("gender", filters.gender.join(","));

      if (filters.status?.length) query.set("status", filters.status.join(","));

      // Handle boolean filters
      if (filters.has_position !== undefined)
        query.set("has_position", filters.has_position.toString());

      if (filters.has_email !== undefined)
        query.set("has_email", filters.has_email.toString());

      if (filters.has_phone !== undefined)
        query.set("has_phone", filters.has_phone.toString());

      // Handle affiliate array filter
      if (filters.affiliate?.length)
        query.set("affiliate_filter", filters.affiliate.join(","));
    }

    if (sort_by) query.set("sort_by", sort_by);
    if (sort_order) query.set("sort_order", sort_order);

    const response = await request(`members/all?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    // Ensure all members have current_positions array
    const membersWithPositions =
      result.data?.map((member: any) => ({
        ...member,
        // Ensure current_positions is always an array
        current_positions:
          member.current_positions ||
          (member.current_position ? [member.current_position] : []),
      })) || [];

    return {
      items: membersWithPositions,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || sort_by,
      sort_order: result.meta?.sort_order || sort_order,
    };
  },

  // async affiliate(params: affiliateMember) {
  //   const { id, perPage, page, search, filters, sort_by, sort_order } = params;
  //   const query = new URLSearchParams();
  //   query.set("per_page", perPage.toString());
  //   query.set("page", page.toString());

  //   if (search) query.set("search", search);

  //   if (filters) {
  //     // Handle position filters - send them all to backend
  //     if (filters.position?.length)
  //       query.set("position", filters.position.join(","));

  //     if (filters.positions?.length)
  //       query.set("positions", filters.positions.join(","));

  //     // CRITICAL FIX: Add specific_positions for affiliate members
  //     if (filters.specific_positions?.length)
  //       query.set("specific_positions", filters.specific_positions.join(","));

  //     if (filters.employment_status?.length)
  //       query.set("employment_status", filters.employment_status.join(","));

  //     if (filters.level?.length) query.set("level", filters.level.join(","));

  //     if (filters.gender?.length) query.set("gender", filters.gender.join(","));

  //     if (filters.status?.length) query.set("status", filters.status.join(","));

  //     if (filters.has_position !== undefined)
  //       query.set("has_position", filters.has_position.toString());

  //     if (filters.has_email !== undefined)
  //       query.set("has_email", filters.has_email.toString());

  //     if (filters.has_phone !== undefined)
  //       query.set("has_phone", filters.has_phone.toString());
  //   }

  //   if (sort_by) query.set("sort_by", sort_by);
  //   if (sort_order) query.set("sort_order", sort_order);

  //   const response = await request(
  //     `members/affiliate/${id}?${query.toString()}`,
  //   );
  //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  //   const result = await response.json();

  //   // Ensure all members have current_positions array
  //   const membersWithPositions =
  //     result.data?.map((member: any) => ({
  //       ...member,
  //       // Ensure current_positions is always an array
  //       current_positions:
  //         member.current_positions ||
  //         (member.current_position ? [member.current_position] : []),
  //     })) || [];

  //   return {
  //     items: membersWithPositions,
  //     current_page: result.meta?.current_page || 1,
  //     last_page: result.meta?.last_page || 1,
  //     per_page:
  //       result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
  //     total: result.meta?.total || result.data.length,
  //     sort_by: result.meta?.sort_by || sort_by,
  //     sort_order: result.meta?.sort_order || sort_order,
  //   };
  // },

  async create(payload: memberForm) {
    const formData = new FormData();

    // Append all fields to FormData
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof memberForm];
      if (value !== undefined && value !== null) {
        if (key === "profile_photo" && value instanceof File) {
          formData.append("profile_photo", value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    console.log("Creating member with data:", Object.fromEntries(formData));

    const response = await request("members/create", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to create member");
    }

    // Ensure result has current_positions array
    if (result.data) {
      result.data.current_positions =
        result.data.current_positions ||
        (result.data.current_position ? [result.data.current_position] : []);
    }

    return result;
  },

  async update(payload: Member & { profile_photo?: File }) {
    const formData = new FormData();

    // Append all fields to FormData
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof Member];
      if (value !== undefined && value !== null) {
        if (key === "profile_photo" && value instanceof File) {
          formData.append("profile_photo", value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    console.log("Updating member with data:", Object.fromEntries(formData));

    const response = await request("members/update", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        console.log(result);
        throw result;
      }
      throw new Error(result.message || "Failed to update member");
    }

    // Ensure result has current_positions array
    if (result.data) {
      result.data.current_positions =
        result.data.current_positions ||
        (result.data.current_position ? [result.data.current_position] : []);
    }

    return result;
  },

  async show(id: string | number) {
    const response = await request(`members/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch member details");
    }

    // Ensure member has current_positions array
    if (result.data) {
      result.data.current_positions =
        result.data.current_positions ||
        (result.data.current_position ? [result.data.current_position] : []);
    }

    return result.data;
  },

  async remove(id: number, force: boolean = false) {
    const response = await request(`members/remove/${id}`, {
      method: "DELETE",
      body: JSON.stringify({
        force,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw result;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  },

  // async restore(id: number) {
  //   const response = await request(`members/restore/${id}`, {
  //     method: "PATCH",
  //   });
  //   const result = await response.json();
  //   if (!response.ok) {
  //     console.log(result);
  //     if (result.message) {
  //       throw result;
  //     }
  //     throw new Error(`HTTP error! status: ${response.status}`);
  //   }

  //   return result;
  // },

  async archives(params: fetchArchives) {
    const {
      perPage,
      page,
      search,
      affiliate,
      sort_by,
      sort_order,
      // specific = false,
    } = params;
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());
    if (affiliate) query.set("affiliate", affiliate);
    if (search) query.set("search", search);

    const response = await request(`members/archives?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    // Ensure all archived members have current_positions array
    const membersWithPositions =
      result.data?.map((member: any) => ({
        ...member,
        // Ensure current_positions is always an array
        current_positions:
          member.current_positions ||
          (member.current_position ? [member.current_position] : []),
      })) || [];

    return {
      items: membersWithPositions,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || sort_by,
      sort_order: result.meta?.sort_order || sort_order,
    };
  },

  // ==============================================================================================================================================================

  async index(filters: MemberFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`members/index?${query.toString()}`);
    console.log(query.toString());

    const result = await response.json();

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof filters.per_page === "number" ? filters.per_page : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || filters.sort_by,
      sort_order: result.meta?.sort_order || filters.sort_order,
    };
  },

  async affiliate(uid: string, filters: MemberFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(
      `members/affiliate/${uid}?${query.toString()}`,
    );

    const result = await response.json();

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof filters.per_page === "number" ? filters.per_page : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || filters.sort_by,
      sort_order: result.meta?.sort_order || filters.sort_order,
    };
  },

  async export(filters: ExportFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`members/export?${query.toString()}`);

    const result = await response.json();

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof filters.per_page === "number" ? filters.per_page : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || filters.sort_by,
      sort_order: result.meta?.sort_order || filters.sort_order,
    };
  },

  async delete(payload: DeleteMembers) {
    console.log(payload);
    const response = await request(`members/remove`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw result;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return result;
  },

  async archived(filters: ExportFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`members/archive?${query.toString()}`);

    const result = await response.json();

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof filters.per_page === "number" ? filters.per_page : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || filters.sort_by,
      sort_order: result.meta?.sort_order || filters.sort_order,
    };
  },

  async restore(payload: RestoreMembers) {
    const response = await request(`members/restore`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw result;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return result;
  },
};
