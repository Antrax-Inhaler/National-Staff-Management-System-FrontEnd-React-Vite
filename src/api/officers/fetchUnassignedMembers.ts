import type { Member } from "../../components/members/AssignAffiliateOfficer";

export const fetchUnassignedMembers = async (
  token: string,
  affiliate_id?: number | undefined
): Promise<Member[]> => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const query = new URLSearchParams();
  if(affiliate_id) query.set("affiliate", affiliate_id.toString());

  const res = await fetch(
    `${apiUrl}/api/affiliates/officers/${affiliate_id}/no-positions`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
};
