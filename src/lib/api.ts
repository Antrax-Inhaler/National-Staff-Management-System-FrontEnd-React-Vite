export async function fetchUserRoles(token: string) {
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user roles");
  }

  return res.json(); // { id, email, roles: [...] }
}
