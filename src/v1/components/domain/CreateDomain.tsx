import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { domain, type domainForm } from "../../api/domain";
import { useAuth } from "../../contexts/AuthContext";
import AlertMessage from "../ui/AlertMessage";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import RadioField from "../ui/RadioFiled";
import { ActionButton } from "@v1/components/ui/ActionButton";

interface CreateMemberProps {
  size?: "sm" | "md" | "lg";
  affiliate_id?: string | number;
}

export default function CreateDomain({
  size = "md",
  affiliate_id,
}: CreateMemberProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string>("");
  console.log("affiliates", affiliate_id);
  const [form, setForm] = useState<domainForm>({
    domain: "",
    type: "domain",
    status: "allow",
    affiliate_id: affiliate_id,
  });

  // Button size classes
  const buttonSizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    let fieldValue: string | boolean = value;

    // ✅ Narrow type safely
    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = e.target.checked;
    }

    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };
  const { mutate, isPending } = useMutation({
    mutationFn: (payload: domainForm) => domain.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains", affiliate_id] });
      setErrors({});
      setGeneralError("");
      setOpen(false);
      toast.success("Domain successfully blocked");
    },
    onError: async (err: any) => {
      console.error("Mutation error:", err);

      if (err?.errors) {
        setErrors(err.errors);
        const errorMessages = Object.values(err.errors).flat() as string[];
        if (errorMessages.length > 0) {
          setGeneralError(`${errorMessages.join(", ")}`);
        }
      } else if (err?.message) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      affiliate_id: affiliate_id, // ✅ Correct
    };
    setErrors({});
    mutate(payload);
  };

  const resetForm = () => {
    setForm({
      domain: "",
      type: "domain",
      status: "allow",
    });
    setErrors({});
    setGeneralError("");
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <ActionButton
        label="Add Domain"
        onClick={() => setOpen(true)}
        icon={Plus}
        iconSize={14}
        buttonClassName="bg-blue-600! hover:bg-blue-700! text-white! font-semibold!"
      />
      <Modal
        disableClose={isPending}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Domain"
      >
        {/* General Error Alert */}
        {generalError && <AlertMessage type="error" message={generalError} />}

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-1 space-y-5 text-xs">
              <section>
                <div className="grid grid-cols-1 gap-3">
                  <InputField
                    label={`${
                      form.type === "domain" ? "Domain" : "Top-Level Domain"
                    } Name`}
                    name="domain"
                    value={form.domain}
                    onChange={handleChange}
                    error={errors.domain}
                    size={isMobile ? "sm" : "md"}
                    required
                  />
                  <div className="p-2 border border-gray-300 rounded-lg">
                    <div>
                      <label>Type</label>
                    </div>
                    <div className="grid gap-2 mt-2">
                      <RadioField
                        label="Full Domain (e.g., example.com)"
                        name="type"
                        value="domain"
                        checked={form.type === "domain"}
                        onChange={handleChange}
                        error={errors.type}
                      />
                      <RadioField
                        label="Top-Level Domain (TLD) (e.g., .org, .com, .edu)"
                        name="type"
                        value="tld"
                        checked={form.type === "tld"}
                        onChange={handleChange}
                        error={errors.type}
                      />
                    </div>
                  </div>

                  <div className="p-2 border border-gray-300 rounded-lg">
                    <div>
                      <label>Domain Status</label>
                    </div>
                    <div className="grid gap-2 mt-2">
                      <RadioField
                        label="Allow"
                        name="status"
                        value="allow"
                        checked={form.status === "allow"}
                        onChange={handleChange}
                        error={errors.status}
                      />
                      <RadioField
                        label="Block"
                        name="status"
                        value="block"
                        checked={form.status === "block"}
                        onChange={handleChange}
                        error={errors.status}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
            <ActionButton
              label="Cancel"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            />
            <ActionButton
              label={isPending ? "Saving..." : "Save"}
              as="submit"
              icon={isPending ? RefreshCcw : undefined}
              loading={isPending}
              disabled={isPending}
              buttonClassName="bg-blue-600! hover:bg-blue-700! text-white! font-bold!"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
