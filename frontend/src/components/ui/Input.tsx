import React, { InputHTMLAttributes, forwardRef } from"react";
import { cn } from"@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 helperText?: string;
 leftIcon?: React.ReactNode;
 rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
 (
 {
 className,
 label,
 error,
 helperText,
 leftIcon,
 rightIcon,
 id,
 disabled,
 ...props
 },
 ref
 ) => {
 const inputId = id || (label ? label.toLowerCase().replace(/\s+/g,"-") : undefined);

 return (
 <div className="w-full space-y-1.5">
 {label && (
 <label
 htmlFor={inputId}
 className="block text-sm font-semibold text-ink"
 >
 {label}
 </label>
 )}
 <div className="relative flex items-center">
 {leftIcon && (
 <div className="absolute left-3 flex items-center pointer-events-none text-ink-subtle">
 {leftIcon}
 </div>
 )}
 <input
 id={inputId}
 ref={ref}
 disabled={disabled}
 className={cn(
"w-full bg-white border border-gestura-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-ink-subtle shadow-soft-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gestura-bg-secondary disabled:cursor-not-allowed",
 leftIcon &&"pl-10",
 rightIcon &&"pr-10",
 error &&"border-danger focus:ring-danger/20",
 className
 )}
 {...props}
 />
 {rightIcon && (
 <div className="absolute right-3 flex items-center pointer-events-none text-ink-subtle">
 {rightIcon}
 </div>
 )}
 </div>
 {error ? (
 <p className="text-xs font-medium text-danger">{error}</p>
 ) : helperText ? (
 <p className="text-xs text-ink-muted">{helperText}</p>
 ) : null}
 </div>
 );
 }
);

Input.displayName ="Input";
