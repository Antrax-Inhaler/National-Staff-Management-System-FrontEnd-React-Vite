// components/ui/Modal.tsx
import { X } from "lucide-react";
import type { ReactNode } from "react";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  overlayClassName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full"; // 👈 new
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
  size = "md", // default
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${overlayClassName}`}
      onClick={onClose}
    >
      <div
        className={`
          relative flex w-full flex-col
          rounded-lg bg-white shadow-lg
          max-h-[90vh]
          ${sizeClasses[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X />
          </button>
        </div>
        <div className="overflow-y-auto  flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
