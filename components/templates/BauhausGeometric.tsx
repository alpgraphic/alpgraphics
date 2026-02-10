"use client";

import { BrandGuideData } from "@/lib/brandGuideTypes";

interface TemplateProps {
    data: BrandGuideData;
    isEditing: boolean;
    onUpdate: (field: string, value: any) => void;
    onImageUpload: (field: string) => void;
}

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${className} bg-transparent border-b-4 border-dashed border-current/30 focus:border-current focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${className} bg-transparent border-b-4 border-dashed border-current/30 focus:border-current focus:outline-none w-full`} />;
};

const ImageUpload = ({ src, onUpload, aspectRatio = "aspect-square", className = "", isEditing }: any) => {
    if (src) {
        return (
            <div className={`relative ${aspectRatio} ${className} overflow-hidden group`}>
                <img src={src} alt="" className="w-full h-full object-contain" />
                {isEditing && <button onClick={onUpload} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xl">CHANGE</button>}
            </div>
        );
    }
    if (isEditing) {
        return <button onClick={onUpload} className={`${aspectRatio} ${className} border-4 border-dashed border-current/30 flex items-center justify-center hover:border-current/60 hover:bg-current/5 transition-all`}><span className="text-lg font-black">+ IMAGE</span></button>;
    }
    return <div className={`${aspectRatio} ${className} bg-current/10`} />;
};

export default function BauhausGeometric({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    return (
        <div className="bg-[#f5f5dc] text-[#1a1a1a] font-['Futura',sans-serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative overflow-hidden">
                <div className="absolute top-20 right-20 w-64 h-64 bg-[#e63946] rounded-full" />
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#1d3557]" />
                <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-[#f4a261] rotate-45" />
                <div className="absolute bottom-1/3 right-1/3 w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[140px] border-b-[#2a9d8f]" />

                <div className="relative z-10 min-h-screen flex items-center p-20">
                    <div className="max-w-2xl">
                        <ImageUpload src={data.coverLogo} onUpload={() => onImageUpload('coverLogo')} aspectRatio="aspect-square" className="w-32 h-32 mb-12" isEditing={isEditing} />
                        <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BAUHAUS" className="text-[100px] font-black leading-none tracking-tight block" isEditing={isEditing} />
                        <div className="flex items-center gap-8 mt-8">
                            <div className="w-20 h-2 bg-[#e63946]" />
                            <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Form Follows Function" className="text-2xl font-bold uppercase tracking-wider" isEditing={isEditing} />
                        </div>
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="2026" className="text-lg font-bold mt-16 block" isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-20 px-20 bg-[#1d3557] text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-6 gap-4">
                        {['MANIFESTO', 'LOGO', 'COLORS', 'TYPE', 'GRID', 'APPLY'].map((item, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl font-black mb-2">{String(idx + 1).padStart(2, '0')}</div>
                                <div className="text-xs tracking-widest">{item}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== MANIFESTO ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto grid grid-cols-3 gap-16">
                    <div>
                        <div className="w-16 h-16 bg-[#e63946] mb-8" />
                        <span className="text-6xl font-black">01</span>
                    </div>
                    <div className="col-span-2">
                        <h2 className="text-5xl font-black mb-8 uppercase">Manifesto</h2>
                        <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)} placeholder="FORM + FUNCTION = GÜZELLIK. Tasarımda gereksiz süsleme yoktur. Her element bir amaca hizmet eder." className="text-3xl font-bold leading-relaxed uppercase" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== PRINCIPLES ========== */}
            <section className="py-32 px-20 bg-[#e63946] text-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">Principles</h2>
                    <div className="grid grid-cols-3 gap-0">
                        {[
                            { title: 'SIMPLICITY', desc: 'Less is more' },
                            { title: 'GEOMETRY', desc: 'Pure shapes' },
                            { title: 'FUNCTION', desc: 'Purpose first' },
                        ].map((item, idx) => (
                            <div key={idx} className="border-4 border-white p-12">
                                <h3 className="text-3xl font-black mb-4">{item.title}</h3>
                                <p className="text-xl">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 gap-20">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-[#e63946] rounded-full" />
                                <span className="text-6xl font-black">02</span>
                            </div>
                            <h2 className="text-5xl font-black mb-8 uppercase">Logo</h2>
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)} placeholder="Geometrik formlar ve net çizgiler. Her açı hesaplanmış, her oran düşünülmüş." className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                            <div className="mt-12 flex gap-8">
                                <div>
                                    <div className="text-xs font-black mb-2">MIN SIZE</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="40mm" className="text-4xl font-black" isEditing={isEditing} />
                                </div>
                                <div>
                                    <div className="text-xs font-black mb-2">SPACE</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="2X" className="text-4xl font-black" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-12 border-4 border-black">
                            <ImageUpload src={data.primaryLogo} onUpload={() => onImageUpload('primaryLogo')} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== LOGO CONSTRUCTION ========== */}
            <section className="py-32 px-20 bg-[#f4a261]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">Logo Grid</h2>
                    <div className="bg-white p-8 border-4 border-black">
                        <div className="aspect-video bg-gray-100 relative">
                            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6">
                                {Array(72).fill(0).map((_, i) => (
                                    <div key={i} className="border border-black/10" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== LOGO VARIANTS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-12 h-12 bg-[#1d3557]" />
                        <h2 className="text-5xl font-black uppercase">Variants</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-0">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="border-4 border-black p-8">
                                <ImageUpload src={variant.image} onUpload={() => onImageUpload(`logoVariants.${idx}.image`)} aspectRatio="aspect-square" className="w-full mb-6" isEditing={isEditing} />
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }} placeholder="TYPE" className="text-2xl font-black block uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO DONTS ========== */}
            <section className="py-32 px-20 bg-[#1d3557] text-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">DON'T</h2>
                    <div className="grid grid-cols-4 gap-8">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx}>
                                <div className="aspect-square bg-white/10 border-4 border-[#e63946] flex items-center justify-center text-6xl text-[#e63946] mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }} placeholder="RULE" className="text-sm uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-12 h-12 rounded-full bg-[#2a9d8f]" />
                        <span className="text-6xl font-black">03</span>
                        <h2 className="text-5xl font-black ml-4 uppercase">Colors</h2>
                    </div>
                    <div className="grid grid-cols-5 gap-0 border-4 border-black">
                        {[...data.primaryColors, ...data.secondaryColors].map((color, idx) => (
                            <div key={idx}>
                                <div className="aspect-square" style={{ backgroundColor: color.hex }} />
                                <div className="p-4 bg-white border-t-4 border-black">
                                    <EditableText value={color.name} onChange={(v: string) => {
                                        if (idx < data.primaryColors.length) {
                                            const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n);
                                        } else {
                                            const n = [...data.secondaryColors]; n[idx - data.primaryColors.length] = { ...color, name: v }; onUpdate('secondaryColors', n);
                                        }
                                    }} placeholder="COLOR" className="font-black uppercase block" isEditing={isEditing} />
                                    <div className="text-sm font-mono mt-1">{color.hex}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLOR COMBINATIONS ========== */}
            <section className="py-32 px-20 bg-[#2a9d8f] text-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">Combinations</h2>
                    <div className="grid grid-cols-3 gap-8">
                        <div className="h-40 bg-[#1d3557] border-4 border-white flex items-center justify-center text-xl font-black">NAVY + WHITE</div>
                        <div className="h-40 bg-[#e63946] border-4 border-black flex items-center justify-center text-xl font-black text-white">RED + BLACK</div>
                        <div className="h-40 bg-[#f4a261] border-4 border-[#1d3557] flex items-center justify-center text-xl font-black">ORANGE + NAVY</div>
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-12 h-12 bg-[#e63946] rotate-45" />
                        <span className="text-6xl font-black">04</span>
                        <h2 className="text-5xl font-black ml-4 uppercase">Type</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-0">
                        <div className="border-4 border-black p-16 text-center">
                            <div className="text-[200px] font-black leading-none">A</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })} placeholder="FUTURA" className="text-4xl font-black block mt-8 uppercase" isEditing={isEditing} />
                            <p className="text-xl mt-2">HEADLINES</p>
                        </div>
                        <div className="border-4 border-l-0 border-black p-16 text-center bg-[#1d3557] text-white">
                            <div className="text-[200px] leading-none">A</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })} placeholder="HELVETICA" className="text-4xl font-black block mt-8 uppercase" isEditing={isEditing} />
                            <p className="text-xl mt-2">BODY</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== TYPE SCALE ========== */}
            <section className="py-32 px-20 bg-[#e63946] text-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">Scale</h2>
                    <div className="space-y-0">
                        {[
                            { size: '120px', name: 'DISPLAY' },
                            { size: '72px', name: 'HEADLINE' },
                            { size: '48px', name: 'TITLE' },
                            { size: '24px', name: 'BODY' },
                            { size: '16px', name: 'SMALL' },
                        ].map((item, idx) => (
                            <div key={idx} className="border-b-4 border-white py-4 flex items-baseline gap-8">
                                <span className="text-xl font-mono w-24">{item.size}</span>
                                <span style={{ fontSize: item.size }} className="font-black truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== GRID SYSTEM ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-16">
                        <span className="text-6xl font-black">05</span>
                        <h2 className="text-5xl font-black ml-4 uppercase">Grid</h2>
                    </div>
                    <div className="bg-white border-4 border-black p-8">
                        <div className="grid grid-cols-12 gap-4">
                            {Array(12).fill(0).map((_, i) => (
                                <div key={i} className="h-40 bg-gray-200 flex items-center justify-center font-black">{i + 1}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-32 px-20 bg-[#f4a261]">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-12 h-12 bg-white rounded-full" />
                        <span className="text-6xl font-black">06</span>
                        <h2 className="text-5xl font-black ml-4 uppercase">Apply</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx}>
                                <div className="bg-white p-6 border-4 border-black">
                                    <ImageUpload src={mockup.image} onUpload={() => onImageUpload(`mockups.${idx}.image`)} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }} placeholder="APPLICATION" className="text-xl font-black mt-4 block uppercase" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== STATIONERY ========== */}
            <section className="py-32 px-20 bg-[#1d3557] text-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 uppercase">Stationery</h2>
                    <div className="grid grid-cols-3 gap-8">
                        <div className="aspect-[3/4] bg-white/10 border-4 border-white flex items-center justify-center">CARD</div>
                        <div className="aspect-[3/4] bg-white/10 border-4 border-white flex items-center justify-center">LETTER</div>
                        <div className="aspect-[3/4] bg-white/10 border-4 border-white flex items-center justify-center">ENVELOPE</div>
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-20 px-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="BAUHAUS" className="text-4xl font-black" isEditing={isEditing} />
                    <div className="flex gap-4">
                        <div className="w-8 h-8 bg-[#e63946] rounded-full" />
                        <div className="w-8 h-8 bg-[#f4a261]" />
                        <div className="w-8 h-8 bg-[#2a9d8f] rotate-45" />
                        <div className="w-8 h-8 bg-[#1d3557]" />
                    </div>
                </div>
            </section>
        </div>
    );
}
