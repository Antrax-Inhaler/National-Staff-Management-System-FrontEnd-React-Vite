import React from "react"; 

type BadgeVariant = "success" | "warning" | "primary" | "danger" | "gray" | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;       // ✅ added size
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-orange-100 text-orange-800",
  primary: "bg-blue-100 text-blue-800",
  danger: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-800",
  info: "bg-cyan-100 text-cyan-800",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

export default function Badge({
  children,
  variant = "gray",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
    >
      {children}
    </span>
  );
}
