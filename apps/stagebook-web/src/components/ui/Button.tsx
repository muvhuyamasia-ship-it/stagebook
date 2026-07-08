import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "outline";

const variantClass: Record<Variant, string> = {
  primary: "sb-btn sb-btn--primary",
  secondary: "sb-btn sb-btn--secondary",
  ghost: "sb-btn sb-btn--ghost",
  outline: "sb-btn sb-btn--outline"
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
  };

type LinkButtonProps = CommonProps &
  LinkProps & {
    as: "link";
  };

export function Button(props: ButtonProps | LinkButtonProps) {
  const { variant = "primary", children, className = "" } = props;
  const classes = `${variantClass[variant]} ${className}`.trim();

  if (props.as === "link") {
    const { as: _as, variant: _variant, children: _children, className: _className, ...linkProps } = props;
    return (
      <Link className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, children: _children, className: _className, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}