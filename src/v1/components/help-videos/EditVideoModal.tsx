// @v1/components/help-videos/EditVideoModal.tsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import Modal from '@v1/components/ui/Modal';
import AlertMessage from '@v1/components/ui/AlertMessage';
import { helpVideos } from '@v1/api/helpVideos';
import type { HelpVideo } from '@v1/types/helpVideos';
import toast from 'react-hot-toast';

interface EditVideoModalProps {
  video: HelpVideo;
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

export default function EditVideoModal({ video, onClose, onSuccess }: EditVideoModalProps) {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    id: video.id,
    title: video.title,
    description: video.description || '',
    category: video.category,
    is_active: video.is_active,
    thumbnail_file: null as File | null,
    thumbnail_preview: video.thumbnail_url,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => helpVideos.update(payload),
    onSuccess: () => {
      toast.success('Video updated successfully');
      queryClient.invalidateQueries({ queryKey: ['help-videos'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        setErrorMessage(err.message || 'Failed to update video');
        toast.error(err.message || 'Failed to update video');
      }
    },
  });

  useEffect(() => {
    setForm({
      id: video.id,
      title: video.title,
      description: video.description || '',
      category: video.category,
      is_active: video.is_active,
      thumbnail_file: null,
      thumbnail_preview: video.thumbnail_url,
    });
  }, [video]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setForm(prev => ({ 
        ...prev, 
        thumbnail_file: file,
        thumbnail_preview: URL.createObjectURL(file)
      }));
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

    const payload = {
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      is_active: form.is_active,
      ...(form.thumbnail_file && { thumbnail_file: form.thumbnail_file })
    };

    updateMutation.mutate(payload);
  };


  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Help Video"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <AlertMessage type="error" message={errorMessage} />
          )}

          {/* Thumbnail Preview & Upload */}
          <div className="space-y-4">
            <div className="flex flex-col items-center p-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
              {form.thumbnail_preview ? (
                <>
                  <div className="relative w-full max-w-md mb-4">
                    <img
                      src={form.thumbnail_preview}
                      alt="Thumbnail preview"
                      className="object-cover w-full h-40 rounded-lg"
                    />
                    {form.thumbnail_file && (
                      <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-white bg-black bg-opacity-75 rounded">
                        New
                      </div>
                    )}
                  </div>
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-600 transition bg-blue-50 rounded-lg hover:bg-blue-100">
                      <ImageIcon size={14} />
                      Change Thumbnail
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      JPEG, PNG, JPG, GIF, WebP (Max 5MB)
                    </p>
                  </label>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <ImageIcon className="w-10 h-10 mb-2 text-gray-400" />
                  <span className="mb-1 text-xs font-medium text-gray-700">
                    Upload Thumbnail (Optional)
                  </span>
                  <span className="text-xs text-gray-500">
                    JPEG, PNG, JPG, GIF, WebP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                  />
                </label>
              )}
              {form.thumbnail_file && (
                <div className="mt-3 text-xs text-gray-600">
                  Selected: {form.thumbnail_file.name} ({formatFileSize(form.thumbnail_file.size)})
                </div>
              )}
              {errors && errors.thumbnail?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">{errors.thumbnail[0]}</p>
              )}
            </div>
          </div>

          {/* Video Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
              Video Information
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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


              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this video is about"
                />
                {errors && errors.description?.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>
                )}
              </div>

              <div>
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
                      Video Status
                    </span>
                    <p className="text-xs text-gray-500">
                      {form.is_active ? 'Video is visible to users' : 'Video is hidden from users'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Video URL (Read-only) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
              Video Details
            </h3>
            <div className="p-3 text-xs bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Video URL:</span>
                  <p className="mt-1 text-gray-800 truncate">
                    {video.video_url ? 'Uploaded ✓' : 'Not available'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Views:</span>
                  <p className="mt-1 text-gray-800">{video.view_count}</p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="mt-1 text-gray-800">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="mt-1 text-gray-800">
                    {new Date(video.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-xs font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <LoaderCircle className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}