"use client";

import { PageBlock } from "@/context/AgencyContext";
import { motion } from "framer-motion";
import { useState, useRef } from "react";

interface BlockRendererProps {
    block: PageBlock;
    isEditing?: boolean;
    onUpdate?: (blockId: string, content: Partial<PageBlock['content']>) => void;
    onImageUpload?: (blockId: string, field: string) => void;
    projectLogos?: {
        primary?: string;
        secondary?: string;
        icon?: string;
    };
}

export default function BlockRenderer({ block, isEditing = false, onUpdate, onImageUpload, projectLogos }: BlockRendererProps) {
    // Ensure block.content exists with default empty object
    if (!block.content) {
        block = { ...block, content: {} };
    }
    
    const getPaddingClass = () => {
        switch (block.style?.padding) {
            case 'sm': return 'py-8';
            case 'md': return 'py-12';
            case 'lg': return 'py-20';
            case 'xl': return 'py-32';
            default: return 'py-16';
        }
    };

    const containerStyle = {
        backgroundColor: block.style?.background || 'transparent',
        color: block.style?.textColor || 'inherit'
    };

    const EditableText = ({
        value,
        onChange,
        className,
        placeholder,
        multiline = false
    }: {
        value: string;
        onChange: (v: string) => void;
        className?: string;
        placeholder?: string;
        multiline?: boolean;
    }) => {
        if (!isEditing) {
            return <span className={className}>{value || placeholder}</span>;
        }

        if (multiline) {
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${className} bg-transparent border-b border-dashed border-current/30 focus:border-current focus:outline-none resize-none w-full`}
                    rows={4}
                />
            );
        }

        return (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${className} bg-transparent border-b border-dashed border-current/30 focus:border-current focus:outline-none w-full`}
            />
        );
    };

    const ImageUploadArea = ({
        src,
        onUpload,
        aspectRatio = "aspect-video",
        className = ""
    }: {
        src?: string;
        onUpload: () => void;
        aspectRatio?: string;
        className?: string;
    }) => {
        if (src) {
            return (
                <div className={`relative ${aspectRatio} ${className} overflow-hidden rounded-lg group`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {isEditing && (
                        <button
                            onClick={onUpload}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-bold"
                        >
                            Change Image
                        </button>
                    )}
                </div>
            );
        }

        if (isEditing) {
            return (
                <button
                    onClick={onUpload}
                    className={`${aspectRatio} ${className} border-2 border-dashed border-current/20 rounded-lg flex items-center justify-center hover:border-current/40 transition-colors`}
                >
                    <span className="text-sm opacity-40">+ Add Image</span>
                </button>
            );
        }

        return (
            <div className={`${aspectRatio} ${className} bg-current/5 rounded-lg`} />
        );
    };

    // HERO BLOCK
    if (block.type === 'hero') {
        return (
            <section className={`${getPaddingClass()} relative overflow-hidden`} style={containerStyle}>
                {block.content?.backgroundImage && (
                    <div className="absolute inset-0">
                        <img src={block.content.backgroundImage} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50" />
                    </div>
                )}
                <div className="max-w-7xl mx-auto px-6 md:px-20 relative z-10">
                    <EditableText
                        value={block.content.title || ''}
                        onChange={(v) => onUpdate?.(block.id, { title: v })}
                        placeholder="Project Title"
                        className="text-5xl md:text-7xl lg:text-8xl font-[900] tracking-tighter leading-none block"
                    />
                    <div className="h-4" />
                    <EditableText
                        value={block.content.subtitle || ''}
                        onChange={(v) => onUpdate?.(block.id, { subtitle: v })}
                        placeholder="Add a subtitle..."
                        className="text-xl md:text-2xl opacity-60 block max-w-2xl"
                    />
                    {isEditing && (
                        <button
                            onClick={() => onImageUpload?.(block.id, 'backgroundImage')}
                            className="mt-8 px-4 py-2 border border-current/20 rounded-lg text-sm opacity-60 hover:opacity-100"
                        >
                            {block.content.backgroundImage ? 'Change Background' : '+ Add Background Image'}
                        </button>
                    )}
                </div>
            </section>
        );
    }

    // TEXT BLOCK
    if (block.type === 'text') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-4xl mx-auto px-6 md:px-20">
                    <EditableText
                        value={block.content.text || ''}
                        onChange={(v) => onUpdate?.(block.id, { text: v })}
                        placeholder="Enter your text here..."
                        className="text-xl md:text-2xl leading-relaxed"
                        multiline
                    />
                </div>
            </section>
        );
    }

    // IMAGE BLOCK
    if (block.type === 'image') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-6xl mx-auto px-6 md:px-20">
                    <ImageUploadArea
                        src={block.content.image}
                        onUpload={() => onImageUpload?.(block.id, 'image')}
                        aspectRatio="aspect-[16/10]"
                    />
                    {(block.content.caption || isEditing) && (
                        <div className="mt-4 text-center">
                            <EditableText
                                value={block.content.caption || ''}
                                onChange={(v) => onUpdate?.(block.id, { caption: v })}
                                placeholder="Add a caption..."
                                className="text-sm opacity-60"
                            />
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // GALLERY BLOCK
    if (block.type === 'gallery') {
        const columns = block.content.columns || 2;
        const gridClass = columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
                'grid-cols-2 md:grid-cols-4';

        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className={`grid ${gridClass} gap-4`}>
                        {block.content.images?.map((img, idx) => (
                            <div key={idx} className="relative aspect-square overflow-hidden rounded-lg group">
                                <img src={img.src} alt={img.caption || ''} className="w-full h-full object-cover" />
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const newImages = [...(block.content.images || [])];
                                            newImages.splice(idx, 1);
                                            onUpdate?.(block.id, { images: newImages });
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <button
                                onClick={() => onImageUpload?.(block.id, 'galleryAdd')}
                                className="aspect-square border-2 border-dashed border-current/20 rounded-lg flex items-center justify-center hover:border-current/40 transition-colors"
                            >
                                <span className="text-sm opacity-40">+ Add</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    // QUOTE BLOCK
    if (block.type === 'quote') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-4xl mx-auto px-6 md:px-20 text-center">
                    <span className="text-6xl opacity-20 font-serif">"</span>
                    <EditableText
                        value={block.content.quote || ''}
                        onChange={(v) => onUpdate?.(block.id, { quote: v })}
                        placeholder="Add a testimonial or quote..."
                        className="text-2xl md:text-4xl font-[500] leading-relaxed italic block -mt-8"
                        multiline
                    />
                    <div className="mt-6">
                        <EditableText
                            value={block.content.author || ''}
                            onChange={(v) => onUpdate?.(block.id, { author: v })}
                            placeholder="Author name"
                            className="text-lg font-bold"
                        />
                    </div>
                </div>
            </section>
        );
    }

    // SPLIT BLOCK
    if (block.type === 'split') {
        const imageLeft = block.content.imagePosition !== 'right';
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${!imageLeft ? 'md:[direction:rtl]' : ''}`}>
                        <div className={!imageLeft ? 'md:[direction:ltr]' : ''}>
                            <ImageUploadArea
                                src={block.content.splitImage}
                                onUpload={() => onImageUpload?.(block.id, 'splitImage')}
                                aspectRatio="aspect-[4/5]"
                            />
                        </div>
                        <div className={!imageLeft ? 'md:[direction:ltr]' : ''}>
                            <EditableText
                                value={block.content.splitText || ''}
                                onChange={(v) => onUpdate?.(block.id, { splitText: v })}
                                placeholder="Add your text content here..."
                                className="text-xl md:text-2xl leading-relaxed"
                                multiline
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // STATS BLOCK
    if (block.type === 'stats') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                        {block.content.stats?.map((stat, idx) => (
                            <div key={idx}>
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={stat.value}
                                            onChange={(e) => {
                                                const newStats = [...(block.content.stats || [])];
                                                newStats[idx] = { ...newStats[idx], value: e.target.value };
                                                onUpdate?.(block.id, { stats: newStats });
                                            }}
                                            className="text-4xl md:text-6xl font-[900] bg-transparent text-center w-full focus:outline-none border-b border-dashed border-current/30"
                                        />
                                        <input
                                            type="text"
                                            value={stat.label}
                                            onChange={(e) => {
                                                const newStats = [...(block.content.stats || [])];
                                                newStats[idx] = { ...newStats[idx], label: e.target.value };
                                                onUpdate?.(block.id, { stats: newStats });
                                            }}
                                            className="text-sm uppercase tracking-widest opacity-60 mt-2 bg-transparent text-center w-full focus:outline-none"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-4xl md:text-6xl font-[900]">{stat.value}</p>
                                        <p className="text-sm uppercase tracking-widest opacity-60 mt-2">{stat.label}</p>
                                    </>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <button
                                onClick={() => {
                                    const newStats = [...(block.content.stats || []), { value: '00', label: 'Label' }];
                                    onUpdate?.(block.id, { stats: newStats });
                                }}
                                className="flex items-center justify-center border-2 border-dashed border-current/20 rounded-lg py-8 hover:border-current/40 transition-colors"
                            >
                                <span className="text-sm opacity-40">+ Add Stat</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    // VIDEO BLOCK
    if (block.type === 'video') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-6xl mx-auto px-6 md:px-20">
                    {block.content.videoUrl ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                                src={block.content.videoUrl}
                                className="w-full h-full"
                                allowFullScreen
                            />
                        </div>
                    ) : isEditing ? (
                        <div className="aspect-video border-2 border-dashed border-current/20 rounded-lg flex flex-col items-center justify-center gap-4">
                            <span className="text-sm opacity-40">Enter video embed URL</span>
                            <input
                                type="text"
                                placeholder="https://youtube.com/embed/..."
                                onChange={(e) => onUpdate?.(block.id, { videoUrl: e.target.value })}
                                className="px-4 py-2 bg-current/5 rounded-lg text-sm w-64 focus:outline-none"
                            />
                        </div>
                    ) : (
                        <div className="aspect-video bg-current/5 rounded-lg flex items-center justify-center">
                            <span className="opacity-40">No video</span>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // CTA BLOCK
    if (block.type === 'cta') {
        return (
            <section className={getPaddingClass()} style={containerStyle}>
                <div className="max-w-4xl mx-auto px-6 md:px-20 text-center">
                    {isEditing ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={block.content.buttonText || ''}
                                onChange={(e) => onUpdate?.(block.id, { buttonText: e.target.value })}
                                placeholder="Button Text"
                                className="text-2xl font-bold bg-transparent text-center focus:outline-none border-b border-dashed border-current/30"
                            />
                            <input
                                type="text"
                                value={block.content.buttonUrl || ''}
                                onChange={(e) => onUpdate?.(block.id, { buttonUrl: e.target.value })}
                                placeholder="Button URL (e.g. /contact)"
                                className="text-sm opacity-60 bg-transparent text-center focus:outline-none block mx-auto"
                            />
                        </div>
                    ) : (
                        <a
                            href={block.content.buttonUrl || '#'}
                            className="inline-flex items-center gap-4 px-8 py-4 bg-[#a62932] text-white text-xl font-bold rounded-full hover:bg-[#8a2229] transition-colors"
                        >
                            {block.content.buttonText || 'Get in Touch'}
                            <span>→</span>
                        </a>
                    )}
                </div>
            </section>
        );
    }

    // SPACER BLOCK
    if (block.type === 'spacer') {
        return (
            <div className={getPaddingClass()} style={containerStyle}>
                {isEditing && (
                    <div className="text-center">
                        <span className="text-xs opacity-30 uppercase tracking-widest">Spacer</span>
                    </div>
                )}
            </div>
        );
    }

    // ========================================
    // BRAND GUIDELINES BLOCKS
    // ========================================

    // BRAND COVER BLOCK
    if (block.type === 'brand-cover') {
        const bgColor = block.style?.background || '#0a0a0a';
        const textColor = block.style?.textColor || '#ffffff';

        return (
            <section
                className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                {/* Decorative elements - using current color with opacity */}
                <div className="absolute top-20 left-20 w-40 h-40 border border-current/10 rounded-full" />
                <div className="absolute bottom-20 right-20 w-60 h-60 border border-current/10 rounded-full" />
                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-current/30 rounded-full" />

                <div className="relative z-10 text-center px-8">
                    {/* Logo - Auto-propagate from project if not set */}
                    {(() => {
                        const logoToDisplay = block.content.logo || projectLogos?.primary;

                        if (logoToDisplay) {
                            return (
                                <div className="mb-12 group relative inline-block">
                                    <img src={logoToDisplay} alt="Logo" className="h-24 md:h-32 object-contain mx-auto" />
                                    {isEditing && (
                                        <button
                                            onClick={() => onImageUpload?.(block.id, 'logo')}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                                        >
                                            {block.content.logo ? 'Change Logo' : 'Override Project Logo'}
                                        </button>
                                    )}
                                </div>
                            );
                        }

                        if (isEditing) {
                            return (
                                <button
                                    onClick={() => onImageUpload?.(block.id, 'logo')}
                                    className="mb-12 px-8 py-6 border-2 border-dashed border-current/20 rounded-2xl hover:border-current/40 transition-colors"
                                >
                                    + Upload Logo
                                </button>
                            );
                        }

                        return null;
                    })()}

                    {/* Brand Name */}
                    <EditableText
                        value={block.content.brandName || ''}
                        onChange={(v) => onUpdate?.(block.id, { brandName: v })}
                        placeholder="Brand Name"
                        className="text-6xl md:text-8xl lg:text-[140px] font-[900] tracking-tighter leading-none block mb-6"
                    />

                    {/* Tagline */}
                    <EditableText
                        value={block.content.tagline || ''}
                        onChange={(v) => onUpdate?.(block.id, { tagline: v })}
                        placeholder="Brand Guidelines"
                        className="text-xl md:text-3xl font-light tracking-[0.3em] uppercase opacity-60 block"
                    />

                    {/* Year */}
                    <div className="mt-20">
                        <EditableText
                            value={block.content.year || ''}
                            onChange={(v) => onUpdate?.(block.id, { year: v })}
                            placeholder="2026"
                            className="text-sm tracking-[0.5em] uppercase opacity-40"
                        />
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="w-6 h-10 border-2 border-current/20 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-current/40 rounded-full animate-bounce" />
                    </div>
                </div>
            </section>
        );
    }

    // SECTION HEADER BLOCK
    if (block.type === 'section-header') {
        return (
            <section className="py-32 md:py-40" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="flex items-start gap-8 md:gap-16">
                        {/* Section Number */}
                        <div className="shrink-0">
                            <EditableText
                                value={block.content.sectionNumber || ''}
                                onChange={(v) => onUpdate?.(block.id, { sectionNumber: v })}
                                placeholder="01"
                                className="text-[120px] md:text-[200px] font-[900] leading-none tracking-tighter opacity-10"
                            />
                        </div>

                        {/* Content */}
                        <div className="pt-8 md:pt-16">
                            <EditableText
                                value={block.content.sectionTitle || ''}
                                onChange={(v) => onUpdate?.(block.id, { sectionTitle: v })}
                                placeholder="Section Title"
                                className="text-4xl md:text-6xl lg:text-7xl font-[900] tracking-tight leading-tight block"
                            />
                            <div className="h-6" />
                            <EditableText
                                value={block.content.sectionDescription || ''}
                                onChange={(v) => onUpdate?.(block.id, { sectionDescription: v })}
                                placeholder="Brief description of this section..."
                                className="text-lg md:text-xl opacity-60 max-w-xl block"
                                multiline
                            />
                        </div>
                    </div>

                    {/* Decorative line */}
                    <div className="mt-16 h-px bg-current/10 w-full" />
                </div>
            </section>
        );
    }

    // LOGO SHOWCASE BLOCK
    if (block.type === 'logo-showcase') {
        return (
            <section className="py-20 md:py-32" style={containerStyle}>
                <div className="max-w-6xl mx-auto px-6 md:px-20">
                    {/* Logo Display - Auto-propagate from project */}
                    <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-current/[0.02] to-current/[0.05] rounded-3xl p-16 md:p-24 group relative">
                        {(() => {
                            const logoToDisplay = block.content.logoImage || projectLogos?.primary;

                            if (logoToDisplay) {
                                return (
                                    <>
                                        <img
                                            src={logoToDisplay}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={() => onImageUpload?.(block.id, 'logoImage')}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg font-bold rounded-3xl"
                                            >
                                                {block.content.logoImage ? 'Change Logo' : 'Override Project Logo'}
                                            </button>
                                        )}
                                    </>
                                );
                            }

                            if (isEditing) {
                                return (
                                    <button
                                        onClick={() => onImageUpload?.(block.id, 'logoImage')}
                                        className="px-12 py-8 border-2 border-dashed border-current/20 rounded-2xl hover:border-current/40 transition-colors"
                                    >
                                        + Upload Logo
                                    </button>
                                );
                            }

                            return null;
                        })()}
                    </div>

                    {/* Description */}
                    {(block.content.logoDescription || isEditing) && (
                        <div className="mt-12 max-w-2xl mx-auto text-center">
                            <EditableText
                                value={block.content.logoDescription || ''}
                                onChange={(v) => onUpdate?.(block.id, { logoDescription: v })}
                                placeholder="The primary logo should be used wherever possible. It represents the full brand identity."
                                className="text-lg opacity-60"
                                multiline
                            />
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // LOGO GRID BLOCK
    if (block.type === 'logo-grid') {
        return (
            <section className="py-20" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {block.content.logoVariants?.map((variant, idx) => (
                            <div key={idx} className="group">
                                <div className="aspect-square flex items-center justify-center bg-current/[0.03] rounded-2xl p-12 relative">
                                    {variant.image ? (
                                        <>
                                            <img src={variant.image} alt={variant.name} className="max-w-full max-h-full object-contain" />
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        const variants = [...(block.content.logoVariants || [])];
                                                        variants.splice(idx, 1);
                                                        onUpdate?.(block.id, { logoVariants: variants });
                                                    }}
                                                    className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="opacity-20">Logo</span>
                                    )}
                                </div>
                                <h4 className="mt-4 text-lg font-bold">{variant.name}</h4>
                                {variant.description && (
                                    <p className="text-sm opacity-60 mt-1">{variant.description}</p>
                                )}
                            </div>
                        ))}

                        {isEditing && (
                            <button
                                onClick={() => onImageUpload?.(block.id, 'logoVariantAdd')}
                                className="aspect-square border-2 border-dashed border-current/20 rounded-2xl flex items-center justify-center hover:border-current/40 transition-colors"
                            >
                                + Add Variant
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    // LOGO DON'TS BLOCK
    if (block.type === 'logo-donts') {
        return (
            <section className="py-20" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-4">
                        <span className="w-8 h-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-sm">✕</span>
                        Incorrect Usage
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {block.content.logoDonts?.map((dont, idx) => (
                            <div key={idx} className="group relative">
                                <div className="aspect-square bg-current/[0.03] rounded-xl p-6 flex items-center justify-center border border-red-500/20">
                                    {dont.image ? (
                                        <img src={dont.image} alt={dont.label} className="max-w-full max-h-full object-contain opacity-60" />
                                    ) : (
                                        <span className="opacity-20">Example</span>
                                    )}
                                    {/* X overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-red-500/30 text-6xl font-bold">✕</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-center opacity-60">{dont.label || 'Don\'t do this'}</p>

                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const donts = [...(block.content.logoDonts || [])];
                                            donts.splice(idx, 1);
                                            onUpdate?.(block.id, { logoDonts: donts });
                                        }}
                                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {isEditing && (
                            <button
                                onClick={() => onImageUpload?.(block.id, 'logoDontAdd')}
                                className="aspect-square border-2 border-dashed border-current/20 rounded-xl flex items-center justify-center hover:border-current/40 transition-colors"
                            >
                                + Add
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    // COLOR PALETTE BLOCK
    if (block.type === 'color-palette') {
        const renderColorSwatch = (color: { name: string; hex: string; rgb?: string; cmyk?: string; pantone?: string }, idx: number, isPrimary: boolean) => (
            <div key={idx} className="group">
                <div
                    className="aspect-[3/4] rounded-2xl relative overflow-hidden shadow-xl"
                    style={{ backgroundColor: color.hex }}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />

                    {isEditing && (
                        <button
                            onClick={() => {
                                const colors = isPrimary
                                    ? [...(block.content.primaryColors || [])]
                                    : [...(block.content.secondaryColors || [])];
                                colors.splice(idx, 1);
                                onUpdate?.(block.id, isPrimary ? { primaryColors: colors } : { secondaryColors: colors });
                            }}
                            className="absolute top-3 right-3 w-6 h-6 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Color info */}
                <div className="mt-4 space-y-1">
                    <h4 className="font-bold text-lg">{color.name}</h4>
                    <p className="text-sm font-mono opacity-80">{color.hex}</p>
                    {color.rgb && <p className="text-xs opacity-50">RGB: {color.rgb}</p>}
                    {color.cmyk && <p className="text-xs opacity-50">CMYK: {color.cmyk}</p>}
                    {color.pantone && <p className="text-xs opacity-50">Pantone: {color.pantone}</p>}
                </div>
            </div>
        );

        return (
            <section className="py-20" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    {/* Primary Colors */}
                    {(block.content.primaryColors?.length || isEditing) && (
                        <div className="mb-16">
                            <h3 className="text-sm uppercase tracking-[0.3em] opacity-40 mb-8">Primary Colors</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {block.content.primaryColors?.map((color, idx) => renderColorSwatch(color, idx, true))}
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const newColor = { name: 'Color', hex: '#a62932', rgb: '166, 41, 50' };
                                            onUpdate?.(block.id, {
                                                primaryColors: [...(block.content.primaryColors || []), newColor]
                                            });
                                        }}
                                        className="aspect-[3/4] border-2 border-dashed border-current/20 rounded-2xl flex items-center justify-center hover:border-current/40 transition-colors"
                                    >
                                        + Add Color
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Secondary Colors */}
                    {(block.content.secondaryColors?.length || isEditing) && (
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.3em] opacity-40 mb-8">Secondary Colors</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
                                {block.content.secondaryColors?.map((color, idx) => (
                                    <div key={idx} className="group">
                                        <div
                                            className="aspect-square rounded-xl relative"
                                            style={{ backgroundColor: color.hex }}
                                        >
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        const colors = [...(block.content.secondaryColors || [])];
                                                        colors.splice(idx, 1);
                                                        onUpdate?.(block.id, { secondaryColors: colors });
                                                    }}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs font-mono opacity-60">{color.hex}</p>
                                    </div>
                                ))}
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const newColor = { name: 'Gray', hex: '#888888' };
                                            onUpdate?.(block.id, {
                                                secondaryColors: [...(block.content.secondaryColors || []), newColor]
                                            });
                                        }}
                                        className="aspect-square border-2 border-dashed border-current/20 rounded-xl flex items-center justify-center hover:border-current/40 transition-colors text-sm"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // TYPOGRAPHY SHOWCASE BLOCK
    if (block.type === 'typography-showcase') {
        return (
            <section className="py-20" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {/* Primary Font */}
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.3em] opacity-40 mb-8">Primary Typeface</h3>
                            <div className="bg-current/[0.03] rounded-3xl p-12">
                                <p
                                    className="text-[80px] md:text-[120px] font-[900] leading-none tracking-tight"
                                    style={{ fontFamily: block.content.primaryFont?.family }}
                                >
                                    Aa
                                </p>
                                <div className="mt-8 pt-8 border-t border-current/10">
                                    <EditableText
                                        value={block.content.primaryFont?.name || ''}
                                        onChange={(v) => onUpdate?.(block.id, {
                                            primaryFont: { ...block.content.primaryFont, name: v } as any
                                        })}
                                        placeholder="Montserrat"
                                        className="text-2xl font-bold block"
                                    />
                                    <p className="text-sm opacity-60 mt-2">
                                        ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                                        abcdefghijklmnopqrstuvwxyz<br />
                                        0123456789
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Font */}
                        <div>
                            <h3 className="text-sm uppercase tracking-[0.3em] opacity-40 mb-8">Secondary Typeface</h3>
                            <div className="bg-current/[0.03] rounded-3xl p-12">
                                <p
                                    className="text-[80px] md:text-[120px] font-light leading-none tracking-tight"
                                    style={{ fontFamily: block.content.secondaryFont?.family }}
                                >
                                    Aa
                                </p>
                                <div className="mt-8 pt-8 border-t border-current/10">
                                    <EditableText
                                        value={block.content.secondaryFont?.name || ''}
                                        onChange={(v) => onUpdate?.(block.id, {
                                            secondaryFont: { ...block.content.secondaryFont, name: v } as any
                                        })}
                                        placeholder="Inter"
                                        className="text-2xl font-bold block"
                                    />
                                    <p className="text-sm opacity-60 mt-2">
                                        ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                                        abcdefghijklmnopqrstuvwxyz<br />
                                        0123456789
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Font Weights */}
                    {(block.content.fontWeights?.length || isEditing) && (
                        <div className="mt-16 pt-16 border-t border-current/10">
                            <h3 className="text-sm uppercase tracking-[0.3em] opacity-40 mb-8">Font Weights</h3>
                            <div className="space-y-6">
                                {block.content.fontWeights?.map((fw, idx) => (
                                    <div key={idx} className="flex items-baseline gap-8 group">
                                        <span className="text-sm opacity-40 w-24 shrink-0">{fw.weight}</span>
                                        <p className="text-4xl md:text-5xl" style={{ fontWeight: parseInt(fw.weight) || 400 }}>
                                            {fw.sample || 'The quick brown fox'}
                                        </p>
                                        {isEditing && (
                                            <button
                                                onClick={() => {
                                                    const weights = [...(block.content.fontWeights || [])];
                                                    weights.splice(idx, 1);
                                                    onUpdate?.(block.id, { fontWeights: weights });
                                                }}
                                                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            onUpdate?.(block.id, {
                                                fontWeights: [...(block.content.fontWeights || []), { weight: '400', sample: 'The quick brown fox' }]
                                            });
                                        }}
                                        className="text-sm opacity-40 hover:opacity-100"
                                    >
                                        + Add Weight
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // MOCKUP GRID BLOCK
    if (block.type === 'mockup-grid') {
        return (
            <section className="py-20" style={containerStyle}>
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {block.content.mockups?.map((mockup, idx) => (
                            <div key={idx} className="group relative">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-current/[0.03]">
                                    {mockup.image ? (
                                        <img src={mockup.image} alt={mockup.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                            Mockup
                                        </div>
                                    )}
                                </div>
                                {mockup.label && (
                                    <p className="mt-4 text-sm opacity-60">{mockup.label}</p>
                                )}

                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const mockups = [...(block.content.mockups || [])];
                                            mockups.splice(idx, 1);
                                            onUpdate?.(block.id, { mockups: mockups });
                                        }}
                                        className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {isEditing && (
                            <button
                                onClick={() => onImageUpload?.(block.id, 'mockupAdd')}
                                className="aspect-[4/3] border-2 border-dashed border-current/20 rounded-2xl flex items-center justify-center hover:border-current/40 transition-colors"
                            >
                                + Add Mockup
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    return null;
}
