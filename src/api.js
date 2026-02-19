const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function getMembers() {
  const res = await fetch(`${apiUrl}/members`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
