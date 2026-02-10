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
            <div className={`relative ${aspectRatio} ${className} overflow-hidden group cursor-pointer rounded-2xl`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <img src={src} alt="" className="w-full h-full object-contain" />
                {isEditing && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity rounded-2xl ${isDragging ? 'bg-[#4a7c59] opacity-100' : 'bg-[#4a7c59]/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-sm">{isDragging ? 'Bırak' : 'Değiştir'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-2 border-dashed rounded-2xl ${isDragging ? 'border-[#4a7c59] bg-[#4a7c59]/10' : 'border-[#4a7c59]/30'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#4a7c59]`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-3xl opacity-30">🌿</span>
                <span className="text-xs mt-2 opacity-40">{isDragging ? 'Bırak' : 'Sürükle'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-[#e8f0e8] rounded-2xl`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b-2 border-dashed border-[#4a7c59]/20 focus:border-[#4a7c59] focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b-2 border-dashed border-[#4a7c59]/20 focus:border-[#4a7c59] focus:outline-none w-full`} />;
};

export default function OrganicNatural({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-[#f5fbf6] text-[#2d4a3e] font-['Lato',system-ui,sans-serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative overflow-hidden" style={{ background: sc.coverBg || 'linear-gradient(180deg, #e8f0e8 0%, #f5fbf6 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%234a7c59\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

                <div className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center p-20" style={{ color: sc.coverText || 'inherit' }}>
                    <div className="text-4xl mb-8">🌱</div>
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-28 h-28 mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BOTANICA" className="text-6xl font-light tracking-wide block mb-6" isEditing={isEditing} />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Naturally Sustainable" className="text-lg tracking-[0.3em] uppercase opacity-60 block" isEditing={isEditing} />
                    <div className="mt-16 flex items-center gap-4">
                        <span className="text-xl opacity-30">🍃</span>
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="Est. 2026" className="text-sm opacity-50" isEditing={isEditing} />
                        <span className="text-xl opacity-30">🍃</span>
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-20 px-20 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-center text-sm tracking-[0.3em] uppercase opacity-40 mb-12">Contents</h2>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { emoji: '🌱', title: 'Our Story' },
                            { emoji: '🌿', title: 'Values' },
                            { emoji: '🪴', title: 'Logo' },
                            { emoji: '🎨', title: 'Colors' },
                            { emoji: '✏️', title: 'Typography' },
                            { emoji: '📸', title: 'Imagery' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-[#f5fbf6] rounded-xl">
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="font-medium">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== STORY ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || '#f5fbf6' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-4xl block mb-8">🌱</span>
                    <h2 className="text-4xl font-light mb-8">Our Story</h2>
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Doğanın sunduğu güzelliği, sürdürülebilir tasarımla buluşturuyoruz. Her ürünümüz, çevreye saygı ve kalite anlayışıyla üretilir..."
                        className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ========== MISSION/VISION ========== */}
            <section className="py-32 px-20 bg-[#4a7c59] text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                    <div className="bg-white/10 backdrop-blur p-12 rounded-3xl">
                        <span className="text-2xl block mb-6">🎯</span>
                        <h3 className="text-sm tracking-widest uppercase opacity-60 mb-4">Mission</h3>
                        <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                            placeholder="Sürdürülebilir bir gelecek için doğal çözümler sunmak..."
                            className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                    <div className="bg-white/10 backdrop-blur p-12 rounded-3xl">
                        <span className="text-2xl block mb-6">🌍</span>
                        <h3 className="text-sm tracking-widest uppercase opacity-60 mb-4">Vision</h3>
                        <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                            placeholder="Ekolojik bilinç ve estetik anlayışı global ölçekte yaymak..."
                            className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== VALUES ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">Core Values</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { emoji: '🌿', title: 'Sustainability', desc: 'Eco-friendly practices' },
                            { emoji: '💚', title: 'Authenticity', desc: 'True to nature' },
                            { emoji: '🤝', title: 'Community', desc: 'Growing together' },
                            { emoji: '✨', title: 'Quality', desc: 'Excellence in craft' },
                        ].map((value, idx) => (
                            <div key={idx} className="p-8 bg-[#f5fbf6] rounded-3xl text-center">
                                <span className="text-4xl block mb-4">{value.emoji}</span>
                                <h3 className="font-bold mb-2">{value.title}</h3>
                                <p className="text-sm opacity-60">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-32 px-20 bg-[#e8f0e8]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">🪴 Logo</h2>
                    <div className="grid grid-cols-2 gap-16">
                        <div className="bg-white p-16 rounded-3xl">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Logomuz doğanın organik formlarından ilham alır. Yaprak motifi, büyüme ve yenilenmeyi simgeler..."
                                className="text-lg leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-2xl">
                                    <div className="text-xs text-[#4a7c59] uppercase tracking-wide mb-1">Min Size</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="24mm" className="text-2xl font-light" isEditing={isEditing} />
                                </div>
                                <div className="p-4 bg-white rounded-2xl">
                                    <div className="text-xs text-[#4a7c59] uppercase tracking-wide mb-1">Clear Space</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="1.5x" className="text-lg" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VARIANTS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-light mb-12 text-center">Logo Variations</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="bg-[#e8f0e8] p-8 rounded-3xl mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="font-medium block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== DONTS ========== */}
            <section className="py-32 px-20 bg-red-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-light mb-12 text-center">❌ Don'ts</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square bg-white border-2 border-red-200 rounded-2xl flex items-center justify-center text-4xl text-red-300 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-sm text-red-600" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || '#4a7c59', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">🎨 Color Palette</h2>
                    <div className="grid grid-cols-4 gap-6 mb-12">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square rounded-3xl mb-4 shadow-lg" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="font-medium block text-center" isEditing={isEditing} />
                                <div className="text-xs opacity-60 text-center mt-1 font-mono">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-32 px-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">✏️ Typography</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-12 bg-[#f5fbf6] rounded-3xl text-center">
                            <div className="text-[120px] leading-none mb-8 text-[#4a7c59]">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Lato" className="text-2xl font-medium block mb-2" isEditing={isEditing} />
                            <p className="text-sm opacity-50">Headlines</p>
                        </div>
                        <div className="p-12 bg-[#f5fbf6] rounded-3xl text-center">
                            <div className="text-[120px] leading-none mb-8">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Open Sans" className="text-2xl font-medium block mb-2" isEditing={isEditing} />
                            <p className="text-sm opacity-50">Body Text</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== IMAGERY ========== */}
            <section className="py-32 px-20 bg-[#e8f0e8]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">📸 Imagery Style</h2>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="flex justify-center gap-4">
                        {['Natural lighting', 'Earth tones', 'Organic textures'].map((rule, idx) => (
                            <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm">{rule}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-light mb-12 text-center">Applications</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="bg-[#e8f0e8] p-4 rounded-3xl">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="font-medium text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-24 px-20" style={{ background: sc.footerBg || '#2d4a3e', color: sc.footerText || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-3xl block mb-6">🌱</span>
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BOTANICA" className="text-3xl font-light tracking-wide block mb-4" isEditing={isEditing} />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="botanica.eco" className="text-sm opacity-50 block" isEditing={isEditing} />
                    <div className="mt-12 text-xs opacity-30">© {data.year} • Made with 💚</div>
                </div>
            </section>
        </div>
    );
}
