import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

interface AlertProps {
  message: string;
  type?: "error" | "success" | "warning" | "info";
  className?: string;
}

const AlertMessage: React.FC<AlertProps> = ({
  message,
  type = "info",
  className = "",
}) => {
  const styles = {
    error: {
      icon: <AlertCircle className="w-4 h-4 mr-2 text-red-600" />,
      container: "text-red-700 border-red-200 bg-red-50",
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />,
      container: "text-green-700 border-green-200 bg-green-50",
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />,
      container: "text-yellow-700 border-yellow-200 bg-yellow-50",
    },
    info: {
      icon: <Info className="w-4 h-4 mr-2 text-blue-600" />,
      container: "text-blue-700 border-blue-200 bg-blue-50",
    },
  }[type];

  return (
    <div
      className={`flex items-center w-full p-3 mb-3 text-sm border rounded-lg ${styles.container} ${className}`}
    >
      {styles.icon}
      <span>{message}</span>
    </div>
  );
};

export default AlertMessage;
