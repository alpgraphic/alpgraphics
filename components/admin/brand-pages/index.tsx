"use client";

import { BrandGuideData } from '@/lib/brandGuideTypes';

// Page configuration type
export interface BrandPageConfig {
    id: string;
    title: string;
    component: React.ComponentType<BrandPageProps>;
    deletable?: boolean;
}

// Props that each page receives
export interface BrandPageProps {
    data: BrandGuideData;
    pageNumber: number;
    totalPages: number;
    isEditing?: boolean;
    onUpdate?: (field: string, value: any) => void;
}

// Base page wrapper with consistent styling
export function PageWrapper({
    children,
    pageNumber,
    totalPages,
    title,
    logo,
    primaryColor = '#a62932',
    variant = 'light'
}: {
    children: React.ReactNode;
    pageNumber: number;
    totalPages: number;
    title?: string;
    logo?: string;
    primaryColor?: string;
    variant?: 'light' | 'dark' | 'primary';
}) {
    const bgClass = variant === 'dark'
        ? 'bg-[#1a1a1a] text-white'
        : variant === 'primary'
            ? `text-white`
            : 'bg-white text-[#1a1a1a]';

    return (
        <div
            className={`relative w-full aspect-[210/297] ${bgClass} overflow-hidden`}
            style={variant === 'primary' ? { backgroundColor: primaryColor } : undefined}
        >
            {/* Page Content */}
            <div className="absolute inset-0 p-[8%]">
                {children}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-[8%] py-[4%] flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono opacity-40">
                        {String(pageNumber).padStart(2, '0')} - Çalışma Yüzeyi {pageNumber}
                    </span>
                </div>
                {logo && (
                    <img src={logo} alt="Logo" className="h-6 opacity-30 object-contain" />
                )}
            </div>
        </div>
    );
}

// Editable text component for pages
export function EditableField({
    value,
    onChange,
    isEditing,
    className = '',
    multiline = false,
    placeholder = 'Metin girin...'
}: {
    value: string;
    onChange?: (value: string) => void;
    isEditing?: boolean;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
}) {
    if (!isEditing) {
        return <span className={className}>{value || placeholder}</span>;
    }

    if (multiline) {
        return (
            <textarea
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className={`${className} bg-transparent border border-dashed border-current/30 focus:border-current focus:outline-none resize-none w-full p-2 rounded`}
                rows={4}
            />
        );
    }

    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`${className} bg-transparent border-b border-dashed border-current/30 focus:border-current focus:outline-none w-full`}
        />
    );
}
