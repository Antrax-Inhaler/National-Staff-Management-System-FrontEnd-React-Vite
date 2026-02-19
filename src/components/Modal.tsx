import React, { type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 48px - 1px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
