// src/utils/fileUtils.ts
import { format, parseISO, isValid } from 'date-fns';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string | Date | null | undefined, formatStr = 'MMM dd, yyyy'): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  return formatDate(dateString, 'MMM dd, yyyy hh:mm a');
};

export const formatRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDate(dateString);
  }
};

export const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const types: Record<string, string> = {
    // Images
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    webp: 'Image',
    bmp: 'Image',
    svg: 'Vector Image',
    ico: 'Icon',
    tiff: 'Image',
    
    // Videos
    mp4: 'Video',
    mov: 'Video',
    avi: 'Video',
    wmv: 'Video',
    mkv: 'Video',
    webm: 'Video',
    flv: 'Video',
    m4v: 'Video',
    mpv: 'Video',
    mpg: 'Video',
    mpeg: 'Video',
    
    // Audio
    mp3: 'Audio',
    wav: 'Audio',
    ogg: 'Audio',
    m4a: 'Audio',
    flac: 'Audio',
    aac: 'Audio',
    
    // Documents
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    txt: 'Text File',
    csv: 'CSV File',
    rtf: 'Rich Text',
    md: 'Markdown',
    json: 'JSON',
    xml: 'XML',
    html: 'HTML',
    htm: 'HTML',
    
    // Archives
    zip: 'ZIP Archive',
    rar: 'RAR Archive',
    '7z': '7-Zip Archive',
    tar: 'TAR Archive',
    gz: 'GZIP Archive',
    bz2: 'BZIP2 Archive',
    
    // Code
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    php: 'PHP',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin',
    
    // Database
    sql: 'SQL',
    db: 'Database',
    sqlite: 'SQLite',
    mdb: 'Access DB',
    
    // Executables
    exe: 'Executable',
    dmg: 'Disk Image',
    pkg: 'Package',
    apk: 'Android App',
    ipa: 'iOS App',
    msi: 'Installer',
  };
  
  return types[ext] || 'Unknown File';
};

export const getFileIcon = (filename: string): React.ReactNode => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const icons: Record<string, React.ReactNode> = {
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    bmp: '🖼️',
    svg: '🎨',
    ico: '🎯',
    tiff: '🖼️',
    
    // Videos
    mp4: '🎬',
    mov: '🎬',
    avi: '🎬',
    wmv: '🎬',
    mkv: '🎬',
    webm: '🎬',
    flv: '🎬',
    m4v: '🎬',
    
    // Audio
    mp3: '🎵',
    wav: '🎵',
    ogg: '🎵',
    m4a: '🎵',
    flac: '🎵',
    aac: '🎵',
    
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📋',
    pptx: '📋',
    txt: '📄',
    csv: '📈',
    rtf: '📄',
    md: '📝',
    
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    
    // Code
    js: '📜',
    ts: '📜',
    jsx: '⚛️',
    tsx: '⚛️',
    py: '🐍',
    java: '☕',
    php: '🐘',
    
    // Executables
    exe: '⚙️',
    dmg: '💿',
    pkg: '📦',
    
    // Default
    default: '📎',
  };
  
  return icons[ext] || icons.default;
};

export const getFileIconComponent = (filename: string): { color: string; icon: string } => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const iconMap: Record<string, { color: string; icon: string }> = {
    // Images
    jpg: { color: 'text-blue-500', icon: '🖼️' },
    jpeg: { color: 'text-blue-500', icon: '🖼️' },
    png: { color: 'text-blue-500', icon: '🖼️' },
    gif: { color: 'text-purple-500', icon: '🖼️' },
    webp: { color: 'text-blue-500', icon: '🖼️' },
    
    // Videos
    mp4: { color: 'text-purple-500', icon: '🎬' },
    mov: { color: 'text-purple-500', icon: '🎬' },
    avi: { color: 'text-purple-500', icon: '🎬' },
    wmv: { color: 'text-purple-500', icon: '🎬' },
    mkv: { color: 'text-purple-500', icon: '🎬' },
    
    // Documents
    pdf: { color: 'text-red-500', icon: '📄' },
    doc: { color: 'text-blue-600', icon: '📝' },
    docx: { color: 'text-blue-600', icon: '📝' },
    xls: { color: 'text-green-600', icon: '📊' },
    xlsx: { color: 'text-green-600', icon: '📊' },
    ppt: { color: 'text-orange-600', icon: '📋' },
    pptx: { color: 'text-orange-600', icon: '📋' },
    txt: { color: 'text-gray-600', icon: '📄' },
    csv: { color: 'text-green-500', icon: '📈' },
    
    // Default
    default: { color: 'text-gray-500', icon: '📎' },
  };
  
  return iconMap[ext] || iconMap.default;
};

export const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].includes(ext);
};

export const isVideoFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm', 'flv', 'm4v', 'mpg', 'mpeg'].includes(ext);
};

export const isAudioFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
};

export const isDocumentFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'md'].includes(ext);
};

export const isPdfFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf';
};

export const isArchiveFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
};

export const getFileCategory = (filename: string): string => {
  if (isImageFile(filename)) return 'image';
  if (isVideoFile(filename)) return 'video';
  if (isAudioFile(filename)) return 'audio';
  if (isDocumentFile(filename)) return 'document';
  if (isArchiveFile(filename)) return 'archive';
  return 'other';
};

export const getFilePreviewUrl = (file: File | string): string => {
  if (typeof file === 'string') return file;
  return URL.createObjectURL(file);
};

export const revokeFilePreviewUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const truncateFilename = (filename: string, maxLength = 50): string => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.slice(0, filename.length - extension.length - 1);
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...';
  return `${truncatedName}.${extension}`;
};