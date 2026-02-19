// src/api/fetchUserRoles.ts
export async function fetchUserRoles(token: string) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiUrl}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user roles");
  }

  return res.json();
}
