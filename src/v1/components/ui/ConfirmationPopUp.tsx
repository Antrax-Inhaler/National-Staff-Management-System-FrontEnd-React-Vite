import { useState } from "react";
import Modal from "./Modal";
import { AlertTriangle, Loader2 } from "lucide-react";

interface PopConfirmProps {
  message?: string;
  title?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  open?: boolean; // Controlled mode
  onOpenChange?: (open: boolean) => void; // Callback for controlled mode
  isLoading?: boolean; // External loading state
}

export default function ConfirmationPopUp({
  message = "Are you sure?",
  title = "Confirmation",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
  size = "md",
  open: controlledOpen,
  onOpenChange,
  isLoading: externalLoading,
}: PopConfirmProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  // Determine if component is controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const isLoading = externalLoading ?? internalLoading;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onCancel?.();
      setOpen(false);
    }
  };

  return (
    <>
      {children && <div onClick={() => setOpen(true)}>{children}</div>}

      <Modal
        isOpen={open}
        onClose={() => !isLoading && setOpen(false)}
        title={title}
        size={size}
        hideHeader
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-800">
              Confirmation Required
            </h3>
            <p className="text-sm text-gray-600 break-words whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-hidden text-ellipsis">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}