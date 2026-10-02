"use client";

import React, { ReactNode } from"react";
import { cn } from"@/lib/utils";
import { Button } from"./Button";

export interface EmptyStateProps {
 icon?: ReactNode;
 title: string;
 description: string;
 actionLabel?: string;
 onAction?: () => void;
 secondaryActionLabel?: string;
 onSecondaryAction?: () => void;
 statusBadge?: string;
 className?: string;
 children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
 icon,
 title,
 description,
 actionLabel,
 onAction,
 secondaryActionLabel,
 onSecondaryAction,
 statusBadge,
 className,
 children,
}) => {
 return (
 <div
 className={cn(
"rounded-2xl border border-gestura-border bg-white p-8 md:p-12 text-center shadow-soft flex flex-col items-center justify-center max-w-2xl mx-auto",
 className
 )}
 >
 {statusBadge && (
 <span className="mb-4 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
 {statusBadge}
 </span>
 )}

 {icon && (
 <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mb-5">
 {icon}
 </div>
 )}

 <h3 className="text-xl md:text-2xl font-bold text-ink mb-2">
 {title}
 </h3>

 <p className="text-sm text-ink-muted font-medium max-w-md mb-6 leading-relaxed">
 {description}
 </p>

 {children && <div className="mb-6 w-full">{children}</div>}

 {(actionLabel || secondaryActionLabel) && (
 <div className="flex flex-wrap items-center justify-center gap-3">
 {actionLabel && (
 <Button variant="primary"onClick={onAction}>
 {actionLabel}
 </Button>
 )}
 {secondaryActionLabel && (
 <Button variant="secondary"onClick={onSecondaryAction}>
 {secondaryActionLabel}
 </Button>
 )}
 </div>
 )}
 </div>
 );
};
