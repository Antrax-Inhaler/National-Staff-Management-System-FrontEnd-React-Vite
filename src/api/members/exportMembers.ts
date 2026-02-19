export const exportMembers = async (params: {
  affiliate_id?: number | null;
  filters: {
    position: string[];
    employment_status: string[];
    level: string[];
  };
  token: string;
}) => {
  const { affiliate_id, filters } = params;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const baseUrl = `${apiUrl}/api/members/export`;

  const query = new URLSearchParams();
  if (affiliate_id) query.set("affiliate_id", affiliate_id?.toString());
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

  return res.blob();
};
