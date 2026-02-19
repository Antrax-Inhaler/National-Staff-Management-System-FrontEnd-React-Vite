// @v1/components/help-videos/UploadVideoModal.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Upload, Video, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import Modal from '@v1/components/ui/Modal';
import AlertMessage from '@v1/components/ui/AlertMessage';
import { helpVideos } from '@v1/api/helpVideos';
import toast from 'react-hot-toast';

interface UploadVideoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SYSTEM_CATEGORIES = [
  'General',
  'Members',
  'Affiliates', 
  'National Leaders',
  'Audit Logs',
  'Documents',
  'Links',
  'Information',
  'Officers',
  'Configuration',
  'Others'
];

export default function UploadVideoModal({ onClose, onSuccess }: UploadVideoModalProps) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    is_active: true,
    video_file: null as File | null,
    thumbnail_file: null as File | null,
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: FormData) => helpVideos.upload(payload),
    onSuccess: () => {
      toast.success('Video uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['help-videos'] });
      queryClient.invalidateQueries({ queryKey: ['help-videos-statistics'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      console.error('Upload error:', err);
      if (err?.errors) {
        setErrors(err.errors);
        // Show the first error message
        const firstErrorKey = Object.keys(err.errors)[0];
        if (firstErrorKey && err.errors[firstErrorKey][0]) {
          toast.error(err.errors[firstErrorKey][0]);
        } else {
          toast.error(err.message || 'Failed to upload video');
        }
      } else if (err?.message) {
        setErrorMessage(err.message);
        toast.error(err.message);
      } else {
        setErrorMessage('Failed to upload video');
        toast.error('Failed to upload video');
      }
    },
  });
const { data: options } = useQuery({
  queryKey: ['help-videos-options'],
  queryFn: () => helpVideos.getOptions(),
});
const categories = options?.data?.categories || [
  'General',
  'Members',
  'Affiliates', 
  'National Leaders',
  'Audit Logs',
  'Documents',
  'Links',
  'Information',
  'Officers',
  'Configuration',
  'Others'
];
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'video_file' | 'thumbnail_file') => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, [field]: file }));
    
    // Simulate upload progress for UI feedback
    if (file && field === 'video_file') {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  setErrors({});

  // Validate required fields
  if (!form.title.trim()) {
    setErrorMessage('Title is required');
    return;
  }
  
  if (!form.category.trim()) {
    setErrorMessage('Category is required');
    return;
  }
  
  if (!form.video_file) {
    setErrorMessage('Please select a video file');
    return;
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('title', form.title);
  formData.append('description', form.description);
  formData.append('category', form.category);
  
  // Laravel expects '1' for true, '0' for false, or empty string for nullable
  formData.append('is_active', form.is_active ? '1' : '0');
  
  formData.append('video', form.video_file);
  
  if (form.thumbnail_file) {
    formData.append('thumbnail', form.thumbnail_file);
  }

  // Debug: Log what's being sent
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value, typeof value);
  }

  uploadMutation.mutate(formData);
};
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Help Video"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <AlertMessage type="error" message={errorMessage} />
          )}

          {/* File Upload Section */}
          <div className="space-y-4">
            {/* Video Upload */}
            <div className="p-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
              {!form.video_file ? (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Video className="w-10 h-10 mb-2 text-gray-400" />
                  <span className="mb-1 text-xs font-medium text-gray-700">
                    Click to upload video
                  </span>
                  <span className="text-xs text-gray-500">
                    MP4, AVI, MOV, WMV, FLV, MKV (Max 500MB)
                  </span>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'video_file')}
                    className="hidden"
                    accept=".mp4,.avi,.mov,.wmv,.flv,.mkv"
                    required
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {form.video_file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(form.video_file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, video_file: null }));
                        setUploadProgress(0);
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {uploadProgress < 100 ? 'Processing...' : 'Ready to upload'}
                      </span>
                      <span className="font-medium text-gray-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                      <div
                        className="h-full transition-all duration-300 bg-blue-600 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {errors && errors.video?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">{errors.video[0]}</p>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="p-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
              {!form.thumbnail_file ? (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="mb-1 text-xs font-medium text-gray-700">
                    Click to upload thumbnail (Optional)
                  </span>
                  <span className="text-xs text-gray-500">
                    JPEG, PNG, JPG, GIF, WebP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'thumbnail_file')}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                  />
                </label>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {form.thumbnail_file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(form.thumbnail_file.size)}
                    </p>
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(form.thumbnail_file)}
                        alt="Thumbnail preview"
                        className="object-cover w-20 h-12 rounded"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, thumbnail_file: null }))}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {errors && errors.thumbnail?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">{errors.thumbnail[0]}</p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
              Video Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-1.5 text-xs transition border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter video title"
                />
                {errors && errors.title?.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-1.5 text-xs transition border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {SYSTEM_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors && errors.category?.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{errors.category[0]}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-1.5 text-xs transition border rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe what this video is about"
                />
                {errors && errors.description?.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-gray-700">
                      Publish Immediately
                    </span>
                    <p className="text-xs text-gray-500">
                      Make this video visible to users right away
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={uploadMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending || !form.video_file}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <>
                <LoaderCircle className="w-3 h-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload Video
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}