// src/components/UpdateModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, Trash2, FileText, X,
  Bold, Italic, List, ListOrdered, Heading, Link as LinkIcon,
  Quote, Maximize2, Minimize2, ImageIcon 
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  nationalInformation, 
  type NationalInformation, 
  type UpdateNationalInfoData, 
  type Attachment 
} from '../api/nationalInformation';
import AlertMessage from '../components/ui/AlertMessage';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

// Import missing icons
import { Users } from 'lucide-react';
import { Megaphone, Globe, BookOpen, Calendar } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NationalInformation | null;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

// Rich Text Editor Component (simplified)
const RichTextEditor = React.memo(({ 
  content, 
  onChange,
  placeholder = "Start writing your content here...",
  isExpanded = false,
  disabled = false,
}: { 
  content: string; 
  onChange: (content: string) => void;
  placeholder?: string;
  isExpanded?: boolean;
  disabled?: boolean;
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
      if (!disabled) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3 ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`,
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      handleDOMEvents: {
        focus: () => {
          if (!disabled) {
            setTimeout(() => {
              if (editor && !editor.isFocused) {
                editor.commands.focus('end');
              }
            }, 10);
          }
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
      if (!disabled) {
        setTimeout(() => {
          if (editor && !editor.isFocused && content === '') {
            editor.commands.focus('end');
          }
        }, 100);
      }
    },
    editable: !disabled,
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.chain().setContent(content).run();
    }
  }, [content, editor]);

  const addLink = useCallback(() => {
    if (!editor || disabled) return;
    
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
  }, [editor, disabled]);

  const addImage = useCallback(() => {
    if (!editor || disabled) return;
    
    const url = window.prompt('Enter image URL', 'https://');
    
    if (url && url !== 'https://') {
      editor.chain().focus().setImage({ 
        src: url,
      }).run();
      
      setTimeout(() => editor.commands.focus('end'), 50);
    }
  }, [editor, disabled]);

  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    if (!editor || disabled) return;
    editor.chain().focus().toggleHeading({ level }).run();
    
    setTimeout(() => editor.commands.focus('end'), 10);
  }, [editor, disabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor || disabled) return;
      
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
  }, [editor, disabled]);

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
      {!disabled && (
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
      )}
      
      {/* Editor Content */}
      <div 
        className={`bg-white overflow-y-auto transition-all duration-300 ${
          isExpanded 
            ? 'min-h-[500px] max-h-[600px]'
            : 'min-h-[200px] max-h-[300px]'
        } ${disabled ? 'bg-gray-50' : ''}`}
      >
        <EditorContent 
          editor={editor}
          onFocus={() => {
            if (editor && !editor.isFocused && !disabled) {
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

export default function UpdateModal({ 
  isOpen, 
  onClose, 
  data, 
  onSuccess,
  onError
}: UpdateModalProps) {
  const [form, setForm] = useState<Partial<UpdateNationalInfoData>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset form when modal opens or data changes - SIMPLIFIED like EditMember
  useEffect(() => {
    if (isOpen && data) {
      console.log('Setting form data from:', data);
      setForm({
        type: data.type,
        title: data.title,
        content: data.content,
        category: data.category,
        author: data.author,
        status: data.status,
        published_at: data.published_at || undefined,
      });
      setExistingAttachments(data.attachments || []);
      setAttachments([]);
      setAttachmentsToDelete([]);
      setErrors({});
      setGeneralError('');
      setIsEditorExpanded(false);
    }
  }, [isOpen, data]);

  // MUTATION - Simplified like EditMember
  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { id: number; data: UpdateNationalInfoData }) => {
      return nationalInformation.update(payload.id, payload.data);
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['national-information'] });
      queryClient.invalidateQueries({ queryKey: ['national-information-stats'] });
      queryClient.invalidateQueries({ queryKey: ['national-information-options'] });
      
      // Clear state
      setErrors({});
      setGeneralError('');
      setAttachments([]);
      setAttachmentsToDelete([]);
      
      // Show toast and close
      toast.success('Information updated successfully');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: async (err: any) => {
      console.error('Update national information error:', err);

      if (err?.errors) {
        setErrors(err.errors);
        const errorMessages = Object.values(err.errors).flat() as string[];
        if (errorMessages.length > 0) {
          setGeneralError(`${errorMessages.join(', ')}`);
        }
      } else if (err?.message) {
        setGeneralError(err.message);
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
      
      if (onError) onError(err);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: [] }));
    setGeneralError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        const validTypes = [
          'image/*', 'video/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx'
        ];
        const isValidType = validTypes.some(type => {
          if (type.includes('*')) {
            return file.type.startsWith(type.replace('/*', '/'));
          }
          return file.name.toLowerCase().endsWith(type.replace('.', ''));
        });
        
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        
        if (!isValidType) {
          toast.error(`Invalid file type: ${file.name}`);
          return false;
        }
        if (!isValidSize) {
          toast.error(`File too large (max 10MB): ${file.name}`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToDelete(prev => [...prev, attachmentId]);
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const toggleEditorExpansion = () => {
    setIsEditorExpanded(!isEditorExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (!data) {
      setGeneralError('No data to update');
      return;
    }

    try {
      const payload: UpdateNationalInfoData = {
        type: form.type || '',
        title: form.title || '',
        content: form.content || '',
        category: form.category || '',
        author: form.author || '',
        status: form.status || '',
        published_at: form.published_at,
      };
      
      // Add new attachments
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      // Add attachments to delete
      if (attachmentsToDelete.length > 0) {
        payload.delete_attachments = attachmentsToDelete;
      }
      
      console.log('Update payload:', { id: data.id, data: payload });
      
      // Call mutate like EditMember
      mutate({ id: data.id, data: payload });
    } catch (error) {
      console.error('Submit error:', error);
      setGeneralError('An unexpected error occurred');
    }
  };

  const resetForm = () => {
    if (data) {
      setForm({
        type: data.type,
        title: data.title,
        content: data.content,
        category: data.category,
        author: data.author,
        status: data.status,
        published_at: data.published_at || undefined,
      });
      setExistingAttachments(data.attachments || []);
    }
    setAttachments([]);
    setAttachmentsToDelete([]);
    setErrors({});
    setGeneralError('');
    setIsEditorExpanded(false);
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      if (attachment.file_url) {
        window.open(attachment.file_url, '_blank');
      } else {
        toast.error('File URL not available');
      }
    } catch (error) {
      console.error('Failed to download attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      size="full"
      title={`Edit: ${data.title}`}
      className="h-[90vh]"
      disableClose={isPending}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              data.status === 'published' ? 'bg-green-100 text-green-800' :
              data.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.status}
            </span>
            {data.view_count !== undefined && (
              <Badge variant="gray" size="sm">
                <Users className="w-3 h-3 mr-1" />
                {data.view_count} views
              </Badge>
            )}
          </div>
        </div>

        {/* Error Messages - Like EditMember */}
        {generalError && (
          <AlertMessage type="error" message={generalError} />
        )}

        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Type Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                name="type"
                value={form.type || ''}
                onChange={handleChange}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isPending}
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
                name="category"
                value={form.category || ''}
                onChange={handleChange}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isPending}
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
                name="title"
                value={form.title || ''}
                onChange={handleChange}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter title"
                disabled={isPending}
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
                name="author"
                value={form.author || ''}
                onChange={handleChange}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.author ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter author name"
                disabled={isPending}
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
                name="status"
                value={form.status || ''}
                onChange={handleChange}
                className={`block w-full mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isPending}
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
            {(form.status === 'published' || data.status === 'published') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  name="published_at"
                  value={form.published_at?.substring(0, 16) || ''}
                  onChange={handleChange}
                  className="block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isPending}
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
                disabled={isPending}
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
              content={form.content || ''}
              onChange={(content) => {
                setForm(prev => ({ ...prev, content }));
                setErrors(prev => ({ ...prev, content: [] }));
              }}
              placeholder="Start writing your content here..."
              isExpanded={isEditorExpanded}
              disabled={isPending}
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
            
            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="mt-4 mb-6">
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Existing Attachments
                  {attachmentsToDelete.length > 0 && (
                    <span className="ml-2 text-xs text-red-600">
                      ({attachmentsToDelete.length} marked for deletion)
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Download"
                          disabled={isPending}
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(attachment.id)}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isPending}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Attachments */}
            <div className="mt-1">
              <label className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer ${
                isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
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
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  disabled={isPending}
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
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={isPending}
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
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}