// components/ui/Modal.tsx (updated)
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  overlayClassName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  disableClose?: boolean;
  hideHeader?: boolean;
  showCloseButton?: boolean; // Add this prop
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-7xl",
  full: "max-w-full h-[90vh]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = "",
  className = "",
  size = "md",
  disableClose = false,
  hideHeader = false,
  showCloseButton = true, // Default to true
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableClose) return;
    const target = e.target as HTMLElement;
    if (target.closest(".stdropdown-container")) return;
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 ${overlayClassName}`}
      onMouseDown={handleOverlayClick}
    >
      <div
        className={`
          relative flex w-full flex-col
          rounded-lg bg-white shadow-lg
          max-h-[90vh]
          ${className || sizeClasses[size]}
        `}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-3 px-4 py-4 border-b sm:px-6">
            {title && (
              <h2 className="flex-1 min-w-0 text-base font-semibold leading-tight break-words sm:text-lg md:text-xl">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                disabled={disableClose}
                onClick={onClose}
                className="p-1 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 px-4 py-4 overflow-y-auto sm:px-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}