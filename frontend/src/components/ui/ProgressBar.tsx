import React, { HTMLAttributes } from"react";
import { cn } from"@/lib/utils";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
 value: number; // 0 to 100
 max?: number;
 variant?:"primary"|"secondary"|"danger"|"warning"|"gradient";
 size?:"sm"|"md"|"lg";
 showLabel?: boolean;
 label?: string;
}

export const ProgressBar = ({
 value,
 max = 100,
 variant ="primary",
 size ="md",
 showLabel = false,
 label,
 className,
 ...props
}: ProgressBarProps) => {
 const percentage = Math.min(100, Math.max(0, (value / max) * 100));

 const sizeClasses = {
 sm:"h-2",
 md:"h-3",
 lg:"h-4",
 };

 const fillColors = {
 primary:"bg-primary",
 secondary:"bg-secondary",
 danger:"bg-danger",
 warning:"bg-warning",
 gradient:"bg-gradient-to-r from-primary to-accent",
 };

 return (
 <div className={cn("w-full space-y-1.5", className)} {...props}>
 {(showLabel || label) && (
 <div className="flex justify-between items-center text-xs font-semibold text-ink">
 <span>{label ||"Progress"}</span>
 <span>{Math.round(percentage)}%</span>
 </div>
 )}
 <div
 className={cn(
"w-full bg-gestura-bg-secondary rounded-full overflow-hidden",
 sizeClasses[size]
 )}
 role="progressbar"
 aria-valuenow={value}
 aria-valuemin={0}
 aria-valuemax={max}
 >
 <div
 className={cn(
"h-full rounded-full transition-all duration-300 ease-out",
 fillColors[variant]
 )}
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>
 );
};
