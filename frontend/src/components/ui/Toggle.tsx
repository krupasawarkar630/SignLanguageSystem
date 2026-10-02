import React from"react";
import { cn } from"@/lib/utils";

export interface ToggleProps {
 checked: boolean;
 onChange: (checked: boolean) => void;
 label?: string;
 description?: string;
 disabled?: boolean;
 size?:"sm"|"md"|"lg";
 variant?:"primary"|"secondary";
 className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
 checked,
 onChange,
 label,
 description,
 disabled = false,
 size ="md",
 variant ="primary",
 className,
}) => {
 const sizeConfig = {
 sm: {
 track:"w-9 h-5",
 thumb:"w-3.5 h-3.5",
 translate:"translate-x-4",
 },
 md: {
 track:"w-11 h-6",
 thumb:"w-4 h-4",
 translate:"translate-x-5",
 },
 lg: {
 track:"w-14 h-7",
 thumb:"w-5 h-5",
 translate:"translate-x-7",
 },
 };

 const activeColor = variant ==="primary"?"bg-primary":"bg-secondary";

 return (
 <label
 className={cn(
"inline-flex items-center gap-3 select-none cursor-pointer group",
 disabled &&"opacity-50 cursor-not-allowed",
 className
 )}
 >
 <div className="relative">
 <input
 type="checkbox"
 className="sr-only"
 checked={checked}
 disabled={disabled}
 onChange={(e) => !disabled && onChange(e.target.checked)}
 />
 <div
 className={cn(
"rounded-full transition-colors duration-200 flex items-center p-0.5",
 sizeConfig[size].track,
 checked ? activeColor :"bg-gestura-border"
 )}
 >
 <div
 className={cn(
"rounded-full bg-white transition-transform duration-200 ease-out transform shadow-soft-sm",
 sizeConfig[size].thumb,
 checked ? sizeConfig[size].translate :"translate-x-0"
 )}
 />
 </div>
 </div>
 {(label || description) && (
 <div className="flex flex-col">
 {label && (
 <span className="font-semibold text-sm text-ink group-hover:text-primary transition-colors">
 {label}
 </span>
 )}
 {description && (
 <span className="text-xs text-ink-muted">{description}</span>
 )}
 </div>
 )}
 </label>
 );
};
