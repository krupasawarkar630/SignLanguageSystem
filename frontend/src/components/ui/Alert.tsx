import React, { HTMLAttributes } from"react";
import { cn } from"@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from"lucide-react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
 variant?:"info"|"success"|"warning"|"danger";
 title?: string;
 icon?: React.ReactNode;
}

export const Alert = ({
 variant ="info",
 title,
 icon,
 children,
 className,
 ...props
}: AlertProps) => {
 const variantStyles = {
 info: {
 bg:"bg-primary-light/50 border-l-primary text-ink",
 icon: <Info className="w-5 h-5 text-primary flex-shrink-0"/>,
 },
 success: {
 bg:"bg-success-light border-l-success text-ink",
 icon: <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0"/>,
 },
 warning: {
 bg:"bg-warning-light border-l-warning text-ink",
 icon: <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0"/>,
 },
 danger: {
 bg:"bg-danger-light border-l-danger text-ink",
 icon: <AlertCircle className="w-5 h-5 text-danger flex-shrink-0"/>,
 },
 };

 const currentVariant = variantStyles[variant];

 return (
 <div
 role="alert"
 className={cn(
"rounded-xl border border-gestura-border border-l-4 p-4 flex gap-3.5 items-start",
 currentVariant.bg,
 className
 )}
 {...props}
 >
 <div className="mt-0.5">{icon || currentVariant.icon}</div>
 <div className="flex-1">
 {title && (
 <h4 className="text-sm font-bold text-ink mb-1">
 {title}
 </h4>
 )}
 <div className="text-xs font-medium text-ink-muted leading-relaxed">
 {children}
 </div>
 </div>
 </div>
 );
};
