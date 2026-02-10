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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-black opacity-100' : 'bg-black/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-xs tracking-[0.3em] uppercase">{isDragging ? 'Drop' : 'Change'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border border-dashed ${isDragging ? 'border-black bg-black/5' : 'border-black/20'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-black`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-xs tracking-[0.3em] uppercase opacity-30">{isDragging ? 'Drop' : 'Upload'}</span>
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

export default function FashionLuxe({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-white text-black font-['Bodoni_Moda',Didot,Georgia,serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative flex items-center justify-center" style={{ background: sc.coverBg || 'white', color: sc.coverText || 'black' }}>
                <div className="absolute top-0 left-0 w-full h-px bg-black" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-black" />
                <div className="absolute top-0 left-0 h-full w-px bg-black" />
                <div className="absolute top-0 right-0 h-full w-px bg-black" />

                <div className="text-center p-20">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-24 h-24 mx-auto mb-16" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="MAISON" className="text-8xl tracking-[0.5em] font-light block mb-8" isEditing={isEditing} />
                    <div className="w-32 h-px bg-black mx-auto my-8" />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Haute Couture" className="text-sm tracking-[0.5em] uppercase block" isEditing={isEditing} />
                    <div className="mt-24 text-xs tracking-[0.5em] opacity-30">
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="MMXXVI" isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-20 px-20 border-y border-black">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-4 gap-16">
                        {['I. Essence', 'II. Symbol', 'III. Color', 'IV. Type'].map((item, idx) => (
                            <div key={idx} className="text-center">
                                <span className="text-xs tracking-[0.3em]">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== ESSENCE ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-8">I</span>
                    <h2 className="text-5xl font-light italic mb-12">L'Essence</h2>
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Zarafet, detaylarda gizlidir. Her dokuda mükemmellik, her çizgide zarafet arayışı..."
                        className="text-2xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ========== VISION ========== */}
            <section className="py-32 px-20 bg-black text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 gap-px bg-white">
                    <div className="bg-black p-16">
                        <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-6">Mission</span>
                        <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                            placeholder="Zamansız zarafeti modern dünyaya taşımak..."
                            className="text-xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                    <div className="bg-black p-16">
                        <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-6">Vision</span>
                        <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                            placeholder="Lüksün evrensel dili olmak..."
                            className="text-xl font-light italic leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">II</span>
                    <h2 className="text-5xl font-light italic mb-16 text-center">Le Symbole</h2>
                    <div className="grid grid-cols-2 gap-20">
                        <div className="border border-black p-20">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Monogramımız, yüzyıllık zanaatkarlık geleneğini yansıtır. Her harf özenle tasarlanmış, dengeli ve zarif..."
                                className="text-lg font-light italic leading-relaxed mb-12" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-8">
                                <div className="py-4 border-b border-black/20">
                                    <span className="text-xs tracking-widest uppercase opacity-40 block mb-2">Minimum</span>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="15mm" className="text-2xl font-light" isEditing={isEditing} />
                                </div>
                                <div className="py-4 border-b border-black/20">
                                    <span className="text-xs tracking-widest uppercase opacity-40 block mb-2">Clear Space</span>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="2x" className="text-xl" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VARIANTS ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-light italic mb-16 text-center">Variations</h2>
                    <div className="grid grid-cols-4 gap-8">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="border border-black/10 p-8 bg-white mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="text-xs tracking-[0.3em] uppercase block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== DONTS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-light italic mb-16 text-center">À Éviter</h2>
                    <div className="grid grid-cols-4 gap-8">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square border border-black/30 flex items-center justify-center text-4xl text-black/20 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-xs opacity-50" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || 'black', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">III</span>
                    <h2 className="text-5xl font-light italic mb-16 text-center">La Couleur</h2>
                    <div className="grid grid-cols-4 gap-8">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-[2/3] mb-6 border border-white/20" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="text-xs tracking-[0.3em] uppercase block" isEditing={isEditing} />
                                <div className="text-[10px] opacity-40 mt-2 font-mono font-sans">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs tracking-[0.5em] uppercase opacity-40 block mb-4 text-center">IV</span>
                    <h2 className="text-5xl font-light italic mb-16 text-center">Typographie</h2>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="border border-black p-16 text-center">
                            <div className="text-[200px] leading-none font-light italic">A</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Bodoni Moda" className="text-xl tracking-[0.2em] block mt-8" isEditing={isEditing} />
                            <p className="text-xs tracking-widest uppercase opacity-40 mt-2 font-sans">Display</p>
                        </div>
                        <div className="border border-l-0 border-black p-16 text-center font-sans">
                            <div className="text-[200px] leading-none font-extralight">A</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Cormorant" className="text-xl tracking-[0.2em] block mt-8" isEditing={isEditing} />
                            <p className="text-xs tracking-widest uppercase opacity-40 mt-2">Body</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== IMAGERY ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-light italic mb-16 text-center">Imagery</h2>
                    <div className="grid grid-cols-3 gap-px bg-black">
                        {[0, 1, 2].map((idx) => (
                            <div key={idx} className="bg-white">
                                <DragImage src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[3/4]" className="w-full" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <div className="inline-flex gap-12">
                            {['High contrast', 'Editorial style', 'Dramatic lighting'].map((rule, idx) => (
                                <span key={idx} className="text-xs tracking-[0.3em] uppercase opacity-40">{rule}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-light italic mb-16 text-center">Applications</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="border border-black p-4">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="text-xs tracking-[0.3em] uppercase text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-32 px-20" style={{ background: sc.footerBg || 'black', color: sc.footerText || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-16 h-16 mx-auto mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="MAISON" className="text-4xl tracking-[0.5em] font-light block mb-6" isEditing={isEditing} />
                    <div className="w-16 h-px bg-current mx-auto my-8 opacity-20" />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="maison.paris" className="text-xs tracking-[0.5em] opacity-40 block font-sans" isEditing={isEditing} />
                    <div className="mt-12 text-[10px] tracking-[0.3em] opacity-20 font-sans">© {data.year}</div>
                </div>
            </section>
        </div>
    );
}
