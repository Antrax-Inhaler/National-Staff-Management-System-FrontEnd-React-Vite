import React from "react";

type TableHeaderProps = {
  children: React.ReactNode;
  className?: string; // extra classes from the caller
};

export default function TableHeader({
  children,
  className = "",
}: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-2 text-left text-sm font-semibold ${className}`}
    >
      {children}
    </th>
  );
}
