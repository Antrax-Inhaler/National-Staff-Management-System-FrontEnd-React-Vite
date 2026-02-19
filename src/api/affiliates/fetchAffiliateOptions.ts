export const fetchAffiliatesOptions = async (
  token: string
) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(
    `${apiUrl}/api/affiliates/options`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");

  return res.json();
};
