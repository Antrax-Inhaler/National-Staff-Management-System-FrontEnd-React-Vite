// src/v1/components/link/LinkFormModal.tsx
import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { LoaderCircle, Plus, SquarePen, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import TextAreaInput from "../ui/TextAreaInput";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { links, type linkForm, type updateLinkForm } from "../../api/link";
import { useAuth } from "../../contexts/AuthContext";
import { affiliate } from "../../api/affiliate";
import { Roles } from "../../constants/roles";
import RoleGuard from "../RoleGuard";

// Import the new UI components
import ComboInput from "../ui/ComboInput";
import SmartUrlInput from "../ui/SmartUrlInput";

interface LinkFormModalProps {
  mode: "create" | "edit";
  link?: any;
  renderButton?: React.ReactNode;
  buttonClassName?: string;
  onSuccess?: () => void;
}

interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  display_order: number;
  affiliate_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  affiliate?: {
    id: number;
    name: string;
    public_uid?: string;
  } | null;
}

const DEFAULT_CATEGORIES = [
  "Resources",
  "Documents", 
  "Tools",
  "External",
  "Internal",
  "Training",
  "Reference",
  "Guidelines",
  "Forms",
  "Templates",
  "Policies",
  "Manuals"
];

function LinkFormModal({ 
  mode, 
  link, 
  renderButton, 
  buttonClassName,
  onSuccess 
}: LinkFormModalProps) {
  const [open, setOpen] = useState(false);
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [urlValidating, setUrlValidating] = useState(false);

  const BASE_URL = window.location.origin;

  const [formData, setFormData] = useState<linkForm | updateLinkForm>(mode === "edit" && link ? {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description ?? "",
    category: link.category ?? "",
    display_order: link.display_order ?? 0,
    is_active: link.is_active ?? false,
    affiliate_id: link.affiliate_id ?? null,
  } : {
    title: "",
    url: "",
    description: "",
    category: "",
    display_order: 0,
    is_active: true,
    affiliate_id: null,
  });

  // Fetch existing categories from database
  const { data: existingCategories = [] } = useQuery({
    queryKey: ["links-all-categories"],
    queryFn: () => links.categories(),
    enabled: open,
  });

  // Combine default categories with existing ones
  const allCategories = useMemo(() => {
    const dbCategories = existingCategories?.map((cat: any) => cat.category).filter(Boolean) || [];
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories]));
    return combined;
  }, [existingCategories]);

  // Fetch affiliates for national admins - FIXED: Check role string properly
  const userRolesArray = Array.isArray(userRole?.roles) ? userRole.roles : [];
  const shouldFetchAffiliates = userRolesArray.some((r: string) =>
    [
      Roles.NATIONAL_ADMINISTRATOR,
      Roles.ORG_EXECUTIVE_COMMITEE,
      Roles.ORG_RESEARCH_COMMITEE,
    ].includes(r as any)
  );

  const {
    data: affiliates,
    isFetching: fetchingAffiliates,
    isLoading: isLoadingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options"],
    queryFn: () => affiliate.options(""),
    enabled: open && shouldFetchAffiliates,
  });

  // Format affiliates for ComboInput - FIXED: Proper formatting
  const affiliateOptions = useMemo(() => {
    if (!affiliates) return [];
    return affiliates.map((aff: any) => ({
      label: aff.name || `Affiliate ${aff.id}`,
      value: aff.id,
    }));
  }, [affiliates]);

  // Format categories for ComboInput - FIXED: Handle null/undefined values
  const categoryOptions = useMemo(() => {
    return allCategories
      .filter((category): category is string => Boolean(category))
      .map(category => ({
        label: category,
        value: category,
      }));
  }, [allCategories]);

  // Mutation for create/update
  const mutation = useMutation({
    mutationFn: (payload: linkForm | updateLinkForm) => 
      mode === "create" 
        ? links.create(payload as linkForm)
        : links.update(payload as updateLinkForm),
    onSuccess: () => {
      const successMessage = mode === "create" ? "Link created successfully" : "Link updated successfully";
      toast.success(successMessage);
      
      queryClient.invalidateQueries({ queryKey: ["table-links"] });
      queryClient.invalidateQueries({ queryKey: ["grid-links"] });
      queryClient.invalidateQueries({ queryKey: ["links-categories"] });
      queryClient.invalidateQueries({ queryKey: ["links-all-categories"] });
      
      setLoading(false);
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        toast.error(err?.message || `Failed to ${mode} link`);
      }
      setLoading(false);
    },
  });

  // Test URL function - FIXED: Only open URL without validation toast
  const testUrl = () => {
    if (!formData.url.trim()) {
      toast.error("Please enter a URL first");
      return;
    }
    
    setUrlValidating(true);
    
    try {
      // Try to validate URL
      try {
        new URL(formData.url);
      } catch (e) {
        // If invalid, try adding https://
        const urlWithProtocol = formData.url.startsWith('http') 
          ? formData.url 
          : `https://${formData.url}`;
        
        // Open in new tab
        window.open(urlWithProtocol, '_blank', 'noopener,noreferrer');
      } finally {
        // Always try to open in new tab
        window.open(formData.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    } finally {
      setUrlValidating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(mode === "edit" && link ? {
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description ?? "",
      category: link.category ?? "",
      display_order: link.display_order ?? 0,
      is_active: link.is_active ?? false,
      affiliate_id: link.affiliate_id ?? null,
    } : {
      title: "",
      url: "",
      description: "",
      category: "",
      display_order: 0,
      is_active: true,
      affiliate_id: null,
    });
    setErrors({});
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleCancel = () => {
    if (!loading) {
      setOpen(false);
      resetForm();
    }
  };

  // Generic change handler for form fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let fieldValue: any = value;

    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = (e.target as HTMLInputElement).checked;
    }
    
    if (name === "display_order" && type === "number") {
      fieldValue = parseInt(value) || 0;
    }

    if (name === "affiliate_id") {
      fieldValue = value ? parseInt(value) : null;
    }

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors(prev => ({ ...prev, [name]: [] }));
  };

  // Custom handlers for new components
  const handleCategoryChange = (e: any) => {
    const value = e.target?.value || "";
    setFormData(prev => ({
      ...prev,
      category: value,
    }));
    setErrors(prev => ({ ...prev, category: [] }));
  };

  const handleAffiliateChange = (e: any) => {
    const value = e.target?.value || null;
    setFormData(prev => ({
      ...prev,
      affiliate_id: value ? parseInt(value) : null,
    }));
    setErrors(prev => ({ ...prev, affiliate_id: [] }));
  };

  const handleUrlChange = (e: any) => {
    const value = e.target?.value || "";
    setFormData(prev => ({
      ...prev,
      url: value,
    }));
    setErrors(prev => ({ ...prev, url: [] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string[]> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = ["Title is required"];
    }
    
    if (!formData.url.trim()) {
      newErrors.url = ["URL is required"];
    } else {
      try {
        // Try to validate URL, if it fails, try adding https://
        try {
          new URL(formData.url);
        } catch {
          const urlWithProtocol = formData.url.startsWith('http') 
            ? formData.url 
            : `https://${formData.url}`;
          new URL(urlWithProtocol);
        }
      } catch {
        newErrors.url = ["Invalid URL format"];
      }
    }
    
    if (!formData.category?.trim()) {
      newErrors.category = ["Category is required"];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const payload = {
      ...formData,
      affiliate_id: formData.affiliate_id || null,
      is_active: Boolean(formData.is_active),
      display_order: Number(formData.display_order) || 0,
    };
    
    setLoading(true);
    mutation.mutate(payload);
  };

  const modalTitle = mode === "create" ? "Create New Link" : "Edit Link";
  const submitButtonText = mode === "create" ? "Create Link" : "Update Link";

  return (
    <>
      {/* Trigger Button - FIXED: Don't nest buttons */}
      {renderButton ? (
        <div onClick={handleOpen} className={buttonClassName}>
          {renderButton}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${buttonClassName}`}
        >
          {mode === "create" ? <Plus size={18} /> : <SquarePen size={18} />}
          {mode === "create" ? "Create Link" : "Edit"}
        </button>
      )}

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={handleCancel}
        title={modalTitle}
        className="max-w-3xl"
        disableClose={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Affiliate Selection (for National Admins) */}
            <RoleGuard
              roles={[
                Roles.NATIONAL_ADMINISTRATOR,
                Roles.ORG_EXECUTIVE_COMMITEE,
                Roles.ORG_RESEARCH_COMMITEE,
              ]}
            >
              <ComboInput
                label="Affiliate (Optional)"
                name="affiliate_id"
                value={formData.affiliate_id}
                onChange={handleAffiliateChange}
                options={affiliateOptions}
                enableCustomInput={false}
                placeholder="Select affiliate (optional)"
                loading={isLoadingAffiliates || fetchingAffiliates}
                error={errors.affiliate_id}
                mode="dropdown"
                searchable
                size="sm"
              />
              {!errors.affiliate_id && (
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to make this link available to all affiliates
                </p>
              )}
            </RoleGuard>
            
            {/* Title */}
            <InputField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
              placeholder="Enter link title"
              disabled={loading}
            />
            
            {/* URL Field with SmartUrlInput */}
            <div className="space-y-2">
              <SmartUrlInput
                label="URL"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com or example.com"
                required
                disabled={loading}
                error={errors.url}
                size="sm"
                helpText="Enter the full URL or just the domain name"
              />
              <button
                type="button"
                onClick={testUrl}
                disabled={!formData.url.trim() || urlValidating || loading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Test URL (opens in new tab)"
              >
                {urlValidating ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    Test URL
                  </>
                )}
              </button>
            </div>
            
            {/* Description */}
            <TextAreaInput
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of what this link is about"
              disabled={loading}
            />
            
            {/* Category Selection with ComboInput */}
            <ComboInput
              label="Category *"
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              options={categoryOptions}
              enableCustomInput={true}
              creatable={true}
              placeholder="Select or type a category..."
              required
              disabled={loading}
              error={errors.category}
              searchable={true}
              size="sm"
              noOptionsText="No categories found. Type to create a new one."
              createText="Create new category"
            />
            
            {/* Display Order & Status */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  min={0}
                  max={1000}
                  value={formData.display_order}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.display_order ? (
                  <p className="mt-1 text-sm text-red-600">{errors.display_order[0]}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Active</span>
                      <p className="text-xs text-gray-500 mt-0.5">Link will be visible if checked</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading && <LoaderCircle size={18} className="animate-spin" />}
              {loading ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : submitButtonText}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default LinkFormModal;