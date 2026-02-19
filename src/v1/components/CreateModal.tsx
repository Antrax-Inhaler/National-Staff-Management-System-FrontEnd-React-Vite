// src/components/CreateModal.tsx - CREATE-ONLY VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, Trash2, FileText, Image as ImageIcon, Film,
  Bold, Italic, List, ListOrdered, Heading, Link as LinkIcon,
  Quote, Maximize2, Minimize2, AlertCircle
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { nationalInformation, type CreateNationalInfoData } from '../api/nationalInformation';
import AlertMessage from '../components/ui/AlertMessage';
import Modal from '../components/ui/Modal';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (error: any) => void;
}

// Rich Text Editor Component (keep as is)
const RichTextEditor = React.memo(({ 
  content, 
  onChange,
  placeholder = "Start writing your content here...",
  isExpanded = false,
}: { 
  content: string; 
  onChange: (content: string) => void;
  placeholder?: string;
  isExpanded?: boolean;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 italic',
          },
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      CharacterCount.configure({
        limit: null,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      handleDOMEvents: {
        focus: () => {
          setTimeout(() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }, 10);
          return true;
        },
        blur: () => {
          return true;
        },
      },
      transformPastedHTML(html) {
        return html.replace(/<br\s*\/?>/gi, '\n');
      },
    },
    onCreate: ({ editor }) => {
      setTimeout(() => {
        if (editor && !editor.isFocused && content === '') {
          editor.commands.focus('end');
        }
      }, 100);
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.chain().setContent(content).run();
    }
  }, [content, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || (text ? 'https://example.com' : 'https://'));

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ 
      href: url,
    }).run();
    
    setTimeout(() => editor.commands.focus('end'), 50);
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL', 'https://');
    
    if (url && url !== 'https://') {
      editor.chain().focus().setImage({ 
        src: url,
      }).run();
      
      setTimeout(() => editor.commands.focus('end'), 50);
    }
  }, [editor]);

  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
    
    setTimeout(() => editor.commands.focus('end'), 10);
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;
      
      if (event.key === 'Enter' && !event.shiftKey) {
        if (editor.isActive('listItem')) {
          setTimeout(() => editor.commands.focus('end'), 10);
        }
      }
    };

    if (editor?.view?.dom) {
      editor.view.dom.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (editor?.view?.dom) {
        editor.view.dom.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md min-h-[200px] p-3 animate-pulse">
        Loading editor...
      </div>
    );
  }

  // Calculate word count
  const getWordCount = () => {
    const text = editor.getText();
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBold().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Underline (Ctrl+U)"
        >
          <span className="text-xs font-bold">U</span>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <div className="flex gap-0.5">
          {([1, 2, 3] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => toggleHeading(level)}
              className={`p-1.5 rounded ${editor.isActive('heading', { level }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
              title={`Heading ${level}`}
            >
              <Heading size={14} />
              <span className="text-xs ml-0.5">{level}</span>
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive('blockquote') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Quote"
        >
          <Quote size={14} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={addLink}
          className={`p-1.5 rounded ${editor.isActive('link') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon size={14} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded hover:bg-gray-200"
          title="Insert Image"
        >
          <ImageIcon size={14} />
        </button>
        
        {/* Text Align Buttons */}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('left').run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Align Left"
        >
          <span className="text-xs font-bold">L</span>
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('center').run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Align Center"
        >
          <span className="text-xs font-bold">C</span>
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign('right').run();
            setTimeout(() => editor.commands.focus('end'), 10);
          }}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          title="Align Right"
        >
          <span className="text-xs font-bold">R</span>
        </button>
      </div>
      
      {/* Editor Content */}
      <div 
        className={`bg-white overflow-y-auto transition-all duration-300 ${
          isExpanded 
            ? 'min-h-[500px] max-h-[600px]'  // Reduced height
            : 'min-h-[200px] max-h-[300px]'
        }`}
      >
        <EditorContent 
          editor={editor}
          onFocus={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
        />
      </div>
      
      {/* Word Count */}
      <div className="flex justify-between items-center px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
        <div>
          Word count: {getWordCount()} words
        </div>
        <div>
          Characters: {editor.storage.characterCount?.characters() || editor.getText().length}
        </div>
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default function CreateModal({ isOpen, onClose, onSuccess, onError }: CreateModalProps) {
  const [formData, setFormData] = useState<Partial<CreateNationalInfoData>>({
    type: 'announcement',
    title: '',
    content: '',
    category: 'general',
    author: '',
    status: 'draft',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>('');

  const queryClient = useQueryClient();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: 'announcement',
        title: '',
        content: '',
        category: 'general',
        author: '',
        status: 'draft',
      });
      setAttachments([]);
      setErrors({});
      setSubmissionError('');
      setIsEditorExpanded(false);
    }
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: nationalInformation.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['national-information'] });
      queryClient.invalidateQueries({ queryKey: ['national-information-stats'] });
      queryClient.invalidateQueries({ queryKey: ['national-information-options'] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      console.error('Create error:', err);
      if (err.errors) {
        setErrors(err.errors);
      }
      setSubmissionError(err.message || 'Failed to create information');
      if (onError) onError(err);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = ['Title is required'];
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = ['Content is required'];
    }
    
    if (!formData.author?.trim()) {
      newErrors.author = ['Author is required'];
    }
    
    if (!formData.category?.trim()) {
      newErrors.category = ['Category is required'];
    }
    
    if (!formData.type?.trim()) {
      newErrors.type = ['Type is required'];
    }
    
    if (!formData.status?.trim()) {
      newErrors.status = ['Status is required'];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setSubmissionError('');
    
    try {
      // Create new
      const createData: CreateNationalInfoData = {
        type: formData.type!,
        title: formData.title!,
        content: formData.content!,
        category: formData.category!,
        author: formData.author!,
        status: formData.status!,
        published_at: formData.published_at,
      };
      
      if (attachments.length > 0) {
        createData.attachments = attachments;
      }
      
      console.log('Create payload:', createData);
      
      await createMutation.mutateAsync(createData);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError('An unexpected error occurred');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEditorExpansion = () => {
    setIsEditorExpanded(!isEditorExpanded);
  };

  const handleInputChange = (field: keyof CreateNationalInfoData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="Add New Information"
      className="h-[90vh]"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Error Messages */}
        {(submissionError || Object.keys(errors).length > 0) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            {submissionError && (
              <div className="flex items-center gap-2 mb-2 text-red-700">
                <AlertCircle size={18} />
                <span className="font-medium">{submissionError}</span>
              </div>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="text-sm text-red-600">
                <p className="font-medium mb-1">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, fieldErrors]) => (
                    <li key={field}>{fieldErrors[0]}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Type Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="resource">Resource</option>
                <option value="event">Event</option>
                <option value="policy">Policy</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type[0]}</p>
              )}
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="general">General</option>
                <option value="membership">Membership</option>
                <option value="events">Events</option>
                <option value="resources">Resources</option>
                <option value="policies">Policies</option>
                <option value="updates">Updates</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category[0]}</p>
              )}
            </div>

            {/* Title Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter title"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>
              )}
            </div>

            {/* Author Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Author *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.author ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter author name"
                disabled={isSubmitting}
              />
              {errors.author && (
                <p className="mt-1 text-sm text-red-600">{errors.author[0]}</p>
              )}
            </div>

            {/* Status Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>
              )}
            </div>

            {/* Published Date Field */}
            {formData.status === 'published' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.published_at?.substring(0, 16) || ''}
                  onChange={(e) => handleInputChange('published_at', e.target.value)}
                  className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use current date and time
                </p>
                {errors.published_at && (
                  <p className="mt-1 text-sm text-red-600">{errors.published_at[0]}</p>
                )}
              </div>
            )}
          </div>

          {/* Content Editor Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content *
              </label>
              <button
                type="button"
                onClick={toggleEditorExpansion}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                title={isEditorExpanded ? "Minimize editor" : "Expand editor"}
                disabled={isSubmitting}
              >
                {isEditorExpanded ? (
                  <>
                    <Minimize2 size={16} />
                    <span>Minimize</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={16} />
                    <span>Expand Editor</span>
                  </>
                )}
              </button>
            </div>

            {/* Rich Text Editor */}
            <RichTextEditor
              content={formData.content || ''}
              onChange={(content) => handleInputChange('content', content)}
              placeholder="Start writing your content here..."
              isExpanded={isEditorExpanded}
            />
            
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content[0]}</p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Attachments
            </label>
            <div className="mt-1">
              <label className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              } ${errors.attachments ? 'border-red-300' : 'border-gray-300'}`}>
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Images, Videos, PDFs, Docs, Excel (Max 10MB each)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            {/* New attachments preview */}
            {attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">New Attachments</h4>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Footer */}
        <div className="border-t p-4 bg-gray-50 mt-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>Create</>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}