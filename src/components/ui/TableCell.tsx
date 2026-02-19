import React from "react";

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
  className?: string;
};

export default function TableCell({
  children,
  className = "",
  ...rest
}: TableCellProps) {
  return (
    <td {...rest} className={`px-4 py-2 text-sm ${className}`}>
      {children}
    </td>
  );
}
