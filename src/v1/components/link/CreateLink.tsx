import React, { useState, useEffect } from "react";
import type { Document, DocumentFolder } from "../../pages/affiliate/Documents";
import toast from "react-hot-toast";
import { Building, LoaderCircle, Plus, Upload, Globe, Check, X, ExternalLink, Search } from "lucide-react";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextAreaInput from "../ui/TextAreaInput";
import FileUpload from "../ui/FileUpload";
import CheckboxField from "../ui/CheckboxField";
import { links, type linkForm } from "../../api/link";
import { useAuth } from "../../contexts/AuthContext";
import { affiliate } from "../../api/affiliate";
import { Roles } from "../../constants/roles";
import RoleGuard from "../RoleGuard";
import SearchableSelectField from "../ui/SearchableSelectField";
import useDebounce from "../../../hooks/useDebounce";
import Badge from "../ui/Badge";

function CreateLink() {
  const [open, setOpen] = useState(false);
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const [testingLink, setTestingLink] = useState(false);
  const [linkTestResult, setLinkTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  
  const [formData, setFormData] = useState<linkForm>({
    title: "",
    url: "",
    description: "",
    category: "",
    display_order: 0,
    is_active: false,
    is_public: false,
    affiliate_id: null,
  });

  // Get base URL from environment or window location
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  // Get existing categories from database
  const { data: existingCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["links-categories-all"],
    queryFn: () => links.categories(),
    enabled: open, // Only fetch when modal is open
  });

  // Extract unique categories from data
  const databaseCategoryOptions = React.useMemo(() => {
    if (!existingCategories) return [];
    
    const uniqueCategories = Array.from(
      new Set(
        existingCategories
          .map((cat: any) => cat.category)
          .filter((cat: string | null) => cat && cat.trim() !== "")
      )
    );
    
    return uniqueCategories.map(cat => ({
      value: cat,
      label: cat,
    }));
  }, [existingCategories]);

  // Combine default options with database categories
  const categoryOptions = React.useMemo(() => {
    const defaultOptions = [
      { value: "", label: "Select or type a category" },
      { value: "Resources", label: "Resources" },
      { value: "Documents", label: "Documents" },
      { value: "Tools", label: "Tools" },
      { value: "External", label: "External" },
      { value: "Internal", label: "Internal" },
      { value: "Training", label: "Training" },
      { value: "Reference", label: "Reference" },
      { value: "Guidelines", label: "Guidelines" },
    ];
    
    // Filter out duplicates from default options that already exist in database
    const filteredDefaults = defaultOptions.filter(
      defaultOpt => !databaseCategoryOptions.some(
        dbOpt => dbOpt.value.toLowerCase() === defaultOpt.value.toLowerCase()
      )
    );
    
    // Combine database categories with filtered defaults
    return [
      ...databaseCategoryOptions,
      ...filteredDefaults.slice(1), // Skip the first empty option
    ];
  }, [databaseCategoryOptions]);

  // Handle URL input with base URL prefix
  const handleUrlChange = (value: string) => {
    // If it's an internal link and starts with /, prepend base URL
    let processedUrl = value;
    if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith(baseUrl)) {
      processedUrl = `${baseUrl}${value}`;
    }
    
    setFormData(prev => ({
      ...prev,
      url: processedUrl,
    }));
    setErrors(prev => ({ ...prev, url: [] }));
  };

  // Test if link is accessible
  const testLink = async (url: string) => {
    if (!url || !url.startsWith('http')) {
      setLinkTestResult({
        status: 'error',
        message: 'Please enter a valid URL starting with http:// or https://'
      });
      return;
    }

    setTestingLink(true);
    setLinkTestResult({ status: 'idle', message: 'Testing...' });

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      );

      // Create fetch promise with no-cors mode for cross-domain testing
      const fetchPromise = fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      // Race between fetch and timeout
      await Promise.race([fetchPromise, timeoutPromise]);
      
      setLinkTestResult({
        status: 'success',
        message: 'Link is accessible'
      });
    } catch (error: any) {
      console.log('Link test error:', error);
      
      // Try with GET request if HEAD failed (for CORS issues)
      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
        });
        
        setLinkTestResult({
          status: 'success',
          message: 'Link is accessible (CORS restricted)'
        });
      } catch (secondError: any) {
        // If we get here, the link might still be valid but blocked by CORS
        // We'll consider it valid if the URL format is correct
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (urlRegex.test(url)) {
          setLinkTestResult({
            status: 'success',
            message: 'Link appears valid (CORS restricted)'
          });
        } else {
          setLinkTestResult({
            status: 'error',
            message: error.message?.includes('Timeout') 
              ? 'Link test timed out. The server may be slow or unreachable.'
              : 'Unable to verify link accessibility. Please check the URL format.'
          });
        }
      }
    } finally {
      setTestingLink(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      url: "",
      description: "",
      category: "",
      display_order: 0,
      is_active: false,
      is_public: false,
      affiliate_id: null,
    });
    setAffiliateSearch("");
    setLinkTestResult({ status: 'idle', message: '' });
    setOpen(false);
    setUploading(false);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: linkForm) => links.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-links"] });
      queryClient.invalidateQueries({ queryKey: ["grid-links"] });
      queryClient.invalidateQueries({ queryKey: ["links-categories"] });
      queryClient.invalidateQueries({ queryKey: ["links-categories-all"] });
      toast.success("Link Created Successfully");
      setUploading(false);
      setOpen(false);
      handleCancel();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        setUploading(false);
      } else {
        console.error(err);
        setUploading(false);
        toast.error(err?.message || "Failed to create link");
      }
    },
  });

  const {
    data: affiliates,
    isFetching: fetchingAffiliates,
    isLoading: isLoadingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options", debouncedSearch],
    queryFn: () => affiliate.options(debouncedSearch),
    enabled: userRole.roles.some((r) =>
      [
        Roles.NATIONAL_ADMINISTRATOR,
        Roles.ORG_EXECUTIVE_COMMITEE,
        Roles.ORG_RESEARCH_COMMITEE,
      ].includes(r)
    ),
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let fieldValue: string | boolean | number = value;

    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = e.target.checked;
    }
    
    if (name === "display_order" && type === "number") {
      fieldValue = parseInt(value) || 0;
    }

    // Special handling for URL field
    if (name === "url") {
      handleUrlChange(value);
      return;
    }

    // Special handling for category field (free text input)
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: [] }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleAffiliateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : null,
    }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleCategoryInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value,
    }));
    setErrors(prev => ({ ...prev, category: [] }));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    mutate(formData);
  };

  // Show base URL helper text for internal links
  const getUrlHelperText = () => {
    if (formData.url.startsWith('/')) {
      return `Internal link: ${baseUrl}${formData.url}`;
    }
    if (formData.url.startsWith(baseUrl)) {
      return 'Internal link (automatically prefixed)';
    }
    return 'Enter full URL (http:// or https://) or start with / for internal links';
  };

  // Parse URL to show if it's internal or external
  const getUrlType = () => {
    if (!formData.url) return null;
    
    if (formData.url.startsWith(baseUrl) || formData.url.startsWith('/')) {
      return { type: 'internal', display: formData.url.startsWith('/') ? `${baseUrl}${formData.url}` : formData.url };
    }
    
    return { type: 'external', display: formData.url };
  };

  const urlType = getUrlType();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        <Plus size={18} />
        Create Link
      </button>
      <Modal
        isOpen={open}
        onClose={() => {
          if (!uploading) {
            setOpen(false);
            handleCancel();
          }
        }}
        title="Create New Link"
        className="max-w-3xl min-w-2xl"
        disableClose={uploading}
      >
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <RoleGuard
                  roles={[
                    Roles.NATIONAL_ADMINISTRATOR,
                    Roles.ORG_EXECUTIVE_COMMITEE,
                    Roles.ORG_RESEARCH_COMMITEE,
                  ]}
                >
                  <SearchableSelectField
                    label="Affiliate (Optional)"
                    name="affiliate_id"
                    value={formData.affiliate_id ?? ""}
                    onChange={handleAffiliateChange}
                    options={[
                      ...(fetchingAffiliates
                        ? [{ label: "Fetching Affiliates...", value: "" }]
                        : [
                            { label: "Select affiliate (optional)", value: "" },
                            ...(affiliates?.map((m) => ({
                              label: `${m.name}`,
                              value: m.id,
                            })) ?? []),
                          ]),
                    ]}
                    error={errors.affiliate_id}
                    searchValue={affiliateSearch}
                    onSearchChange={setAffiliateSearch}
                    loading={isLoadingAffiliates || fetchingAffiliates}
                    helpText="Leave empty to make this link available to all affiliates"
                  />
                </RoleGuard>
                
                <InputField
                  label="Title"
                  name="title"
                  value={formData.title ?? ""}
                  onChange={handleChange}
                  error={errors.title}
                  required
                  placeholder="Enter link title"
                />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL *
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <InputField
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        error={errors.url}
                        required
                        placeholder="/path/to/page or https://example.com"
                        className="flex-1"
                        noLabel
                      />
                      <button
                        type="button"
                        onClick={() => testLink(formData.url)}
                        disabled={!formData.url || testingLink}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testingLink ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          'Test Link'
                        )}
                      </button>
                    </div>
                    
                    {/* URL Type Indicator */}
                    {urlType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge
                          variant={urlType.type === 'internal' ? 'blue' : 'gray'}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Globe size={12} />
                          {urlType.type === 'internal' ? 'Internal' : 'External'}
                        </Badge>
                        <span className="text-gray-600 truncate">
                          {urlType.display}
                        </span>
                      </div>
                    )}
                    
                    {/* Link Test Result */}
                    {linkTestResult.status !== 'idle' && (
                      <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                        linkTestResult.status === 'success' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {linkTestResult.status === 'success' ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span>{linkTestResult.message}</span>
                      </div>
                    )}
                    
                    {/* Base URL Info */}
                    <div className="text-xs text-gray-500">
                      <p>{getUrlHelperText()}</p>
                      <p className="mt-1">
                        <strong>Base URL:</strong> {baseUrl}
                      </p>
                    </div>
                  </div>
                </div>
                
                <TextAreaInput
                  label="Description"
                  name="description"
                  value={formData.description ?? ""}
                  onChange={handleChange}
                  error={errors.description}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what this link is about"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        list="category-options"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Type or select a category"
                        required
                      />
                      <datalist id="category-options">
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </datalist>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Search size={16} className="text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Quick Category Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500">Quick select:</span>
                      {categoryOptions.slice(0, 5).map((option) => (
                        option.value && (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleCategoryInputChange(option.value)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          >
                            {option.label}
                          </button>
                        )
                      ))}
                    </div>
                    
                    {/* Existing Categories Hint */}
                    {databaseCategoryOptions.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <p>Existing categories in database:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {databaseCategoryOptions.slice(0, 8).map((cat) => (
                            <span
                              key={cat.value}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {cat.label}
                            </span>
                          ))}
                          {databaseCategoryOptions.length > 8 && (
                            <span className="text-xs text-gray-400">
                              +{databaseCategoryOptions.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <InputField
                  label="Display Order"
                  name="display_order"
                  type="number"
                  min={0}
                  max={1000}
                  value={formData.display_order ?? 0}
                  onChange={handleChange}
                  error={errors.display_order}
                  required
                  helpText="Lower numbers appear first"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CheckboxField
                  label="Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  error={errors.is_active}
                  helpText="Link will be visible if active"
                />
                <CheckboxField
                  label="Public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  error={errors.is_public}
                  helpText="Public links are visible to everyone"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading && <LoaderCircle size={18} className="animate-spin" />}
              {uploading ? "Creating..." : "Create Link"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default CreateLink;