// components/information/CreateInformation.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { information, type InformationForm } from "../../api/information";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/InputField";
import Textarea from "../ui/TextAreaInput";
import Select from "../ui/SelectField";
import toast from "react-hot-toast";

interface CreateInformationProps {
  renderButton?: React.ReactNode;
}

export default function CreateInformation({ renderButton }: CreateInformationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<InformationForm>({
    type: 'announcement',
    title: '',
    content: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InformationForm, string>>>({});
  
  const queryClient = useQueryClient();

  const { mutate: createInformation, isPending } = useMutation({
    mutationFn: (data: InformationForm) => information.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-information"] });
      queryClient.invalidateQueries({ queryKey: ["grid-information"] });
      queryClient.invalidateQueries({ queryKey: ["information-categories"] });
      toast.success("Information created successfully");
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Create information error:", error);
      
      // Try to get more detailed error information
      if (error.response) {
        console.error("Response error:", error.response);
      }
      
      toast.error(error.message || "Failed to create information");
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'announcement',
      title: '',
      content: '',
      status: 'draft',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InformationForm, string>> = {};
    
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
      console.log("Submitting form data:", formData);
      createInformation(formData);
    }
  };

  const handleChange = (field: keyof InformationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      {renderButton ? (
        <div onClick={() => setIsOpen(true)}>{renderButton}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Information
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Create New Information"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <Select
              value={formData.type}
              onChange={(value) => handleChange('type', value as InformationForm['type'])}
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
              onChange={(value) => handleChange('status', value as InformationForm['status'])}
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
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Information"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}