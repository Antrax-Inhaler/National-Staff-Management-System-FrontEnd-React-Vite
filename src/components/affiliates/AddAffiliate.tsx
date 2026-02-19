import React, { useState } from "react";
import { Plus, SquarePen } from "lucide-react";
import Modal from "../Modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAffiliate } from "../../api/affiliates/addAffiliate";
import { useAuth } from "../../hooks/useAuth";

export default function AddAffiliate() {
  const [open, setOpen] = useState(false);
  const [affiliateName, setAffiliateName] = useState("");
  const queryClient = useQueryClient();
  const { session, loading } = useAuth();
  
  const { mutate, isPending } = useMutation({
    mutationFn: (name: string) => addAffiliate(name, session!.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      setAffiliateName("");
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(affiliateName); // run the mutation
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
      >
        <Plus size={16} />
        Create Affiliate
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Affiliate"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label
              htmlFor="affiliateName"
              className="block text-sm font-medium text-gray-700"
            >
              Affiliate Name
            </label>
            <input
              id="affiliateName"
              type="text"
              value={affiliateName}
              onChange={(e) => setAffiliateName(e.target.value)}
              placeholder="Enter affiliate name"
              className="w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Actions */}
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
              {isPending ? "Creating..." : " Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
