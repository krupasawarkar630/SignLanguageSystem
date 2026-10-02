import React, { HTMLAttributes } from"react";
import { cn } from"@/lib/utils";
import { X } from"lucide-react";

export interface TagProps extends HTMLAttributes<HTMLDivElement> {
 label: string;
 variant?:"default"|"primary"|"secondary"|"accent";
 onRemove?: () => void;
 icon?: React.ReactNode;
}

export const Tag = ({
 label,
 variant ="default",
 onRemove,
 icon,
 className,
 ...props
}: TagProps) => {
 const variantClasses = {
 default:"bg-gestura-bg-secondary text-ink hover:bg-gestura-border/50",
 primary:"bg-primary-light text-primary hover:bg-primary-light/80",
 secondary:"bg-secondary-light text-secondary-dark hover:bg-secondary-light/80",
 accent:"bg-accent-light text-accent hover:bg-accent-light/80",
 };

 return (
 <div
 className={cn(
"inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full select-none transition-colors",
 variantClasses[variant],
 className
 )}
 {...props}
 >
 {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
 <span>{label}</span>
 {onRemove && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onRemove();
 }}
 className="ml-0.5 hover:bg-ink/10 p-0.5 rounded-full transition-colors"
 aria-label={`Remove ${label}`}
 >
 <X className="w-3 h-3"/>
 </button>
 )}
 </div>
 );
};
