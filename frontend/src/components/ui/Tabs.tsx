import React from"react";
import { cn } from"@/lib/utils";

export interface TabItem {
 id: string;
 label: string;
 icon?: React.ReactNode;
 badge?: string | number;
}

export interface TabsProps {
 items: TabItem[];
 activeId: string;
 onChange: (id: string) => void;
 variant?:"primary"|"lime"|"dark";
 size?:"sm"|"md"|"lg";
 className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
 items,
 activeId,
 onChange,
 variant ="primary",
 size ="md",
 className,
}) => {
 const activeStyles = {
 primary:"bg-primary text-white rounded-full shadow-soft-sm",
 lime:"bg-primary text-white rounded-full shadow-soft-sm",
 dark:"bg-surface-dark text-white rounded-full shadow-soft-sm",
 };

 const inactiveStyles =
"text-ink-muted hover:text-ink hover:bg-gestura-bg-secondary rounded-full";

 const sizeClasses = {
 sm:"px-3 py-1.5 text-xs",
 md:"px-4 py-2 text-sm",
 lg:"px-6 py-2.5 text-base",
 };

 return (
 <div
 className={cn(
"inline-flex flex-wrap items-center gap-1 p-1 bg-gestura-bg-secondary rounded-full border border-gestura-border",
 className
 )}
 role="tablist"
 >
 {items.map((tab) => {
 const isActive = tab.id === activeId;
 return (
 <button
 key={tab.id}
 role="tab"
 aria-selected={isActive}
 onClick={() => onChange(tab.id)}
 className={cn(
"font-semibold inline-flex items-center gap-2 transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-primary/20",
 sizeClasses[size],
 isActive ? activeStyles[variant] : inactiveStyles
 )}
 >
 {tab.icon && <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>}
 <span>{tab.label}</span>
 {tab.badge !== undefined && (
 <span
 className={cn(
"px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
 isActive
 ?"bg-white/20 text-white"
 :"bg-ink/10 text-ink"
 )}
 >
 {tab.badge}
 </span>
 )}
 </button>
 );
 })}
 </div>
 );
};
