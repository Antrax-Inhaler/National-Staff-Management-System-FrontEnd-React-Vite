export const deleteAffiliate = async (id: number, token: string) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiUrl}/api/affiliates/delete-affiliate/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to create affiliate");
  return res.json(); // the newly created affiliate record
};
