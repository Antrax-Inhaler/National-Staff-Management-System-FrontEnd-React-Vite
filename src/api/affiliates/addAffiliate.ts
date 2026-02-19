export const addAffiliate = async (name: string, token: string) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiUrl}/api/affiliates/create-affiliates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to create affiliate");
  return res.json(); // the newly created affiliate record
};
