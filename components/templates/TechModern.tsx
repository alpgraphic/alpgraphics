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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity rounded-2xl ${isDragging ? 'bg-gradient-to-r from-purple-500 to-pink-500 opacity-100' : 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-sm font-semibold">{isDragging ? 'Bırak' : 'Değiştir'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-2 border-dashed rounded-2xl ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-purple-200'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-purple-400`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-purple-400 text-sm">{isDragging ? 'Bırak' : '+ Görsel Yükle'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b-2 border-dashed border-purple-200 focus:border-purple-500 focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b-2 border-dashed border-purple-200 focus:border-purple-500 focus:outline-none w-full`} />;
};

export default function TechModern({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-white text-gray-900 font-['Inter',system-ui,sans-serif]">

            {/* ===== COVER ===== */}
            <section className="min-h-screen relative overflow-hidden" style={{ background: sc.coverBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center p-20" style={{ color: sc.coverText || 'white' }}>
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-24 h-24 mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="TECHFLOW" className="text-7xl font-bold block mb-4" isEditing={isEditing} />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Innovate. Transform. Scale." className="text-xl opacity-80 block mb-8" isEditing={isEditing} />
                    <div className="px-6 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="Brand Guidelines 2026" isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ===== TOC ===== */}
            <section className="py-16 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8">Contents</h2>
                    <div className="flex flex-wrap gap-4">
                        {['Mission', 'Vision', 'Values', 'Logo', 'Colors', 'Typography', 'Imagery', 'Applications'].map((item, idx) => (
                            <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer">{item}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MISSION ===== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-4 block">Our Mission</span>
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Teknolojiyi herkes için erişilebilir kılmak. İnovasyonu hızlandırmak ve dijital dönüşümü demokratikleştirmek..."
                        className="text-3xl leading-relaxed" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ===== VISION ===== */}
            <section className="py-32 px-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                    <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4 block">Mission</span>
                        <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                            placeholder="İnovasyonu hızlandırmak ve dijital geleceği şekillendirmek..."
                            className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4 block">Vision</span>
                        <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                            placeholder="Dünyanın en yenilikçi teknoloji markası olmak..."
                            className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ===== VALUES ===== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12 text-center">Core Values</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { icon: '🚀', title: 'Innovation', color: 'from-purple-500 to-pink-500' },
                            { icon: '⚡', title: 'Speed', color: 'from-orange-400 to-red-500' },
                            { icon: '🎯', title: 'Focus', color: 'from-blue-400 to-purple-500' },
                            { icon: '🤝', title: 'Trust', color: 'from-green-400 to-teal-500' },
                        ].map((value, idx) => (
                            <div key={idx} className={`bg-gradient-to-br ${value.color} p-8 rounded-3xl text-white text-center`}>
                                <span className="text-4xl block mb-4">{value.icon}</span>
                                <h3 className="text-xl font-bold">{value.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== LOGO ===== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">Logo</h2>
                    <div className="grid grid-cols-2 gap-16">
                        <div className="bg-white p-16 rounded-3xl shadow-lg">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Logomuz modern, dinamik ve yenilikçi kimliğimizi yansıtır..."
                                className="text-xl leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-purple-50 p-4 rounded-2xl">
                                    <span className="text-xs text-purple-600 font-bold uppercase mb-1 block">Min Size</span>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="32px" className="text-2xl font-bold" isEditing={isEditing} />
                                </div>
                                <div className="bg-pink-50 p-4 rounded-2xl">
                                    <span className="text-xs text-pink-600 font-bold uppercase mb-1 block">Clear Space</span>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="1.5x" className="text-xl font-bold" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== VARIANTS ===== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12">Logo Variations</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="bg-gray-50 p-8 rounded-2xl mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Version" className="font-semibold block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== DONTS ===== */}
            <section className="py-32 px-20 bg-red-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-red-600">Don'ts</h2>
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

            {/* ===== COLORS ===== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">Color Palette</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square rounded-2xl mb-4 shadow-xl" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="font-bold block" isEditing={isEditing} />
                                <div className="text-xs opacity-60 font-mono mt-1">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TYPOGRAPHY ===== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">Typography</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-white p-12 rounded-3xl shadow-lg text-center">
                            <div className="text-[120px] leading-none font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Inter" className="text-2xl font-bold block mt-8" isEditing={isEditing} />
                            <p className="text-sm opacity-50 mt-2">Headlines</p>
                        </div>
                        <div className="bg-white p-12 rounded-3xl shadow-lg text-center">
                            <div className="text-[120px] leading-none">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Inter" className="text-2xl font-bold block mt-8" isEditing={isEditing} />
                            <p className="text-sm opacity-50 mt-2">Body Text</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== IMAGERY ===== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">Imagery Style</h2>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full shadow-lg" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        {['Vibrant colors', 'Tech-focused', 'Human elements', 'Clean spaces'].map((rule, idx) => (
                            <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">{rule}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== APPLICATIONS ===== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold mb-12">Applications</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="bg-white p-4 rounded-2xl shadow-lg">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="font-semibold text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <section className="py-20 px-20" style={{ background: sc.footerBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: sc.footerText || 'white' }}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-12 h-12" isEditing={isEditing} />
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="TECHFLOW" className="text-2xl font-bold" isEditing={isEditing} />
                    </div>
                    <div className="text-right">
                        <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="techflow.io" className="text-sm opacity-60 block" isEditing={isEditing} />
                        <div className="text-xs opacity-40 mt-1">© {data.year}</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
