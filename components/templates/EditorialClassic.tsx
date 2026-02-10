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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-black opacity-100' : 'bg-black/70 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-xs uppercase tracking-widest">{isDragging ? 'Drop' : 'Change'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border border-dashed ${isDragging ? 'border-black bg-black/5' : 'border-gray-400'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-black`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-xs uppercase tracking-widest opacity-40">{isDragging ? 'Drop' : 'Upload'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gray-100`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b border-dashed border-current/20 focus:border-current focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b border-dashed border-current/20 focus:border-current focus:outline-none w-full`} />;
};

export default function EditorialClassic({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-[#fdfaf6] text-gray-800 font-['Playfair_Display',Georgia,serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative" style={{ background: sc.coverBg || '#fdfaf6', color: sc.coverText || 'inherit' }}>
                <div className="absolute inset-8 border-2 border-black" />
                <div className="absolute inset-12 border border-black/20" />

                <div className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center p-20">
                    <div className="text-xs tracking-[0.5em] uppercase opacity-40 mb-8">Brand Guidelines</div>
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-24 h-24 mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="THE EDITORIAL" className="text-7xl italic font-light block mb-6" isEditing={isEditing} />
                    <div className="w-24 h-px bg-black/20 my-6" />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Timeless Elegance Since 1920" className="text-lg tracking-[0.3em] uppercase opacity-50 block" isEditing={isEditing} />
                    <div className="absolute bottom-16 text-xs tracking-[0.3em] opacity-30">
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="MMXXVI" isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-20 px-20 border-t border-b border-black/10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-center text-xs tracking-[0.5em] uppercase opacity-40 mb-12 font-sans">Contents</h2>
                    <div className="grid grid-cols-2 gap-x-20">
                        {[
                            { num: 'I', title: 'The Story' },
                            { num: 'II', title: 'Philosophy' },
                            { num: 'III', title: 'The Monogram' },
                            { num: 'IV', title: 'Variations' },
                            { num: 'V', title: 'Color' },
                            { num: 'VI', title: 'Typography' },
                            { num: 'VII', title: 'Imagery' },
                            { num: 'VIII', title: 'In Use' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-4 border-b border-black/10">
                                <span className="italic">{item.title}</span>
                                <span className="text-xs opacity-30">{item.num}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== THE STORY ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || '#fdfaf6' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-8">I — The Story</span>
                    <h2 className="text-5xl italic font-light mb-12">Our Heritage</h2>
                    <div className="w-16 h-px bg-black/20 mx-auto mb-12" />
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Her marka bir hikaye anlatır. Bizimki, zarafet ve zamansızlık üzerine kurulu bir yolculuk..."
                        className="text-xl leading-loose" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ========== PHILOSOPHY ========== */}
            <section className="py-32 px-20 bg-black text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 gap-0">
                        <div className="p-16 border-r border-white/10">
                            <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-8">Mission</span>
                            <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                                placeholder="Kaliteden asla ödün vermeden, zamanın ötesinde değerler yaratmak..."
                                className="text-2xl italic leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="p-16">
                            <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-8">Vision</span>
                            <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                                placeholder="Klasik değerleri modern dünyaya taşıyan bir köprü olmak..."
                                className="text-2xl italic leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || '#fdfaf6' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">III</span>
                    <h2 className="text-5xl italic font-light mb-16 text-center">The Monogram</h2>
                    <div className="grid grid-cols-2 gap-20">
                        <div className="border border-black/10 p-16">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Monogramımız, markanın özünü tek bir işarette toplar. Her çizgi, yüzyıllık mirasımızı yansıtır..."
                                className="text-lg italic leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="py-4 border-b border-black/10">
                                    <div className="text-xs tracking-widest uppercase opacity-40 mb-2">Minimum</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="18mm" className="text-2xl italic" isEditing={isEditing} />
                                </div>
                                <div className="py-4 border-b border-black/10">
                                    <div className="text-xs tracking-widest uppercase opacity-40 mb-2">Clear Space</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="2x" className="text-xl italic" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VARIANTS ========== */}
            <section className="py-32 px-20 bg-gray-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl italic font-light mb-16 text-center">Variations</h2>
                    <div className="grid grid-cols-4 gap-8">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="bg-white border border-black/10 p-8 mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="italic block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== DONTS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl italic font-light mb-12 text-center">Incorrect Usage</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square border border-red-200 bg-red-50 flex items-center justify-center text-4xl text-red-300 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-xs opacity-60" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || 'black', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">V</span>
                    <h2 className="text-5xl italic font-light mb-16 text-center">Color</h2>
                    <div className="grid grid-cols-4 gap-8 mb-12">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square mb-6" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="italic block text-center" isEditing={isEditing} />
                                <div className="text-xs opacity-40 text-center mt-1 font-mono font-sans">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || '#fdfaf6' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">VI</span>
                    <h2 className="text-5xl italic font-light mb-16 text-center">Typography</h2>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="p-16 border border-black/10 text-center">
                            <div className="text-[160px] leading-none mb-8 italic">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Playfair Display" className="text-xl italic block mb-2" isEditing={isEditing} />
                            <p className="text-xs opacity-40 uppercase tracking-widest font-sans">Display & Headlines</p>
                        </div>
                        <div className="p-16 border border-l-0 border-black/10 text-center font-sans">
                            <div className="text-[160px] leading-none mb-8">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Source Serif Pro" className="text-xl block mb-2" isEditing={isEditing} />
                            <p className="text-xs opacity-40 uppercase tracking-widest">Body & Captions</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== IMAGERY ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">VII</span>
                    <h2 className="text-5xl italic font-light mb-16 text-center">Imagery</h2>
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[3/4]" className="w-full" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="text-center">
                        <div className="inline-flex gap-8">
                            {['Editorial lighting', 'Classic composition', 'Muted palette'].map((rule, idx) => (
                                <span key={idx} className="text-sm italic opacity-60">{rule}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-32 px-20 bg-gray-100">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">VIII</span>
                    <h2 className="text-5xl italic font-light mb-16 text-center">In Use</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="border border-black/10 p-4 bg-white">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="italic text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-24 px-20" style={{ background: sc.footerBg || '#1a1a1a', color: sc.footerText || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-16 h-16 mx-auto mb-8" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="THE EDITORIAL" className="text-3xl italic font-light block mb-4" isEditing={isEditing} />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="theeditorial.com" className="text-xs tracking-[0.3em] opacity-40 block font-sans" isEditing={isEditing} />
                    <div className="mt-12 w-12 h-px bg-current/20 mx-auto" />
                    <div className="mt-8 text-[10px] opacity-20 font-sans">© {data.year}</div>
                </div>
            </section>
        </div>
    );
}
