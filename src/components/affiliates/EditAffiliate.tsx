import React, { useState } from "react";
import { SquarePen } from "lucide-react";
import Modal from "../Modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import InputField from "../ui/InputField";
import { useAuth } from "../../hooks/useAuth";

type Affiliate = {
  id: number;
  name: string;
  created_by: string | null;
  updated_by: string | null;
  members_count: number;
};

interface Props {
  affiliate: Affiliate;
}

export default function EditAffiliate({ affiliate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Affiliate>(affiliate);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const queryClient = useQueryClient();
  const { session, loading } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Affiliate) => updateAffiliate(data, session!.access_token),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
    },
    onError: async (err: any) => {
      if (err?.errors) setErrors(err.errors);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-yellow-600 transition bg-yellow-100 rounded-full hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        title="Edit"
      >
        <SquarePen className="w-4 h-4" />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit Affiliate"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Affiliate Name"
            name="name" // must match Affiliate type
            value={form.name} // use state value, not props
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

async function updateAffiliate(affiliate: Affiliate, token: string) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(
    `${apiUrl}/api/affiliates/edit-affiliate/${affiliate.id}`,
    {
      method: "PUT", // or POST if your backend expects it
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: affiliate.name }),
    }
  );

  if (!res.ok) throw new Error("Failed to update affiliate");
  return res.json();
}
