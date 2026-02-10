"use client";

import { useState, useRef, useCallback } from 'react';
import { BrandGuideData } from "@/lib/brandGuideTypes";

interface TemplateProps {
    data: BrandGuideData;
    isEditing: boolean;
    onUpdate: (field: string, value: any) => void;
    onImageUpload: (fieldOrFile: string | File, field?: string) => void;
}

// Drag-drop image component
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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-[#0f4c81] opacity-100' : 'bg-[#0f4c81]/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-sm font-semibold">{isDragging ? 'Bırak' : 'Değiştir'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-2 border-dashed ${isDragging ? 'border-[#0f4c81] bg-[#0f4c81]/10' : 'border-gray-300'} flex flex-col items-center justify-center cursor-pointer transition-all group hover:border-[#0f4c81]`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-3xl opacity-30 group-hover:opacity-60">+</span>
                <span className="text-xs mt-2 opacity-40">{isDragging ? 'Bırak' : 'Sürükle'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gray-100`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b-2 border-dashed border-[#0f4c81]/20 focus:border-[#0f4c81] focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b-2 border-dashed border-[#0f4c81]/20 focus:border-[#0f4c81] focus:outline-none w-full`} />;
};

const SectionHeader = ({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) => (
    <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
            <span className="text-xs font-bold text-[#0f4c81] bg-[#0f4c81]/10 px-3 py-1 rounded">{number}</span>
            <h2 className="text-3xl font-bold text-[#1e3a5f]">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500 ml-16">{subtitle}</p>}
    </div>
);

export default function CorporateBlue({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-white text-gray-800 font-['IBM_Plex_Sans',system-ui,sans-serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative overflow-hidden" style={{ background: sc.coverBg || 'linear-gradient(135deg, #0f4c81 0%, #1e3a5f 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 min-h-screen flex">
                    <div className="flex-1 flex flex-col justify-center p-20" style={{ color: sc.coverText || 'white' }}>
                        <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-20 h-20 mb-12" isEditing={isEditing} />
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="CORPORATE" className="text-6xl font-bold tracking-tight block mb-4" isEditing={isEditing} />
                        <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Building Trust, Delivering Results" className="text-xl opacity-80 block mb-8" isEditing={isEditing} />
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-1 bg-current opacity-50" />
                            <span className="text-sm opacity-60">BRAND GUIDELINES</span>
                            <span className="text-sm opacity-40">|</span>
                            <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="2026" className="text-sm opacity-60" isEditing={isEditing} />
                        </div>
                    </div>
                    <div className="w-1/3 bg-white/10 backdrop-blur-sm flex items-center justify-center p-12">
                        <div className="text-center text-white">
                            <div className="text-6xl font-light opacity-20 mb-4">v2.0</div>
                            <div className="text-xs tracking-widest opacity-40">EDITION</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-20 px-20 bg-gray-50 border-b-4 border-[#0f4c81]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-[#1e3a5f] mb-8">Table of Contents</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { num: '01', title: 'Brand Overview' },
                            { num: '02', title: 'Mission & Vision' },
                            { num: '03', title: 'Core Values' },
                            { num: '04', title: 'Logo System' },
                            { num: '05', title: 'Color Palette' },
                            { num: '06', title: 'Typography' },
                            { num: '07', title: 'Photography' },
                            { num: '08', title: 'Applications' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-3 border-b border-gray-200">
                                <span className="text-xs font-bold text-[#0f4c81]">{item.num}</span>
                                <span className="text-sm">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== BRAND OVERVIEW ========== */}
            <section className="py-24 px-20" style={{ background: sc.sectionBg1 || 'white', color: sc.sectionText1 || 'inherit' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="01" title="Brand Overview" subtitle="Our corporate identity at a glance" />
                    <div className="grid grid-cols-2 gap-16">
                        <div>
                            <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                                placeholder="Kurumsal kimliğimiz, güven, profesyonellik ve yenilikçiliği temsil eder. Her iletişimimizde bu değerleri yansıtmak önceliğimizdir."
                                className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="bg-[#0f4c81]/5 p-8 rounded-lg">
                            <h3 className="font-bold text-[#0f4c81] mb-4">Quick Facts</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-sm opacity-60">Founded</span>
                                    <span className="font-semibold">{data.year}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-sm opacity-60">Industry</span>
                                    <span className="font-semibold">Corporate</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm opacity-60">Website</span>
                                    <span className="font-semibold">{data.website || 'www.example.com'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== MISSION & VISION ========== */}
            <section className="py-24 px-20" style={{ background: sc.sectionBg2 || '#f8f9fa', color: sc.sectionText2 || 'inherit' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="02" title="Mission & Vision" />
                    <div className="grid grid-cols-2 gap-0">
                        <div className="bg-[#0f4c81] text-white p-12">
                            <h3 className="text-xs tracking-widest opacity-60 mb-4">OUR MISSION</h3>
                            <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                                placeholder="Müşterilerimize en yüksek kalitede hizmet sunmak ve sürdürülebilir büyüme sağlamak."
                                className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="bg-[#1e3a5f] text-white p-12">
                            <h3 className="text-xs tracking-widest opacity-60 mb-4">OUR VISION</h3>
                            <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                                placeholder="Sektörümüzde lider konuma ulaşmak ve global ölçekte güvenilir bir partner olmak."
                                className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== CORE VALUES ========== */}
            <section className="py-24 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="03" title="Core Values" subtitle="The principles that guide our business" />
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { icon: '🎯', title: 'Integrity', desc: 'Honest and ethical in all we do' },
                            { icon: '🤝', title: 'Partnership', desc: 'Building lasting relationships' },
                            { icon: '💡', title: 'Innovation', desc: 'Embracing new ideas' },
                            { icon: '⭐', title: 'Excellence', desc: 'Striving for the best' },
                        ].map((value, idx) => (
                            <div key={idx} className="p-6 bg-white border-2 border-gray-100 hover:border-[#0f4c81] transition-colors">
                                <div className="text-3xl mb-4">{value.icon}</div>
                                <h3 className="font-bold text-[#1e3a5f] mb-2">{value.title}</h3>
                                <p className="text-sm text-gray-500">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-24 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="04" title="Logo System" subtitle="Primary logo and usage guidelines" />
                    <div className="grid grid-cols-2 gap-16">
                        <div className="bg-white p-12 border border-gray-200 rounded-lg">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-video" className="w-full" isEditing={isEditing} />
                        </div>
                        <div>
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Logomuz kurumsal kimliğimizin temel taşıdır. Güvenilirliği ve profesyonelliği yansıtacak şekilde tasarlanmıştır."
                                className="text-lg leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#0f4c81]/5 rounded">
                                    <div className="text-xs text-[#0f4c81] font-semibold mb-1">Minimum Size</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="30mm" className="text-2xl font-bold" isEditing={isEditing} />
                                </div>
                                <div className="p-4 bg-[#0f4c81]/5 rounded">
                                    <div className="text-xs text-[#0f4c81] font-semibold mb-1">Clear Space</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="1.5x height" className="text-lg" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== LOGO VARIANTS ========== */}
            <section className="py-24 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="04.1" title="Logo Variations" />
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="font-semibold block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO DONTS ========== */}
            <section className="py-24 px-20 bg-red-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="04.2" title="Incorrect Usage" subtitle="What to avoid" />
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square bg-white border-2 border-red-200 rounded-lg flex items-center justify-center text-4xl text-red-300 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-sm text-red-600" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-24 px-20" style={{ background: sc.accentBg || '#0f4c81', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="05" title="Color Palette" subtitle="Corporate color system" />
                    <div className="grid grid-cols-4 gap-6 mb-12">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square rounded-lg mb-4 shadow-lg" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="font-semibold block" isEditing={isEditing} />
                                <div className="text-xs opacity-60 font-mono mt-1">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                        {data.secondaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square rounded mb-2" style={{ backgroundColor: color.hex }} />
                                <div className="text-xs opacity-60 font-mono">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-24 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="06" title="Typography" subtitle="Font families and usage" />
                    <div className="grid grid-cols-2 gap-16">
                        <div className="p-12 bg-gray-50 rounded-lg">
                            <div className="text-8xl font-bold text-[#0f4c81] mb-8">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="IBM Plex Sans" className="text-2xl font-bold block mb-2" isEditing={isEditing} />
                            <p className="text-sm text-gray-500">Headlines & Titles</p>
                        </div>
                        <div className="p-12 bg-gray-50 rounded-lg">
                            <div className="text-8xl mb-8">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="IBM Plex Sans" className="text-2xl font-bold block mb-2" isEditing={isEditing} />
                            <p className="text-sm text-gray-500">Body & Interface</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== PHOTOGRAPHY ========== */}
            <section className="py-24 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="07" title="Photography Style" />
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full rounded-lg" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        {['Professional lighting', 'Corporate settings', 'Diverse teams', 'Clean backgrounds'].map((rule, idx) => (
                            <span key={idx} className="px-4 py-2 bg-[#0f4c81]/10 text-[#0f4c81] rounded-full text-sm font-medium">{rule}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-24 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="08" title="Applications" subtitle="Brand in context" />
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="font-semibold mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-20 px-20" style={{ background: sc.footerBg || '#1e3a5f', color: sc.footerText || 'white' }}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-12 h-12" isEditing={isEditing} />
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="CORPORATE" className="text-xl font-bold" isEditing={isEditing} />
                    </div>
                    <div className="text-right">
                        <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="www.corporate.com" className="text-sm opacity-60 block" isEditing={isEditing} />
                        <div className="text-xs opacity-40 mt-1">© {data.year} All rights reserved</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
