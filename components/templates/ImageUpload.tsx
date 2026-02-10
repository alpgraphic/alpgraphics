"use client";

import { useState, useCallback, useRef } from 'react';

interface ImageUploadProps {
    src?: string;
    onUpload: (file: File) => void;
    aspectRatio?: string;
    className?: string;
    isEditing: boolean;
    placeholder?: string;
    variant?: 'default' | 'minimal' | 'dark' | 'luxury' | 'brutalist';
}

export default function ImageUpload({
    src,
    onUpload,
    aspectRatio = "aspect-square",
    className = "",
    isEditing,
    placeholder = "Sürükle veya Tıkla",
    variant = "default"
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) setIsDragging(true);
    }, [isEditing]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!isEditing) return;

        const files = e.dataTransfer.files;
        if (files?.[0]?.type.startsWith('image/')) {
            onUpload(files[0]);
        }
    }, [isEditing, onUpload]);

    const handleClick = useCallback(() => {
        if (!isEditing) return;
        inputRef.current?.click();
    }, [isEditing]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        if (inputRef.current) inputRef.current.value = '';
    }, [onUpload]);

    // Variant styles
    const baseStyles = {
        default: {
            border: 'border-2 border-dashed border-gray-300 hover:border-gray-400',
            bg: 'bg-gray-50 hover:bg-gray-100',
            text: 'text-gray-400',
            drag: 'border-blue-500 bg-blue-50',
            overlay: 'bg-black/60',
        },
        minimal: {
            border: 'border border-dashed border-black/20 hover:border-black/40',
            bg: 'bg-transparent hover:bg-black/5',
            text: 'text-black/40',
            drag: 'border-black bg-black/10',
            overlay: 'bg-black/50',
        },
        dark: {
            border: 'border border-dashed border-white/20 hover:border-white/40',
            bg: 'bg-white/5 hover:bg-white/10',
            text: 'text-white/40',
            drag: 'border-yellow-500 bg-yellow-500/10',
            overlay: 'bg-yellow-500/80',
        },
        luxury: {
            border: 'border border-dashed border-[#c9a962]/30 hover:border-[#c9a962]/60',
            bg: 'bg-transparent hover:bg-[#c9a962]/5',
            text: 'text-[#c9a962]/50',
            drag: 'border-[#c9a962] bg-[#c9a962]/10',
            overlay: 'bg-[#c9a962]/80',
        },
        brutalist: {
            border: 'border-4 border-dashed border-black hover:border-black',
            bg: 'bg-transparent hover:bg-black/5',
            text: 'text-black font-mono',
            drag: 'border-red-500 bg-red-500/10',
            overlay: 'bg-black',
        },
    };

    const styles = baseStyles[variant];

    if (src) {
        return (
            <div
                className={`relative ${aspectRatio} ${className} overflow-hidden group cursor-pointer transition-all`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
                <img src={src} alt="" className="w-full h-full object-contain" />
                {isEditing && (
                    <div className={`absolute inset-0 transition-all flex flex-col items-center justify-center gap-2 ${isDragging ? `${styles.overlay} opacity-100` : `${styles.overlay} opacity-0 group-hover:opacity-100`}`}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white text-sm font-semibold">
                            {isDragging ? 'Bırak!' : 'Değiştir'}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    if (isEditing) {
        return (
            <div
                className={`${aspectRatio} ${className} ${isDragging ? styles.drag : `${styles.border} ${styles.bg}`} transition-all cursor-pointer flex flex-col items-center justify-center gap-2`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
                <svg className={`w-10 h-10 ${isDragging ? 'scale-110 text-current' : styles.text} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`text-sm ${styles.text}`}>
                    {isDragging ? 'Bırak!' : placeholder}
                </span>
            </div>
        );
    }

    return <div className={`${aspectRatio} ${className} bg-gray-100/50`} />;
}
