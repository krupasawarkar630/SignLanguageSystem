import React, { SelectHTMLAttributes, forwardRef } from"react";
import { cn } from"@/lib/utils";
import { ChevronDown } from"lucide-react";

export interface Option {
 value: string;
 label: string;
 disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
 label?: string;
 options: Option[];
 error?: string;
 helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, label, options, error, helperText, id, disabled, ...props }, ref) => {
 const selectId = id || (label ? label.toLowerCase().replace(/\s+/g,"-") : undefined);

 return (
 <div className="w-full space-y-1.5">
 {label && (
 <label
 htmlFor={selectId}
 className="block text-sm font-semibold text-ink"
 >
 {label}
 </label>
 )}
 <div className="relative">
 <select
 id={selectId}
 ref={ref}
 disabled={disabled}
 className={cn(
"w-full appearance-none bg-white border border-gestura-border rounded-xl px-3.5 py-2.5 pr-10 text-sm font-medium text-ink shadow-soft-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gestura-bg-secondary disabled:cursor-not-allowed cursor-pointer",
 error &&"border-danger focus:ring-danger/20",
 className
 )}
 {...props}
 >
 {options.map((opt) => (
 <option key={opt.value} value={opt.value} disabled={opt.disabled}>
 {opt.label}
 </option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
 <ChevronDown className="w-4 h-4"/>
 </div>
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

Select.displayName ="Select";
