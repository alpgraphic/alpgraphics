"use client";

import { useState, useCallback, useRef } from 'react';
import { BrandGuideData } from "@/lib/brandGuideTypes";

interface TemplateProps {
    data: BrandGuideData;
    isEditing: boolean;
    onUpdate: (field: string, value: any) => void;
    onImageUpload: (fieldOrFile: string | File, field?: string) => void;
}

// Inline drag-drop image component
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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-[#a62932] opacity-100' : 'bg-black/80 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-xs tracking-widest uppercase">{isDragging ? 'BIRAK' : 'DEĞİŞTİR'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border border-dashed ${isDragging ? 'border-[#a62932] bg-[#a62932]/10' : 'border-white/10'} flex flex-col items-center justify-center cursor-pointer transition-all group hover:border-white/30`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <div className={`w-8 h-8 border ${isDragging ? 'border-[#a62932]' : 'border-white/20 group-hover:border-white/40'} flex items-center justify-center transition-colors`}>
                    <span className={`text-lg ${isDragging ? 'text-[#a62932]' : 'text-white/30 group-hover:text-white/60'}`}>+</span>
                </div>
                <span className="text-[10px] tracking-widest uppercase mt-3 opacity-30 group-hover:opacity-60">{isDragging ? 'BIRAK' : 'SÜRÜKLE'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-white/5`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b border-dashed border-white/10 focus:border-[#a62932] focus:outline-none resize-none w-full transition-colors`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b border-dashed border-white/10 focus:border-[#a62932] focus:outline-none w-full transition-colors`} />;
};

// Minimal Section Divider
const Divider = () => <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />;

// Page Number
const PageNum = ({ num }: { num: string }) => (
    <div className="absolute bottom-8 right-8 text-[10px] tracking-[0.5em] text-white/20">{num}</div>
);

export default function AvantGarde({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    return (
        <div className="bg-[#030303] text-white font-[system-ui,-apple-system,sans-serif] selection:bg-[#a62932] selection:text-white">

            {/* ========== 01. HERO COVER ========== */}
            <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-0 w-[80vw] h-[80vh] bg-gradient-radial from-[#a62932]/20 via-transparent to-transparent blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-[60vw] h-[60vh] bg-gradient-radial from-purple-900/10 via-transparent to-transparent blur-3xl" />
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }} />

                <div className="relative z-10 text-center max-w-4xl px-8">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-20 h-20 mx-auto mb-16" isEditing={isEditing} />

                    <div className="overflow-hidden">
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="AVANT"
                            className="text-[clamp(4rem,15vw,12rem)] font-extralight tracking-[-0.05em] leading-none block" isEditing={isEditing} />
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="w-12 h-px bg-white/20" />
                        <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Redefining boundaries"
                            className="text-xs tracking-[0.5em] uppercase text-white/40" isEditing={isEditing} />
                        <div className="w-12 h-px bg-white/20" />
                    </div>

                    <div className="mt-24 text-[10px] tracking-[0.3em] text-white/20">
                        BRAND GUIDELINES <span className="mx-4">·</span>
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="2026" className="inline" isEditing={isEditing} />
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-white/40" />
                    <span className="text-[8px] tracking-[0.3em] text-white/30">SCROLL</span>
                </div>

                <PageNum num="01" />
            </section>

            {/* ========== 02. ESSENCE ========== */}
            <section className="min-h-screen relative flex items-center py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 md:col-span-5 flex flex-col justify-center">
                            <span className="text-[10px] tracking-[0.5em] text-[#a62932] mb-6">01 — ESSENCE</span>
                            <h2 className="text-5xl md:text-7xl font-extralight leading-[0.9] mb-8">
                                The<br />
                                <span className="italic">Philosophy</span>
                            </h2>
                            <div className="w-16 h-px bg-white/10 mb-8" />
                        </div>
                        <div className="col-span-12 md:col-span-7 flex flex-col justify-center">
                            <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                                placeholder="Minimalizm sadece bir estetik tercih değil, bir düşünce biçimidir. Her detayı sorgular, gereksiz olanı eler, özü ortaya çıkarır. Biz bu felsefeyi markanın DNA'sına işledik."
                                className="text-xl md:text-2xl font-extralight leading-relaxed text-white/70" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
                <PageNum num="02" />
            </section>

            <Divider />

            {/* ========== 03. VISION ========== */}
            <section className="min-h-screen relative py-32 px-8 md:px-20 flex items-center">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-2 gap-px bg-white/5">
                        <div className="bg-[#030303] p-12 md:p-20">
                            <span className="text-[10px] tracking-[0.5em] text-white/30 block mb-8">MISSION</span>
                            <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                                placeholder="Karmaşıklığı basitliğe dönüştürmek. Her projede özü yakalamak ve onu en saf haliyle sunmak."
                                className="text-2xl font-extralight leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="bg-[#030303] p-12 md:p-20">
                            <span className="text-[10px] tracking-[0.5em] text-white/30 block mb-8">VISION</span>
                            <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                                placeholder="Tasarımın geleceğini şekillendirmek. Sınırları zorlamak ve yeni standartlar oluşturmak."
                                className="text-2xl font-extralight leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
                <PageNum num="03" />
            </section>

            {/* ========== 04. VALUES ========== */}
            <section className="min-h-screen relative py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">02 — VALUES</span>

                    <div className="grid grid-cols-4 gap-px bg-white/5">
                        {[
                            { num: '01', title: 'MINIMAL', desc: 'Gereksizi çıkar, özü bırak' },
                            { num: '02', title: 'BOLD', desc: 'Sessizce güçlü, zarif ama kararlı' },
                            { num: '03', title: 'TIMELESS', desc: 'Trendlerin ötesinde, zamansız' },
                            { num: '04', title: 'INNOVATIVE', desc: 'Sınırları zorla, yenilik yap' },
                        ].map((value, idx) => (
                            <div key={idx} className="bg-[#030303] p-8 md:p-12 group hover:bg-white/5 transition-colors">
                                <span className="text-[80px] md:text-[120px] font-extralight leading-none text-white/5 group-hover:text-[#a62932]/20 transition-colors">{value.num}</span>
                                <h3 className="text-lg tracking-[0.2em] mt-4 mb-3">{value.title}</h3>
                                <p className="text-sm text-white/40 font-light">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <PageNum num="04" />
            </section>

            {/* ========== 05. THE MARK ========== */}
            <section className="min-h-screen relative py-32 px-8 md:px-20 bg-white text-black">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">03 — THE MARK</span>

                    <div className="grid grid-cols-12 gap-16">
                        <div className="col-span-12 md:col-span-7">
                            <div className="aspect-square bg-black/5 flex items-center justify-center">
                                <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-2/3" isEditing={isEditing} />
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-5 flex flex-col justify-center">
                            <h2 className="text-5xl font-extralight mb-8">Logo</h2>
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Sembol, markanın özünü tek bir formda ifade eder. Her çizgi bilinçli, her boşluk hesaplanmış."
                                className="text-lg font-light leading-relaxed text-black/60" multiline isEditing={isEditing} />

                            <div className="mt-12 grid grid-cols-2 gap-8">
                                <div>
                                    <span className="text-[10px] tracking-[0.3em] text-black/30 block mb-2">MIN SIZE</span>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="24px"
                                        className="text-3xl font-extralight" isEditing={isEditing} />
                                </div>
                                <div>
                                    <span className="text-[10px] tracking-[0.3em] text-black/30 block mb-2">CLEAR SPACE</span>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="1.5x"
                                        className="text-3xl font-extralight" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <PageNum num="05" />
            </section>

            {/* ========== 06. LOGO VARIANTS ========== */}
            <section className="py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-white/30 block mb-16">LOGO VARIATIONS</span>

                    <div className="grid grid-cols-4 gap-px bg-white/5">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="bg-[#030303] p-8 group">
                                <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full mb-6" isEditing={isEditing} />
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Variant" className="text-xs tracking-[0.3em] block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
                <PageNum num="06" />
            </section>

            {/* ========== 07. LOGO DONTS ========== */}
            <section className="py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">NEVER DO THIS</span>

                    <div className="grid grid-cols-4 gap-8">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="aspect-square border border-white/10 flex items-center justify-center mb-4 relative overflow-hidden">
                                    <span className="text-[200px] font-extralight text-white/5 absolute">✕</span>
                                </div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-[10px] tracking-[0.2em] text-white/40" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* ========== 08. COLOR ========== */}
            <section className="min-h-screen relative py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">04 — COLOR</span>

                    <div className="mb-20">
                        <h3 className="text-xs tracking-[0.3em] text-white/30 mb-8">PRIMARY</h3>
                        <div className="grid grid-cols-4 gap-px">
                            {data.primaryColors.map((color, idx) => (
                                <div key={idx} className="group">
                                    <div className="aspect-[3/2] transition-transform hover:scale-[1.02]" style={{ backgroundColor: color.hex }} />
                                    <div className="py-4">
                                        <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                            placeholder="Color" className="text-sm tracking-[0.2em] block" isEditing={isEditing} />
                                        <span className="text-[10px] font-mono text-white/30 mt-1 block">{color.hex}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs tracking-[0.3em] text-white/30 mb-8">SECONDARY</h3>
                        <div className="grid grid-cols-6 gap-4">
                            {data.secondaryColors.map((color, idx) => (
                                <div key={idx}>
                                    <div className="aspect-square" style={{ backgroundColor: color.hex }} />
                                    <span className="text-[10px] font-mono text-white/30 mt-2 block">{color.hex}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <PageNum num="08" />
            </section>

            {/* ========== 09. TYPOGRAPHY ========== */}
            <section className="min-h-screen relative py-32 px-8 md:px-20 bg-white text-black">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">05 — TYPOGRAPHY</span>

                    <div className="grid grid-cols-2 gap-0">
                        <div className="p-12 md:p-20 border-r border-black/10">
                            <div className="text-[180px] font-extralight leading-none text-black/10">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="System UI" className="text-2xl tracking-[0.1em] block mt-8" isEditing={isEditing} />
                            <span className="text-xs text-black/40 block mt-2">Headlines & Display</span>
                        </div>
                        <div className="p-12 md:p-20">
                            <div className="text-[180px] leading-none text-black/10">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Inter" className="text-2xl tracking-[0.1em] block mt-8" isEditing={isEditing} />
                            <span className="text-xs text-black/40 block mt-2">Body & Interface</span>
                        </div>
                    </div>

                    {/* Type Scale */}
                    <div className="mt-20 border-t border-black/10 pt-20">
                        <h3 className="text-xs tracking-[0.3em] text-black/30 mb-12">TYPE SCALE</h3>
                        {[
                            { size: '6rem', name: 'Display' },
                            { size: '3.5rem', name: 'Heading 1' },
                            { size: '2.5rem', name: 'Heading 2' },
                            { size: '1.5rem', name: 'Heading 3' },
                            { size: '1rem', name: 'Body' },
                            { size: '0.75rem', name: 'Caption' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-baseline py-3 border-b border-black/5">
                                <span className="text-[10px] font-mono text-black/30 w-20">{item.size}</span>
                                <span style={{ fontSize: item.size }} className="font-extralight truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <PageNum num="09" />
            </section>

            {/* ========== 10. IMAGERY ========== */}
            <section className="py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-[#a62932] block mb-16">06 — IMAGERY</span>

                    <div className="grid grid-cols-3 gap-px">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload}
                                aspectRatio="aspect-[3/4]" className="w-full" isEditing={isEditing} />
                        ))}
                    </div>

                    <div className="mt-16 grid grid-cols-3 gap-8">
                        {['High contrast', 'Minimal composition', 'Monochrome or muted'].map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="w-8 h-px bg-white/20" />
                                <span className="text-xs tracking-[0.2em] text-white/60">{rule}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <PageNum num="10" />
            </section>

            {/* ========== 11. APPLICATIONS ========== */}
            <section className="py-32 px-8 md:px-20 bg-[#a62932]">
                <div className="max-w-7xl mx-auto">
                    <span className="text-[10px] tracking-[0.5em] text-white/50 block mb-16">07 — APPLICATIONS</span>

                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx} className="group">
                                <div className="bg-black/20 aspect-[4/3] flex items-center justify-center">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload}
                                        aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="Application" className="text-[10px] tracking-[0.3em] mt-4 block text-white/70" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 12. FOOTER ========== */}
            <section className="py-32 px-8 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center">
                        <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-16 h-16 mb-12 opacity-50" isEditing={isEditing} />

                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="AVANT"
                            className="text-4xl font-extralight tracking-[0.2em] block mb-4" isEditing={isEditing} />

                        <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="avant.studio"
                            className="text-xs tracking-[0.3em] text-white/30 block" isEditing={isEditing} />

                        <div className="mt-16 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="mt-8 text-[10px] tracking-[0.3em] text-white/20">
                            © {data.year} {data.brandName}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
