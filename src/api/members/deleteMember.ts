export const deleteMember = async (
  id: number,
  token: string
) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiUrl}/api/affiliates/delete-member/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const result = await res.json();
    console.log(result);
    return;
  }

  return res.json();
};
