export type positionForm = {
  member_id: number | undefined;
  position_id: number | undefined;
  start_date: string;
};

export const assignNewOfficer = async (
  form: positionForm,
  token: string,
  affiliate_id?: number,
  page?: number,
  perPage?: number | string
) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const query = new URLSearchParams();
  if (affiliate_id) query.set("affiliate", affiliate_id.toString());
  console.log(form);

  const res = await fetch(
    `${apiUrl}/api/affiliates/officers/assign-member-position?${query.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    }
  );
  if (!res.ok){
    const result = await res.json();
    console.log(result);
    return;
  }

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
