import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { information, type Information, type UpdateInformationForm } from "../../api/information";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/InputField";
import Textarea from "../ui/TextAreaInput";
import Select from "../ui/SelectField";
import toast from "react-hot-toast";

interface UpdateInformationProps {
  information: Information;
  renderButton: React.ReactNode;
}

export default function UpdateInformation({ information: info, renderButton }: UpdateInformationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateInformationForm>({
    id: info.id,
    type: info.type,
    title: info.title,
    content: info.content,
    status: info.status,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateInformationForm, string>>>({});
  
  const queryClient = useQueryClient();

  const { mutate: updateInformation, isPending } = useMutation({
    mutationFn: (data: UpdateInformationForm) => information.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-information"] });
      queryClient.invalidateQueries({ queryKey: ["grid-information"] });
      queryClient.invalidateQueries({ queryKey: ["information-categories"] });
      toast.success("Information updated successfully");
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update information");
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateInformationForm, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateInformation(formData);
    }
  };

  const handleChange = (field: keyof UpdateInformationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{renderButton}</div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setFormData({
            id: info.id,
            type: info.type,
            title: info.title,
            content: info.content,
            status: info.status,
          });
          setErrors({});
        }}
        title="Update Information"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <Select
              value={formData.type}
              onChange={(value) => handleChange('type', value as UpdateInformationForm['type'])}
              options={[
                { value: 'announcement', label: 'Announcement' },
                { value: 'policy', label: 'Policy' },
                { value: 'report', label: 'Report' },
                { value: 'update', label: 'Update' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter information title"
              error={errors.title}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Enter information content"
              rows={6}
              error={errors.content}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(value) => handleChange('status', value as UpdateInformationForm['status'])}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Update Information"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}