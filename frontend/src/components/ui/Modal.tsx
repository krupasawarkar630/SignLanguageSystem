"use client";

import React, { useEffect, useRef } from"react";
import { cn } from"@/lib/utils";
import { X } from"lucide-react";

export interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 description?: string;
 children: React.ReactNode;
 footer?: React.ReactNode;
 size?:"sm"|"md"|"lg"|"xl";
 className?: string;
}

export const Modal: React.FC<ModalProps> = ({
 isOpen,
 onClose,
 title,
 description,
 children,
 footer,
 size ="md",
 className,
}) => {
 const modalRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key ==="Escape"&& isOpen) {
 onClose();
 }
 };
 if (isOpen) {
 document.body.style.overflow ="hidden";
 window.addEventListener("keydown", handleKeyDown);
 }
 return () => {
 document.body.style.overflow ="unset";
 window.removeEventListener("keydown", handleKeyDown);
 };
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 const sizeClasses = {
 sm:"max-w-md",
 md:"max-w-lg",
 lg:"max-w-2xl",
 xl:"max-w-4xl",
 };

 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
 onClick={(e) => {
 if (e.target === e.currentTarget) onClose();
 }}
 role="dialog"
 aria-modal="true"
 >
 <div
 ref={modalRef}
 className={cn(
"w-full bg-white rounded-2xl shadow-soft-xl p-6 relative animate-in zoom-in-95 duration-150",
 sizeClasses[size],
 className
 )}
 >
 {/* Header */}
 <div className="flex items-start justify-between pb-4 border-b border-gestura-border mb-5">
 <div>
 {title && (
 <h2 className="text-xl font-bold text-ink">
 {title}
 </h2>
 )}
 {description && (
 <p className="text-sm text-ink-muted mt-1 font-medium">
 {description}
 </p>
 )}
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg bg-gestura-bg-secondary hover:bg-danger hover:text-white transition-colors"
 aria-label="Close modal"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>

 {/* Content */}
 <div className="py-2 text-ink">{children}</div>

 {/* Footer */}
 {footer && (
 <div className="mt-6 pt-4 border-t border-gestura-border flex items-center justify-end gap-3">
 {footer}
 </div>
 )}
 </div>
 </div>
 );
};
