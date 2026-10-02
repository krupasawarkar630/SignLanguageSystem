import React, { HTMLAttributes, forwardRef } from"react";
import { cn } from"@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
 variant?:"white"|"cream"|"primary"|"secondary"|"dark";
 shadowSize?:"sm"|"md"|"lg"|"xl"|"none";
 interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
 (
 {
 children,
 className,
 variant ="white",
 shadowSize ="md",
 interactive = false,
 ...props
 },
 ref
 ) => {
 const variantClasses = {
 white:"bg-surface text-ink",
 cream:"bg-surface-cream text-ink",
 primary:"bg-primary-light text-ink",
 secondary:"bg-secondary-light text-ink",
 dark:"bg-surface-dark text-white",
 };

 const shadowClasses = {
 none:"shadow-none",
 sm:"shadow-soft-sm",
 md:"shadow-soft",
 lg:"shadow-soft-lg",
 xl:"shadow-soft-xl",
 };

 return (
 <div
 ref={ref}
 className={cn(
"rounded-2xl p-6",
 variantClasses[variant],
 shadowClasses[shadowSize],
 interactive &&
"cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:shadow-soft-lg active:translate-y-0 active:shadow-soft",
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
 }
);

Card.displayName ="Card";

export const CardHeader = ({
 className,
 ...props
}: HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn("flex flex-col space-y-1.5 pb-4 border-b border-[#E5E5EA] mb-4", className)}
 {...props}
 />
);

export const CardTitle = ({
 className,
 ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
 <h3
 className={cn("text-xl font-bold tracking-tight text-ink", className)}
 {...props}
 />
);

export const CardDescription = ({
 className,
 ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
 <p className={cn("text-sm text-ink-muted font-medium", className)} {...props} />
);

export const CardContent = ({
 className,
 ...props
}: HTMLAttributes<HTMLDivElement>) => (
 <div className={cn("pt-0", className)} {...props} />
);

export const CardFooter = ({
 className,
 ...props
}: HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn("flex items-center pt-4 border-t border-[#E5E5EA] mt-4", className)}
 {...props}
 />
);
