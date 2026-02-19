export const vacantPosition = async (
  position_id: number,
  token: string,
  page?: number,
  perPage?: number | string
) => {
  const query = new URLSearchParams();
  query.set("pos", position_id.toString());
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(
    `${apiUrl}/api/affiliates/officers/vacant-position?${query.toString()}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  
  const result = await res.json();
  return {
    items: result.data,
    current_page: result.meta?.current_page || 1,
    last_page: result.meta?.last_page || 1,
    per_page:
    result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
    total: result.meta?.total || result.data.length,
  };
};
