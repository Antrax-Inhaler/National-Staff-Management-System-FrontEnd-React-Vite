export const fetchAffiliates = async (
  perPage: number | string,
  page: number,
  searchTerm: string,
  token: string
) => {
  const query = new URLSearchParams();
  query.set("per_page", perPage.toString());
  query.set("page", page.toString());
  if (searchTerm) query.set("search", searchTerm);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(
    `${apiUrl}/api/affiliates/affiliates?${query.toString()}`,
    {
      headers: {
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
