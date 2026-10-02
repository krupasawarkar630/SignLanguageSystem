import React, { HTMLAttributes } from"react";
import { cn } from"@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
 variant?:"primary"|"secondary"|"success"|"warning"|"danger"|"neutral"|"dark";
 size?:"sm"|"md"|"lg";
 dot?: boolean;
}

export const Badge = ({
 children,
 className,
 variant ="neutral",
 size ="md",
 dot = false,
 ...props
}: BadgeProps) => {
 const sizeClasses = {
 sm:"px-2 py-0.5 text-[11px] font-semibold",
 md:"px-2.5 py-1 text-xs font-semibold",
 lg:"px-3 py-1.5 text-sm font-bold",
 };

 const variantClasses = {
 primary:"bg-primary text-white",
 secondary:"bg-primary-light text-primary",
 success:"bg-success-light text-success",
 warning:"bg-warning-light text-warning-hover",
 danger:"bg-danger-light text-danger",
 neutral:"bg-gestura-bg-secondary text-ink",
 dark:"bg-surface-dark text-white",
 };

 const dotColors = {
 primary:"bg-white",
 secondary:"bg-primary",
 success:"bg-white",
 warning:"bg-warning-hover",
 danger:"bg-white",
 neutral:"bg-ink",
 dark:"bg-primary",
 };

 return (
 <span
 className={cn(
"inline-flex items-center gap-1.5 rounded-full tracking-normal",
 sizeClasses[size],
 variantClasses[variant],
 className
 )}
 {...props}
 >
 {dot && (
 <span
 className={cn(
"w-2 h-2 rounded-full animate-pulse",
 dotColors[variant]
 )}
 />
 )}
 {children}
 </span>
 );
};
