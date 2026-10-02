import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "neutral" | "danger" | "ghost" | "lime";
  size?: "sm" | "md" | "lg" | "xl";
  isFullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isFullWidth = false,
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-4 py-1.5 text-xs font-semibold gap-1.5",
      md: "px-5 py-2.5 text-sm font-semibold gap-2",
      lg: "px-7 py-3 text-base font-bold gap-2.5",
      xl: "px-8 py-3.5 text-base font-bold gap-3",
    };

    const variantClasses = {
      primary:
        "bg-primary text-white rounded-full shadow-sm hover:shadow-md hover:bg-primary-hover hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out",
      secondary:
        "bg-white text-ink border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out",
      lime:
        "bg-primary-light text-primary hover:bg-[#c4e6df] rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out",
      neutral:
        "bg-gray-100 text-ink hover:bg-gray-200 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out",
      danger:
        "bg-danger text-white rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out",
      ghost:
        "bg-transparent text-ink hover:bg-gray-100 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-sans select-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          sizeClasses[size],
          variantClasses[variant],
          isFullWidth ? "w-full" : "",
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
