"use client";

import { useState, useRef, useCallback } from 'react';
import { BrandGuideData } from "@/lib/brandGuideTypes";

interface TemplateProps {
    data: BrandGuideData;
    isEditing: boolean;
    onUpdate: (field: string, value: any) => void;
    onImageUpload: (fieldOrFile: string | File, field?: string) => void;
}

const DragImage = ({ src, field, onUpload, aspectRatio = "aspect-square", className = "", isEditing }: any) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isEditing) return;
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) onUpload(file, field);
    }, [isEditing, field, onUpload]);

    const handleClick = () => isEditing && inputRef.current?.click();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file, field);
    };

    if (src) {
        return (
            <div className={`relative ${aspectRatio} ${className} overflow-hidden group cursor-pointer`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <img src={src} alt="" className="w-full h-full object-contain" />
                {isEditing && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-[#c9a962] opacity-100' : 'bg-[#c9a962]/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-black text-sm font-bold">{isDragging ? 'Bırak' : 'Değiştir'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border border-dashed ${isDragging ? 'border-[#c9a962] bg-[#c9a962]/10' : 'border-[#c9a962]/30'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#c9a962]`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-[#c9a962] text-sm opacity-50">{isDragging ? 'Bırak' : '+ Görsel Yükle'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-white/5`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b border-dashed border-[#c9a962]/30 focus:border-[#c9a962] focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b border-dashed border-[#c9a962]/30 focus:border-[#c9a962] focus:outline-none w-full`} />;
};

export default function DarkPremium({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-[#0d0d0d] text-[#c9a962] font-['Didot',Georgia,serif]">

            {/* ===== COVER ===== */}
            <section className="min-h-screen flex flex-col justify-center items-center p-20 relative overflow-hidden" style={{ background: sc.coverBg || '#0d0d0d', color: sc.coverText || '#c9a962' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, rgba(201,169,98,0.2) 0%, transparent 70%)' }} />
                <div className="absolute top-8 left-8 text-xs tracking-[0.5em] uppercase opacity-30">Luxury Brand Guidelines</div>
                <div className="absolute top-8 right-8 text-xs tracking-[0.5em] uppercase opacity-30">
                    <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="2026" isEditing={isEditing} />
                </div>

                <div className="text-center relative z-10">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-32 h-32 mx-auto mb-16" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="LUXE" className="text-8xl font-light tracking-[0.3em] block mb-6" isEditing={isEditing} />
                    <div className="w-32 h-px bg-[#c9a962]/30 mx-auto my-8" />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Timeless Elegance" className="text-xl tracking-[0.5em] uppercase block font-sans" isEditing={isEditing} />
                </div>
            </section>

            {/* ===== MISSION ===== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || '#0d0d0d' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-8">Our Philosophy</span>
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Lüks, detaylarda gizlidir. Her dokuda mükemmellik, her tasarımda zamansızlık arayışı..."
                        className="text-3xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ===== VISION ===== */}
            <section className="py-32 px-20 bg-[#c9a962] text-[#0d0d0d]">
                <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16">
                    <div>
                        <span className="text-xs tracking-[0.5em] uppercase opacity-50 block mb-4">Mission</span>
                        <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                            placeholder="Zamansız zarafeti modern dünyaya taşımak..."
                            className="text-2xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                    <div>
                        <span className="text-xs tracking-[0.5em] uppercase opacity-50 block mb-4">Vision</span>
                        <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                            placeholder="Lüksün küresel standardını belirlemek..."
                            className="text-2xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ===== LOGO ===== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || '#0d0d0d' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-8">The Symbol</span>
                    <div className="grid grid-cols-2 gap-20">
                        <div className="border border-[#c9a962]/20 p-16">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Monogramımız, yüzyıllık zanaatkarlık geleneğini yansıtır..."
                                className="text-xl font-light italic leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-[#c9a962]/20 p-4">
                                    <span className="text-xs tracking-widest uppercase opacity-50 block mb-2">Minimum</span>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="15mm" className="text-2xl font-light" isEditing={isEditing} />
                                </div>
                                <div className="border border-[#c9a962]/20 p-4">
                                    <span className="text-xs tracking-widest uppercase opacity-50 block mb-2">Clear Space</span>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="2x" className="text-xl" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== VARIANTS ===== */}
            <section className="py-32 px-20 bg-[#1a1a1a]">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-12">Logo Variations</span>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="border border-[#c9a962]/20 p-8 mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="text-xs tracking-widest uppercase block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== DONTS ===== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase text-red-400 block mb-12">Incorrect Usage</span>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square border border-red-400/30 flex items-center justify-center text-4xl text-red-400/50 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-xs opacity-50" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== COLORS ===== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || '#c9a962', color: sc.accentText || '#0d0d0d' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-50 block mb-12">Color Palette</span>
                    <div className="grid grid-cols-4 gap-6">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square mb-4 shadow-xl" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="font-semibold block" isEditing={isEditing} />
                                <div className="text-xs opacity-50 font-mono mt-1">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TYPOGRAPHY ===== */}
            <section className="py-32 px-20 bg-[#0d0d0d]">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-12">Typography</span>
                    <div className="grid grid-cols-2 gap-16">
                        <div className="border border-[#c9a962]/20 p-12 text-center">
                            <div className="text-[150px] leading-none font-light italic">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Didot" className="text-xl mt-8 block" isEditing={isEditing} />
                            <p className="text-xs opacity-50 mt-2 font-sans">Display & Headlines</p>
                        </div>
                        <div className="border border-[#c9a962]/20 p-12 text-center font-sans">
                            <div className="text-[150px] leading-none font-light">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Futura" className="text-xl mt-8 block" isEditing={isEditing} />
                            <p className="text-xs opacity-50 mt-2">Body & Interface</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== IMAGERY ===== */}
            <section className="py-32 px-20 bg-[#1a1a1a]">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-12">Photography</span>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[3/4]" className="w-full" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="flex gap-6">
                        {['Moody lighting', 'Rich textures', 'Cinematic depth'].map((rule, idx) => (
                            <span key={idx} className="text-xs tracking-widest uppercase opacity-50">{rule}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== APPLICATIONS ===== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-30 block mb-12">Applications</span>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="border border-[#c9a962]/20 p-4">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="text-xs tracking-widest uppercase text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <section className="py-32 px-20" style={{ background: sc.footerBg || '#0d0d0d', color: sc.footerText || '#c9a962' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-20 h-20 mx-auto mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="LUXE" className="text-4xl font-light tracking-[0.3em] block mb-4" isEditing={isEditing} />
                    <div className="w-16 h-px bg-current mx-auto my-6 opacity-30" />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="luxe.com" className="text-sm tracking-[0.3em] opacity-50 block font-sans" isEditing={isEditing} />
                    <div className="mt-12 text-xs opacity-30 font-sans">© {data.year}</div>
                </div>
            </section>
        </div>
    );
}
