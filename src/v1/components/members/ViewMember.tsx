import React, { useState, useRef } from "react";
import { SquarePen, AlertCircle, Camera, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import Modal from "../ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import type { City, State } from "../ui/StateCitySelect/types";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import CitySelect from "../ui/StateCitySelect/CitySelect";
import { affiliate } from "../../api/affiliate";
import { members } from "../../api/member";
import toast from "react-hot-toast";
import { States } from "../../constants/states";
import type { Member } from "../../pages/Members";
import ClickableAvatar from "../../../components/ui/ClickableAvatar";

interface MemberProps {
  member: Member;
  queryKey: any[];
  requiredAffiliateId?: boolean;
}

export default function ViewMember({
  member,
  queryKey,
  requiredAffiliateId = false,
}: MemberProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [form, setForm] = useState<Member>(member);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const getUserInitials = () => {
    const firstInitial = form.first_name?.charAt(0) || "";
    const lastInitial = form.last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
    setGeneralError("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setProfilePhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };

  const key = form.affiliate_id ? `members-${form.affiliate_id}` : "members";

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Member & { profile_photo?: File }) =>
      members.update(payload),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setErrors({});
      setGeneralError("");
      setProfilePhoto(null);
      setPhotoPreview("");
      toast.success("Member updated successfully");
    },
    onError: async (err: any) => {
      console.error("Edit member error:", err);

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
    setErrors({});
    setGeneralError("");

    try {
      const payload = {
        ...form,
        profile_photo: profilePhoto || undefined,
      };

      mutate(payload);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleStateChange = (state: State) => {
    setForm((prev) => (prev ? { ...prev, ["state"]: state.name } : prev));
    setForm((prev) => (prev ? { ...prev, ["state_id"]: state.id } : prev));

    setErrors((prev) => ({
      ...prev,
      state: [],
      state_id: [],
    }));
    setGeneralError("");
  };

  const handleCityChange = (city: City) => {
    setForm((prev) => (prev ? { ...prev, ["city"]: city.name } : prev));

    setErrors((prev) => ({
      ...prev,
      city: [],
    }));
    setGeneralError("");
  };

  const resetForm = () => {
    setForm(member);
    setErrors({});
    setGeneralError("");
    setProfilePhoto(null);
    setPhotoPreview("");

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-blue-600 transition rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Edit Member Info"
      >
        <Eye className="w-4 h-4" />
      </button>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Member Information"
        className="max-w-3xl bg-gray-100 min-w-2xl"
      >
        <div className="space-y-6 text-xs rounded-lg text-start">
          {/* Basic Information */}
          <section className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex justify-center p-4 my-2">
              <div className="flex items-center justify-center overflow-hidden bg-gray-200 rounded-full w-36 h-36">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="object-cover w-full h-full rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"; // hide if broken
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {member.first_name?.[0] ?? "?"}
                    {member.last_name?.[0] ?? ""}
                  </span>
                )}
              </div>
            </div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { label: "First Name", value: member.first_name },
                { label: "Last Name", value: member.last_name },
                { label: "Date of Birth", value: member.date_of_birth ?? "-" },
                { label: "Date of Hire", value: member.date_of_hire ?? "-" },
                { label: "Gender", value: member.gender },
                { label: "Level", value: member.level },
                { label: "Status", value: member.status },
                { label: "Employment Status", value: member.employment_status },
                { label: "Self Identification", value: member.self_id },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-xs font-medium text-gray-500">
                    {item.label}
                  </label>
                  <p className="mt-1 text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Address */}
          <section className="p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Address
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { label: "Address Line 1", value: member.address_line1 },
                { label: "Address Line 2", value: member.address_line2 ?? "-" },
                { label: "State", value: member.state },
                { label: "City", value: member.city },
                { label: "Zip Code", value: member.zip_code },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-xs font-medium text-gray-500">
                    {item.label}
                  </label>
                  <p className="mt-1 text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Information */}
          <section className="p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { label: "Personal Email", value: member.work_email },
                { label: "Mobile Phone", value: member.mobile_phone },
                { label: "Home Phone", value: member.home_phone ?? "-" },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-xs font-medium text-gray-500">
                    {item.label}
                  </label>
                  <p className="mt-1 text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}
