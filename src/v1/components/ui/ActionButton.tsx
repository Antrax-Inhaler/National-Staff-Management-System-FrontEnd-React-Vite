import React from "react";
import { Link } from "react-router-dom";

type BaseProps = {
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconSize?: number;
  iconClassName?: string;
  buttonClassName?: string;
  textClassName?: string;
  loading?: boolean;
  disabled?: boolean;
};

type ButtonProps = BaseProps & {
  as?: "button" | "submit";
  onClick?: () => void;
};

type LinkProps = BaseProps & {
  as: "link";
  to: string;
};

type ActionButtonProps = ButtonProps | LinkProps;

export const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const {
    label,
    icon: Icon,
    iconSize = 14,
    iconClassName = "",
    buttonClassName = "",
    textClassName = "",
    loading = false,
    disabled = false,
  } = props;

  const commonClassName = `
    inline-flex items-center gap-2 px-3 py-2 text-xs font-medium
    border rounded-lg transition-all
    bg-white border-gray-300 text-gray-700
    hover:bg-gray-50
    focus:outline-none focus:ring-none
    ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${buttonClassName}
  `;

  const content = (
    <>
      {Icon && (
        <Icon
          size={iconSize}
          className={`${loading ? "animate-spin" : ""} ${iconClassName}`}
        />
      )}
      {label && <span className={textClassName}>{label}</span>}
    </>
  );

  if (props.as === "link") {
    return (
      <Link to={props.to} className={commonClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={props.as}
      onClick={props.onClick}
      disabled={disabled || loading}
      className={commonClassName}
    >
      {content}
    </button>
  );
};
