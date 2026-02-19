import InputField from "./../../../ui/InputField";
import SelectField from "./../../../ui/SelectField";

interface MemberDetailsProps {
  member: any;
  onBack: () => void;
  mode: "view" | "edit";
  onEdit?: () => void;
}

export default function MemberDetails({ member, onBack, mode, onEdit }: MemberDetailsProps) {
  // For affiliate officers, these fields should be read-only
  const readOnlyFields = [
    'member_id', 'affiliate', 'login_email', 'status'
  ];

  const isEditable = (fieldName: string) => {
    return mode === "edit" && !readOnlyFields.includes(fieldName);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Personal Information
          </h3>
          
          {/* Member ID - Read Only for Affiliates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member ID
            </label>
            <p className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
              {member.member_id}
            </p>
          </div>

          <InputField
            label="First Name"
            name="first_name"
            value={member.first_name}
            onChange={() => {}}
            className={isEditable('first_name') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('first_name')}
          />
          <InputField
            label="Last Name"
            name="last_name"
            value={member.last_name}
            onChange={() => {}}
            className={isEditable('last_name') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('last_name')}
          />
          <SelectField
            label="Level"
            name="level"
            value={member.level}
            onChange={() => {}}
            options={[
              { label: "Associate", value: "Associate" },
              { label: "Professional", value: "Professional" }
            ]}
            className={isEditable('level') ? '' : 'bg-gray-50'}
            disabled={!isEditable('level')}
          />
          <SelectField
            label="Employment Status"
            name="employment_status"
            value={member.employment_status}
            onChange={() => {}}
            options={[
              { label: "Full Time", value: "Full Time" },
              { label: "Part Time", value: "Part Time" }
            ]}
            className={isEditable('employment_status') ? '' : 'bg-gray-50'}
            disabled={!isEditable('employment_status')}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contact Information
          </h3>
          
          {/* Login Email - Read Only for Affiliates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login Email
            </label>
            <p className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
              {member.user?.email || 'N/A'}
            </p>
          </div>

          <InputField
            label="Work Email"
            name="work_email"
            value={member.work_email || ''}
            onChange={() => {}}
            className={isEditable('work_email') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('work_email')}
          />
          <InputField
            label="Work Phone"
            name="work_phone"
            value={member.work_phone || ''}
            onChange={() => {}}
            className={isEditable('work_phone') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('work_phone')}
          />
          
          {/* Affiliate - Read Only for Affiliates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Affiliate
            </label>
            <p className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
              {member.affiliate?.name || 'N/A'}
            </p>
          </div>

          {/* Status - Read Only for Affiliates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <p className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
              {member.status || 'Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Address Line 1"
            name="address_line1"
            value={member.address_line1 || ''}
            onChange={() => {}}
            className={isEditable('address_line1') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('address_line1')}
          />
          <InputField
            label="Address Line 2"
            name="address_line2"
            value={member.address_line2 || ''}
            onChange={() => {}}
            className={isEditable('address_line2') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('address_line2')}
          />
          <InputField
            label="City"
            name="city"
            value={member.city || ''}
            onChange={() => {}}
            className={isEditable('city') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('city')}
          />
          <InputField
            label="State"
            name="state"
            value={member.state || ''}
            onChange={() => {}}
            className={isEditable('state') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('state')}
          />
          <InputField
            label="ZIP Code"
            name="zip_code"
            value={member.zip_code || ''}
            onChange={() => {}}
            className={isEditable('zip_code') ? '' : 'bg-gray-50'}
            readOnly={!isEditable('zip_code')}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={onBack}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 font-medium"
        >
          {mode === "edit" ? "Cancel" : "Close"}
        </button>
        {mode === "view" && onEdit && (
          <button
            onClick={onEdit}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            Edit Member
          </button>
        )}
        {mode === "edit" && (
          <button
            type="submit"
            form="member-form"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
}