// src/components/dashboard/EmptyDataMessage.tsx
import { AlertCircle } from "lucide-react";

interface EmptyDataMessageProps {
  type?: "chart" | "list" | "metric";
  title?: string;
  message?: string;
}

export function EmptyDataMessage({
  type = "chart",
  title = "Data Not Available",
  message = "Waiting for data to be collected. Please check back later.",
}: EmptyDataMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle size={40} className="mb-3 text-gray-300" />
      <h3 className="mb-2 text-sm font-medium text-gray-700">{title}</h3>
      <p className="max-w-xs text-xs text-gray-500">{message}</p>
    </div>
  );
}