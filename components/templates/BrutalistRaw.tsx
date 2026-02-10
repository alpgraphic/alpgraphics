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
            <div className={`relative ${aspectRatio} ${className} overflow-hidden group cursor-pointer border-4 border-black`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <img src={src} alt="" className="w-full h-full object-contain grayscale" />
                {isEditing && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-red-500 opacity-100' : 'bg-black opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white font-mono text-xs uppercase">{isDragging ? '[DROP]' : '[REPLACE]'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-4 border-dashed ${isDragging ? 'border-red-500 bg-red-500/10' : 'border-black'} flex flex-col items-center justify-center cursor-pointer font-mono`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-xs uppercase">{isDragging ? '[DROP_FILE]' : '[UPLOAD]'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gray-200 border-4 border-black`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-2 border-dashed border-black focus:border-red-500 focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b-2 border-dashed border-black focus:border-red-500 focus:outline-none w-full`} />;
};

export default function BrutalistRaw({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-white text-black font-['JetBrains_Mono','Courier_New',monospace]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative" style={{ background: sc.coverBg || 'white', color: sc.coverText || 'black' }}>
                <div className="absolute inset-0 border-8 border-black m-4" />

                <div className="relative z-10 min-h-screen p-16 flex flex-col">
                    <div className="flex justify-between items-start mb-auto">
                        <div className="text-xs uppercase tracking-wider">
                            <div>BRAND_GUIDELINES</div>
                            <div className="opacity-50">VERSION_2.0</div>
                        </div>
                        <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-24 h-24" isEditing={isEditing} />
                    </div>

                    <div className="my-auto">
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BRUTAL_" className="text-[120px] font-bold leading-none block" isEditing={isEditing} />
                        <div className="mt-4 w-full h-2 bg-black" />
                        <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="NO_BULLSHIT_DESIGN" className="text-xl mt-4 block" isEditing={isEditing} />
                    </div>

                    <div className="flex justify-between items-end mt-auto text-xs">
                        <div className="opacity-50">
                            <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="©2026" isEditing={isEditing} />
                        </div>
                        <div className="text-right opacity-50">
                            <div>PAGE_001</div>
                            <div>RAW_EDITION</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-16 px-16 border-y-8 border-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">INDEX_</h2>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        {[
                            '001_MANIFESTO',
                            '002_IDENTITY',
                            '003_MARK',
                            '004_COLOR',
                            '005_TYPE',
                            '006_GRID',
                            '007_IMAGE',
                            '008_APPLICATION',
                        ].map((item, idx) => (
                            <div key={idx} className="py-2 border-b-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== MANIFESTO ========== */}
            <section className="py-32 px-16" style={{ background: sc.sectionBg1 || 'white' }}>
                <div className="max-w-4xl mx-auto">
                    <span className="text-xs opacity-50 block mb-4">001_MANIFESTO</span>
                    <h2 className="text-6xl font-bold mb-12">WHY_WE_EXIST</h2>
                    <div className="border-l-8 border-black pl-8">
                        <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                            placeholder="KISITLAMALARI REDDEDIYORUZ. GUZELLIK ESTETIK KURALLARDAN DEGIL, DOZLELLIKTEN GELIR. FONKSIYON > FORM. RAWNESS = TRUTH."
                            className="text-2xl leading-loose uppercase" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== MISSION/VISION ========== */}
            <section className="py-32 px-16 bg-black text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 gap-0">
                        <div className="border-4 border-white p-12">
                            <span className="text-xs opacity-50 block mb-4">MISSION_</span>
                            <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                                placeholder="SADELIK. DOGRUDAN. ETKILI. HIÇ BIR SEY FAZLA OLMAMALI."
                                className="text-xl uppercase leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="border-4 border-l-0 border-white p-12">
                            <span className="text-xs opacity-50 block mb-4">VISION_</span>
                            <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                                placeholder="ANTI-DESIGN HAREKETTININ LIDERI OLMAK. KURALLAR YIKILMAK ICIN VARDIR."
                                className="text-xl uppercase leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VALUES ========== */}
            <section className="py-32 px-16" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-bold mb-12">CORE_VALUES</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { code: 'RAW', title: 'RAWNESS', desc: 'NO_POLISH' },
                            { code: 'HON', title: 'HONESTY', desc: 'NO_BS' },
                            { code: 'FUN', title: 'FUNCTION', desc: 'OVER_FORM' },
                            { code: 'BRK', title: 'BREAKING', desc: 'THE_RULES' },
                        ].map((value, idx) => (
                            <div key={idx} className="border-4 border-black p-6 hover:bg-black hover:text-white transition-colors">
                                <div className="text-4xl font-bold mb-4">{value.code}</div>
                                <div className="text-sm font-bold">{value.title}</div>
                                <div className="text-xs opacity-50">{value.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-32 px-16 bg-red-500 text-white">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs opacity-70 block mb-4">003_MARK</span>
                    <h2 className="text-6xl font-bold mb-12">THE_MARK</h2>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="border-4 border-white p-12 bg-white">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="border-4 border-l-0 border-white p-12 flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="LOGO SADE OLMALI. FAZLALIK YOK. ANLAM DIREKT. DIKKAT CEKICI. MINIMAL AMA GUCLÜ."
                                className="text-lg uppercase leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="border-2 border-white p-4">
                                    <span className="text-xs opacity-70 block">MIN_SIZE</span>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="24PX" className="text-2xl font-bold" isEditing={isEditing} />
                                </div>
                                <div className="border-2 border-white p-4">
                                    <span className="text-xs opacity-70 block">CLEAR_SPACE</span>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="X*1.5" className="text-xl font-bold" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VARIANTS ========== */}
            <section className="py-32 px-16">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">LOGO_VARIANTS</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="border-4 border-black p-4">
                                <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full mb-4" isEditing={isEditing} />
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="VAR_" className="text-xs font-bold block uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== DONTS ========== */}
            <section className="py-32 px-16 bg-black text-red-500">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">DONT_FUCKING_DO_THIS</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="border-4 border-red-500 p-4 text-center">
                                <div className="aspect-square flex items-center justify-center text-6xl mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="RULE_" className="text-xs uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-32 px-16" style={{ background: sc.accentBg || 'white', color: sc.accentText || 'black' }}>
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs opacity-50 block mb-4">004_COLOR</span>
                    <h2 className="text-6xl font-bold mb-12">PALETTE_</h2>
                    <div className="grid grid-cols-4 gap-0">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx} className="border-4 border-black">
                                <div className="aspect-square" style={{ backgroundColor: color.hex }} />
                                <div className="p-4 bg-black text-white">
                                    <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                        placeholder="COLOR" className="text-sm font-bold block uppercase" isEditing={isEditing} />
                                    <div className="text-xs opacity-50 mt-1">{color.hex}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-32 px-16 bg-black text-white">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs opacity-50 block mb-4">005_TYPE</span>
                    <h2 className="text-6xl font-bold mb-12">TYPOGRAPHY_</h2>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="border-4 border-white p-12">
                            <div className="text-[180px] leading-none font-bold">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="JetBrains_Mono" className="text-xl font-bold block mt-8 uppercase" isEditing={isEditing} />
                            <p className="text-xs opacity-50 mt-2">HEADLINES_</p>
                        </div>
                        <div className="border-4 border-l-0 border-white p-12">
                            <div className="text-[180px] leading-none">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Space_Mono" className="text-xl font-bold block mt-8 uppercase" isEditing={isEditing} />
                            <p className="text-xs opacity-50 mt-2">BODY_</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== IMAGERY ========== */}
            <section className="py-32 px-16">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs opacity-50 block mb-4">007_IMAGE</span>
                    <h2 className="text-6xl font-bold mb-12">IMAGERY_</h2>
                    <div className="grid grid-cols-3 gap-0">
                        {[0, 1, 2].map((idx) => (
                            <div key={idx} className="border-4 border-black">
                                <DragImage src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4 text-sm">
                        {['GRAYSCALE', 'HIGH_CONTRAST', 'RAW_UNFILTERED', 'NO_STOCK'].map((rule, idx) => (
                            <span key={idx} className="border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">{rule}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-32 px-16 bg-yellow-400 text-black">
                <div className="max-w-6xl mx-auto">
                    <span className="text-xs opacity-50 block mb-4">008_APPLICATION</span>
                    <h2 className="text-6xl font-bold mb-12">IN_USE_</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx} className="border-4 border-black bg-white p-4">
                                <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="APP_" className="text-xs font-bold mt-4 block uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-20 px-16" style={{ background: sc.footerBg || 'black', color: sc.footerText || 'white' }}>
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BRUTAL_" className="text-4xl font-bold block" isEditing={isEditing} />
                        <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="BRUTAL.RAW" className="text-sm opacity-50 block mt-2" isEditing={isEditing} />
                    </div>
                    <div className="text-right text-xs opacity-50">
                        <div>©{data.year}</div>
                        <div>END_OF_DOC</div>
                        <div>[EXIT]</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
