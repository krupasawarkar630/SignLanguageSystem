import React from"react";
import { cn } from"@/lib/utils";

export interface SectionHeadingProps {
 badge?: string;
 badgeVariant?:"primary"|"secondary"|"neutral"|"dark";
 title: string | React.ReactNode;
 subtitle?: string;
 align?:"left"|"center";
 className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
 badge,
 badgeVariant ="primary",
 title,
 subtitle,
 align ="left",
 className,
}) => {
 const badgeStyles = {
 primary:"bg-primary text-white",
 secondary:"bg-primary-light text-primary",
 neutral:"bg-gestura-bg-secondary text-ink",
 dark:"bg-surface-dark text-white",
 };

 return (
 <div
 className={cn(
"space-y-4",
 align ==="center"?"text-center max-w-3xl mx-auto":"max-w-2xl",
 className
 )}
 >
 {badge && (
 <div className={cn("inline-flex items-center", align ==="center"?"justify-center":"")}>
 <span
 className={cn(
"px-3 py-1 text-xs font-semibold rounded-full",
 badgeStyles[badgeVariant]
 )}
 >
 {badge}
 </span>
 </div>
 )}

 <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink leading-[1.1]">
 {title}
 </h2>

 {subtitle && (
 <p className="text-base sm:text-lg text-ink-muted font-medium leading-relaxed max-w-xl">
 {subtitle}
 </p>
 )}
 </div>
 );
};
