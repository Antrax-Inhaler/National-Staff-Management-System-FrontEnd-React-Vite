import { useState, useEffect, useRef } from "react";
import InputField from "./../../../ui/InputField";
import SelectField from "./../../../ui/SelectField";
import { CheckCircle, XCircle, Loader, Smartphone, Monitor } from "lucide-react";
import { affiliatesAPI, type CreateMemberData, type UpdateMemberData } from "../../../../api/affiliates";

interface MemberFormProps {
  member?: any;
  onCancel: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
}

interface ValidationState {
  isValid: boolean;
  message: string;
  isChecking: boolean;
}

export default function MemberForm({
  member,
  onCancel,
  onSuccess,
  mode,
}: MemberFormProps) {
  const [formData, setFormData] = useState({
    member_id: "",
    first_name: "",
    last_name: "",
    login_email: "",
    work_email: "",
    work_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    level: "Associate",
    employment_status: "Full Time",
  });

  const [validationStates, setValidationStates] = useState({
    login_email: { isValid: false, message: "", isChecking: false },
    work_email: { isValid: false, message: "", isChecking: false },
    work_phone: { isValid: false, message: "", isChecking: false },
    member_id: { isValid: false, message: "", isChecking: false },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Detect mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Prefill form in edit mode
  useEffect(() => {
    if (mode === "edit" && member) {
      const initialData = {
        member_id: member.member_id || "",
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        login_email: member.user?.email || "",
        work_email: member.work_email || "",
        work_phone: member.work_phone || "",
        address_line1: member.address_line1 || "",
        address_line2: member.address_line2 || "",
        city: member.city || "",
        state: member.state || "",
        zip_code: member.zip_code || "",
        level: member.level || "Associate",
        employment_status: member.employment_status || "Full Time",
      };
      
      setFormData(initialData);
      
      // Set initial validation states for existing data
      setValidationStates(prev => ({
        ...prev,
        login_email: { ...prev.login_email, isValid: true, message: "Using current email" },
        member_id: { ...prev.member_id, isValid: true, message: "Using current member ID" },
        work_email: { 
          ...prev.work_email, 
          isValid: true, 
          message: member.work_email ? "Using current work email" : "" 
        },
        work_phone: { 
          ...prev.work_phone, 
          isValid: true, 
          message: member.work_phone ? "Using current work phone" : "" 
        },
      }));
    }
  }, [member, mode]);

  // Real-time validation using backend API
  const validateFieldRealTime = async (field: string, value: string): Promise<void> => {
    // Clear any existing timeout for this field
    if (debounceTimeouts.current[field]) {
      clearTimeout(debounceTimeouts.current[field]);
    }

    // Skip validation if field is empty (except for required fields)
    if (!value.trim() && field !== 'login_email' && field !== 'member_id') {
      setValidationStates(prev => ({
        ...prev,
        [field]: { isValid: true, message: "", isChecking: false }
      }));
      return;
    }

    // Set checking state immediately
    setValidationStates(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev], isChecking: true, message: "Checking..." }
    }));

    debounceTimeouts.current[field] = setTimeout(async () => {
      try {
        const result = await affiliatesAPI.validateField(
          field, 
          value, 
          mode === "edit" ? member?.id : undefined
        );

        setValidationStates(prev => ({
          ...prev,
          [field]: { 
            isValid: result.valid, 
            message: result.message, 
            isChecking: false 
          }
        }));
      } catch (err: any) {
        setValidationStates(prev => ({
          ...prev,
          [field]: { 
            isValid: false, 
            message: "Validation error occurred", 
            isChecking: false 
          }
        }));
      }
    }, isMobile ? 800 : 500); // Longer debounce on mobile for better UX
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear form errors when user starts typing
    setFormErrors(prev => ({ ...prev, [name]: [] }));
    setError("");

    // Real-time validation for specific fields
    if (['login_email', 'work_email', 'work_phone', 'member_id'].includes(name)) {
      validateFieldRealTime(name, value);
    }
  };

  // Convert single error string to array for InputField/SelectField components
  const getErrorArray = (errorString: string | undefined): string[] => {
    return errorString ? [errorString] : [];
  };

  // Validate entire form before submission
  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string[]> = {};

    // Required field validation
    if (!formData.first_name?.trim()) errors.first_name = ["First name is required"];
    if (!formData.last_name?.trim()) errors.last_name = ["Last name is required"];
    if (!formData.login_email?.trim()) errors.login_email = ["Login email is required"];
    if (!formData.member_id?.trim()) errors.member_id = ["Member ID is required"];
    if (!formData.level) errors.level = ["Level is required"];
    if (!formData.employment_status) errors.employment_status = ["Employment status is required"];

    // Email format validation
    if (formData.login_email && !/\S+@\S+\.\S+/.test(formData.login_email)) {
      errors.login_email = ["Please enter a valid login email"];
    }
    if (formData.work_email && !/\S+@\S+\.\S+/.test(formData.work_email)) {
      errors.work_email = ["Please enter a valid work email"];
    }

    // Phone validation
    if (formData.work_phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.work_phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.work_phone = ["Please enter a valid phone number"];
    }

    // Check validation states
    if (!validationStates.login_email.isValid && validationStates.login_email.message) {
      errors.login_email = [validationStates.login_email.message];
    }
    if (!validationStates.member_id.isValid && validationStates.member_id.message) {
      errors.member_id = [validationStates.member_id.message];
    }
    if (formData.work_email && !validationStates.work_email.isValid && validationStates.work_email.message) {
      errors.work_email = [validationStates.work_email.message];
    }
    if (formData.work_phone && !validationStates.work_phone.isValid && validationStates.work_phone.message) {
      errors.work_phone = [validationStates.work_phone.message];
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Clear any pending debounce timeouts
    Object.values(debounceTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });

    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      setError("Please fix the validation errors before submitting.");
      return;
    }

    try {
      if (mode === "create") {
        const createData: CreateMemberData = {
          member_id: formData.member_id.trim().toUpperCase(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          login_email: formData.login_email.trim().toLowerCase(),
          work_email: formData.work_email?.trim().toLowerCase() || formData.login_email.trim().toLowerCase(), // Use login email as work email
          work_phone: formData.work_phone?.trim() || null,
          address_line1: formData.address_line1?.trim() || null,
          address_line2: formData.address_line2?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          zip_code: formData.zip_code?.trim() || null,
          level: formData.level,
          employment_status: formData.employment_status,
        };

        await affiliatesAPI.createMember(createData);
      } else {
        const updateData: UpdateMemberData = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          work_email: formData.work_email?.trim().toLowerCase() || formData.login_email.trim().toLowerCase(), // Use login email as work email
          work_phone: formData.work_phone?.trim() || null,
          address_line1: formData.address_line1?.trim() || null,
          address_line2: formData.address_line2?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          zip_code: formData.zip_code?.trim() || null,
          level: formData.level,
          employment_status: formData.employment_status,
        };

        await affiliatesAPI.updateMember(member.id, updateData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validation icon component
  const ValidationIcon = ({ field }: { field: keyof typeof validationStates }) => {
    const state = validationStates[field];
    
    if (state.isChecking) {
      return <Loader size={16} className="text-gray-400 animate-spin" />;
    }
    
    if (state.message && !state.isChecking) {
      return state.isValid ? 
        <CheckCircle size={16} className="text-green-500" /> : 
        <XCircle size={16} className="text-red-500" />;
    }
    
    return null;
  };

  // Disable certain fields in edit mode
  const isFieldDisabled = (fieldName: string) => {
    if (mode === "edit") {
      const disabledFields = ["login_email", "member_id"];
      return disabledFields.includes(fieldName);
    }
    return false;
  };

  // Check if form is valid for submission
  const isFormValid = Object.values(validationStates).every(state => state.isValid) && 
                     Object.values(formErrors).every(errors => errors.length === 0);

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Responsive Indicator */}
      {isMobile && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg">
          <Smartphone size={14} />
          <span>Mobile Form - Scroll to see all fields</span>
        </div>
      )}

      <form id="member-form" onSubmit={handleSubmit} className="space-y-6 p-1">
        {error && (
          <div className="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Form Header */}
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            {mode === "create" ? "Create New Member" : "Edit Member"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {mode === "create" 
              ? "Fill in the member details below" 
              : "Update the member information"}
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 md:text-xl">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {/* Member ID */}
            <div className="relative md:col-span-2 lg:col-span-1">
              <InputField
                label="Member ID"
                name="member_id"
                value={formData.member_id}
                onChange={handleInputChange}
                required
                readOnly={isFieldDisabled("member_id")}
                error={getErrorArray(formErrors.member_id?.[0])}
                size={isMobile ? "sm" : "md"}
                className={isFieldDisabled("member_id") ? "bg-gray-50" : ""}
              />
              <div className={`absolute ${isMobile ? 'right-3 top-10' : 'right-3 top-1/2 transform -translate-y-1/2'}`}>
                <ValidationIcon field="member_id" />
              </div>
              {validationStates.member_id.message && !validationStates.member_id.isChecking && (
                <p className={`text-xs mt-2 md:text-sm md:mt-1 ${validationStates.member_id.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationStates.member_id.message}
                </p>
              )}
            </div>

            {/* First Name */}
            <InputField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              error={getErrorArray(formErrors.first_name?.[0])}
              size={isMobile ? "sm" : "md"}
            />

            {/* Last Name */}
            <InputField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              error={getErrorArray(formErrors.last_name?.[0])}
              size={isMobile ? "sm" : "md"}
            />

            {/* Login Email */}
            <div className="relative md:col-span-2 lg:col-span-1">
              <InputField
                label="Email Address"
                name="login_email"
                type="email"
                value={formData.login_email}
                onChange={handleInputChange}
                required={mode === "create"}
                readOnly={mode === "edit"}
                error={getErrorArray(formErrors.login_email?.[0])}
                size={isMobile ? "sm" : "md"}
                className={mode === "edit" ? "bg-gray-50" : ""}
              />
              <div className={`absolute ${isMobile ? 'right-3 top-10' : 'right-3 top-1/2 transform -translate-y-1/2'}`}>
                <ValidationIcon field="login_email" />
              </div>
              {validationStates.login_email.message && !validationStates.login_email.isChecking && (
                <p className={`text-xs mt-2 md:text-sm md:mt-1 ${validationStates.login_email.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationStates.login_email.message}
                </p>
              )}
            </div>

            {/* Level */}
            <SelectField
              label="Level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              options={[
                { label: "Associate", value: "Associate" },
                { label: "Professional", value: "Professional" },
              ]}
              required
              error={getErrorArray(formErrors.level?.[0])}
              size={isMobile ? "sm" : "md"}
            />

            {/* Employment Status */}
            <SelectField
              label="Employment Status"
              name="employment_status"
              value={formData.employment_status}
              onChange={handleInputChange}
              options={[
                { label: "Full Time", value: "Full Time" },
                { label: "Part Time", value: "Part Time" },
              ]}
              required
              error={getErrorArray(formErrors.employment_status?.[0])}
              size={isMobile ? "sm" : "md"}
            />

            {/* Work Phone */}
            <div className="relative md:col-span-2 lg:col-span-1">
              <InputField
                label="Work Phone"
                name="work_phone"
                value={formData.work_phone}
                onChange={handleInputChange}
                error={getErrorArray(formErrors.work_phone?.[0])}
                size={isMobile ? "sm" : "md"}
                placeholder="+1 (555) 123-4567"
              />
              <div className={`absolute ${isMobile ? 'right-3 top-10' : 'right-3 top-1/2 transform -translate-y-1/2'}`}>
                <ValidationIcon field="work_phone" />
              </div>
              {validationStates.work_phone.message && !validationStates.work_phone.isChecking && (
                <p className={`text-xs mt-2 md:text-sm md:mt-1 ${validationStates.work_phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationStates.work_phone.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 md:text-xl">
            Address Information
          </h3>
          
          <div className="p-4 bg-gray-50 rounded-lg md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <InputField
                label="Address Line 1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                size={isMobile ? "sm" : "md"}
              />
              <InputField
                label="Address Line 2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                size={isMobile ? "sm" : "md"}
              />
              <InputField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                size={isMobile ? "sm" : "md"}
              />
              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                size={isMobile ? "sm" : "md"}
              />
              <InputField
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                size={isMobile ? "sm" : "md"}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-3 pt-6 border-t md:flex-row md:justify-end md:space-x-4 md:gap-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 md:py-2 md:text-base"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 md:py-2 md:text-base"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </span>
            ) : mode === "create" ? (
              "Create Member"
            ) : (
              "Update Member"
            )}
          </button>
        </div>

        {/* Mobile Form Status */}
        {isMobile && (
          <div className="p-3 text-xs text-center text-gray-500 bg-gray-50 rounded-lg">
            {!isFormValid ? "Please fill all required fields correctly" : "Form is ready to submit"}
          </div>
        )}
      </form>
    </div>
  );
}