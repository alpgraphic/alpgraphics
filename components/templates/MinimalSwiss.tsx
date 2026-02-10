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
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'bg-black opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>
                        <span className="text-white text-sm font-bold">{isDragging ? 'Bırak' : 'Değiştir'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-2 border-dashed ${isDragging ? 'border-black bg-black/5' : 'border-current/20'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-current/40`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-sm opacity-40">{isDragging ? 'Bırak' : '+ Görsel Yükle'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gray-100`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${className} bg-transparent border-b border-dashed border-current/30 focus:border-current focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${className} bg-transparent border-b border-dashed border-current/30 focus:border-current focus:outline-none w-full`} />;
};

const SectionHeader = ({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) => (
    <div className="mb-16">
        <span className="text-xs tracking-[0.3em] uppercase opacity-40">{number}</span>
        <h2 className="text-4xl font-bold mt-2">{title}</h2>
        {subtitle && <p className="text-sm opacity-60 mt-2 max-w-xl">{subtitle}</p>}
    </div>
);

export default function MinimalSwiss({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-white text-black font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">

            {/* ========== 01. COVER ========== */}
            <section className="min-h-screen flex flex-col justify-center items-center p-20 relative" style={{ background: sc.coverBg || 'white', color: sc.coverText || 'black' }}>
                <div className="absolute top-10 left-10 text-xs tracking-[0.5em] uppercase opacity-30">Brand Guidelines</div>
                <div className="absolute top-10 right-10 text-xs tracking-[0.5em] uppercase opacity-30">
                    <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="2026" isEditing={isEditing} />
                </div>

                <div className="text-center">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-32 h-32 mx-auto mb-12" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="MARKA" className="text-7xl font-bold tracking-tight block mb-4" isEditing={isEditing} />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Marka Sloganı" className="text-xl tracking-[0.3em] uppercase opacity-50 block" isEditing={isEditing} />
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2"><div className="w-px h-20 bg-black/20" /></div>
            </section>

            {/* ========== 02. TABLE OF CONTENTS ========== */}
            <section className="py-24 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold mb-12">İçindekiler</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {(data.tableOfContents || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/10">
                                <span className="text-xs opacity-30 font-mono">{item.num}</span>
                                <EditableText
                                    value={item.title}
                                    onChange={(v: string) => {
                                        const n = [...(data.tableOfContents || [])];
                                        n[idx] = { ...item, title: v };
                                        onUpdate('tableOfContents', n);
                                    }}
                                    placeholder="Başlık"
                                    className="text-sm font-medium"
                                    isEditing={isEditing}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 03. BRAND STORY ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg1 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="01" title="Marka Hikayesi" subtitle="Markanın nasıl başladığını ve nereye gittiğini anlatın" />
                    <div className="grid grid-cols-2 gap-20">
                        <div>
                            <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)} placeholder="Markanızın hikayesini buraya yazın. Nasıl başladınız? Hangi problemi çözmek istediniz? Yolculuğunuzda neler yaşadınız?" className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div>
                            <DragImage src={data.brandImages?.[0]} field="brandImages.0" onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 04. MISSION & VISION ========== */}
            <section className="py-32 px-20 bg-black text-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="02" title="Misyon & Vizyon" />
                    <div className="grid grid-cols-2 gap-20">
                        <div className="border-l-4 border-white/20 pl-8">
                            <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-4">Misyonumuz</h3>
                            <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)} placeholder="Günlük olarak ne yapıyoruz ve neden yapıyoruz?" className="text-2xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                        <div className="border-l-4 border-white/20 pl-8">
                            <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-4">Vizyonumuz</h3>
                            <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)} placeholder="Gelecekte nereye ulaşmak istiyoruz? Dünyayı nasıl değiştirmek istiyoruz?" className="text-2xl leading-relaxed" multiline isEditing={isEditing} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 05. BRAND VALUES ========== */}
            <section className="py-32 px-20" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="03" title="Marka Değerleri" subtitle="Markanızı tanımlayan temel değerler" />
                    <div className="grid grid-cols-4 gap-8">
                        {(data.values || []).map((value, idx) => (
                            <div key={idx} className="p-8 bg-gray-50 text-center">
                                <div className="text-4xl font-bold mb-4 opacity-10">{String(idx + 1).padStart(2, '0')}</div>
                                <EditableText
                                    value={value.title}
                                    onChange={(v: string) => {
                                        const n = [...(data.values || [])];
                                        n[idx] = { ...value, title: v };
                                        onUpdate('values', n);
                                    }}
                                    placeholder="Değer"
                                    className="text-lg font-bold block mb-3"
                                    isEditing={isEditing}
                                />
                                <EditableText
                                    value={value.description}
                                    onChange={(v: string) => {
                                        const n = [...(data.values || [])];
                                        n[idx] = { ...value, description: v };
                                        onUpdate('values', n);
                                    }}
                                    placeholder="Açıklama"
                                    className="text-sm opacity-60"
                                    isEditing={isEditing}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 06. TARGET AUDIENCE ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="04" title="Hedef Kitle" subtitle="Kiminle konuşuyoruz?" />
                    <div className="grid grid-cols-3 gap-8">
                        {(data.targetAudience || []).map((persona, idx) => (
                            <div key={idx} className="bg-white p-8">
                                <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-6" />
                                <EditableText
                                    value={persona.name}
                                    onChange={(v: string) => {
                                        const n = [...(data.targetAudience || [])];
                                        n[idx] = { ...persona, name: v };
                                        onUpdate('targetAudience', n);
                                    }}
                                    placeholder="Persona"
                                    className="text-lg font-bold text-center block mb-3"
                                    isEditing={isEditing}
                                />
                                <EditableText
                                    value={persona.description}
                                    onChange={(v: string) => {
                                        const n = [...(data.targetAudience || [])];
                                        n[idx] = { ...persona, description: v };
                                        onUpdate('targetAudience', n);
                                    }}
                                    placeholder="Açıklama"
                                    className="text-sm opacity-60 text-center"
                                    isEditing={isEditing}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 07. TONE OF VOICE ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="05" title="Marka Sesi" subtitle="Nasıl konuşuyoruz?" />
                    <div className="grid grid-cols-2 gap-20">
                        <div>
                            <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-6">Biz Böyleyiz</h3>
                            <div className="space-y-4">
                                {(data.toneOfVoice?.doList || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/10">
                                        <span className="text-green-600">✓</span>
                                        <EditableText
                                            value={item}
                                            onChange={(v: string) => {
                                                const n = [...(data.toneOfVoice?.doList || [])];
                                                n[idx] = v;
                                                onUpdate('toneOfVoice', { ...data.toneOfVoice, doList: n });
                                            }}
                                            placeholder="Özellik"
                                            className="flex-1"
                                            isEditing={isEditing}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-6">Böyle Değiliz</h3>
                            <div className="space-y-4">
                                {(data.toneOfVoice?.dontList || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 py-3 border-b border-black/10">
                                        <span className="text-red-600">✕</span>
                                        <EditableText
                                            value={item}
                                            onChange={(v: string) => {
                                                const n = [...(data.toneOfVoice?.dontList || [])];
                                                n[idx] = v;
                                                onUpdate('toneOfVoice', { ...data.toneOfVoice, dontList: n });
                                            }}
                                            placeholder="Özellik"
                                            className="opacity-60"
                                            isEditing={isEditing}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 08. PRIMARY LOGO ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="06" title="Logo" subtitle="Ana logo ve kullanım alanları" />
                    <div className="grid grid-cols-2 gap-20">
                        <div className="bg-white border border-black/5 p-16">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-video" className="w-full" isEditing={isEditing} />
                        </div>
                        <div>
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)} placeholder="Logonuzun tasarım felsefesini ve anlamını açıklayın. Hangi elementler kullanıldı? Neden bu form seçildi?" className="text-lg leading-relaxed" multiline isEditing={isEditing} />
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50">
                                    <div className="text-xs opacity-50 mb-2">Minimum Boyut</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="24mm" className="text-2xl font-bold" isEditing={isEditing} />
                                </div>
                                <div className="p-4 bg-gray-50">
                                    <div className="text-xs opacity-50 mb-2">Koruma Alanı</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="X yüksekliği" className="text-lg" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 09. LOGO VARIANTS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="07" title="Logo Varyasyonları" subtitle="Farklı kullanım senaryoları için logo versiyonları" />
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center">
                                <div className="bg-gray-50 border border-black/5 p-8 mb-4">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }} placeholder="Varyant" className="text-sm font-bold block" isEditing={isEditing} />
                                <EditableText value={variant.description} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, description: v }; onUpdate('logoVariants', n); }} placeholder="Açıklama" className="text-xs opacity-50 mt-1 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 10. LOGO CONSTRUCTION ========== */}
            <section className="py-32 px-20 bg-blue-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="08" title="Logo Yapısı" subtitle="Logonun geometrik yapısı ve oran sistemleri" />
                    <div className="bg-white p-12 border border-black/5">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                            <div className="absolute inset-8 border-2 border-dashed border-blue-300 opacity-50" />
                            <div className="absolute inset-16 border-2 border-dashed border-blue-300 opacity-30" />
                            <div className="text-center text-gray-400">
                                <p className="text-sm">Logo Grid & Yapı</p>
                                <p className="text-xs mt-2 opacity-50">Görsel yüklenebilir</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 11. LOGO RULES ========== */}
            <section className="py-32 px-20 bg-gray-900 text-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="09" title="Logo Kullanım Kuralları" subtitle="Logonun YAPILMAMASI gerekenler" />
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square bg-white/10 flex items-center justify-center text-4xl text-red-500/50 mb-4">✕</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }} placeholder="Kural" className="text-xs opacity-70" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 12. COLORS ========== */}
            <section className="py-32 px-20" style={{ background: sc.accentBg || 'white', color: sc.accentText || 'black' }}>
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="10" title="Renk Paleti" subtitle="Marka renkleri ve kullanım oranları" />
                    <div className="mb-16">
                        <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-6">Primary Renkler</h3>
                        <div className="grid grid-cols-4 gap-6">
                            {data.primaryColors.map((color, idx) => (
                                <div key={idx}>
                                    <div className="aspect-square mb-4" style={{ backgroundColor: color.hex }} />
                                    <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }} placeholder="Renk" className="font-bold block" isEditing={isEditing} />
                                    <div className="text-xs opacity-50 mt-1 font-mono">{color.hex}</div>
                                    {color.rgb && <div className="text-xs opacity-50 font-mono">RGB: {color.rgb}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm tracking-[0.2em] uppercase opacity-50 mb-6">Secondary Renkler</h3>
                        <div className="grid grid-cols-6 gap-4">
                            {data.secondaryColors.map((color, idx) => (
                                <div key={idx}>
                                    <div className="aspect-square mb-3" style={{ backgroundColor: color.hex }} />
                                    <EditableText value={color.name} onChange={(v: string) => { const n = [...data.secondaryColors]; n[idx] = { ...color, name: v }; onUpdate('secondaryColors', n); }} placeholder="Renk" className="text-sm font-bold block" isEditing={isEditing} />
                                    <div className="text-xs opacity-50 font-mono">{color.hex}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 13. COLOR USAGE ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="10.1" title="Renk Kullanım Oranları" />
                    <div className="flex h-24 mb-8">
                        <div className="flex-[60] bg-black flex items-center justify-center text-white text-sm">60% Primary</div>
                        <div className="flex-[30] bg-gray-400 flex items-center justify-center text-white text-sm">30% Secondary</div>
                        <div className="flex-[10] bg-[#a62932] flex items-center justify-center text-white text-sm">10% Accent</div>
                    </div>
                    <p className="text-sm opacity-60">60-30-10 kuralını kullanarak dengeli ve tutarlı tasarımlar oluşturun.</p>
                </div>
            </section>

            {/* ========== 14. TYPOGRAPHY ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="11" title="Tipografi" subtitle="Font sistemleri ve kullanım kuralları" />
                    <div className="grid grid-cols-2 gap-20">
                        <div className="p-12 bg-gray-50">
                            <div className="text-8xl font-bold mb-8">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })} placeholder="Montserrat" className="text-2xl font-bold block mb-2" isEditing={isEditing} />
                            <p className="text-sm opacity-50">Başlıklar & Display</p>
                            <div className="mt-8 text-sm opacity-40 font-mono">
                                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                                abcdefghijklmnopqrstuvwxyz<br />
                                0123456789 !@#$%^&*()
                            </div>
                        </div>
                        <div className="p-12 bg-gray-50">
                            <div className="text-8xl mb-8">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })} placeholder="Inter" className="text-2xl font-bold block mb-2" isEditing={isEditing} />
                            <p className="text-sm opacity-50">Body & Interface</p>
                            <div className="mt-8 text-sm opacity-40 font-mono">
                                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                                abcdefghijklmnopqrstuvwxyz<br />
                                0123456789 !@#$%^&*()
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 15. TYPE SCALE ========== */}
            <section className="py-32 px-20 bg-gray-900 text-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="11.1" title="Yazı Boyutları" />
                    <div className="space-y-6">
                        {[
                            { size: '72px', name: 'Display', weight: 'Bold' },
                            { size: '48px', name: 'H1', weight: 'Bold' },
                            { size: '36px', name: 'H2', weight: 'Semibold' },
                            { size: '24px', name: 'H3', weight: 'Medium' },
                            { size: '18px', name: 'Body Large', weight: 'Regular' },
                            { size: '16px', name: 'Body', weight: 'Regular' },
                            { size: '14px', name: 'Small', weight: 'Regular' },
                            { size: '12px', name: 'Caption', weight: 'Regular' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-baseline gap-8 py-4 border-b border-white/10">
                                <span className="text-sm font-mono opacity-40 w-20">{item.size}</span>
                                <span className="text-sm opacity-40 w-32">{item.weight}</span>
                                <span style={{ fontSize: item.size }} className="font-bold truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 16. PHOTOGRAPHY ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="12" title="Fotoğraf Stili" subtitle="Marka görsel dili ve fotoğraf kuralları" />
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        {(data.photoRules || []).map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-green-600">✓</span>
                                <EditableText
                                    value={rule}
                                    onChange={(v: string) => {
                                        const n = [...(data.photoRules || [])];
                                        n[idx] = v;
                                        onUpdate('photoRules', n);
                                    }}
                                    placeholder="Kural"
                                    className="text-sm"
                                    isEditing={isEditing}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 17. ICON SYSTEM ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="13" title="İkon Sistemi" subtitle="Tutarlı ikon kullanımı için kurallar" />
                    <div className="grid grid-cols-8 gap-6">
                        {['🏠', '📧', '📱', '🔒', '⚙️', '👤', '🔔', '❤️', '📊', '🎯', '💡', '🚀', '📁', '🔍', '➕', '✓'].map((icon, idx) => (
                            <div key={idx} className="aspect-square bg-white border border-black/10 flex items-center justify-center text-2xl">
                                {icon}
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 grid grid-cols-3 gap-8">
                        <div className="p-6 bg-white">
                            <h4 className="font-bold mb-2">Çizgi Kalınlığı</h4>
                            <p className="text-sm opacity-60">2px stroke width</p>
                        </div>
                        <div className="p-6 bg-white">
                            <h4 className="font-bold mb-2">Köşe Yuvarlaklığı</h4>
                            <p className="text-sm opacity-60">4px border radius</p>
                        </div>
                        <div className="p-6 bg-white">
                            <h4 className="font-bold mb-2">Grid Boyutu</h4>
                            <p className="text-sm opacity-60">24x24px</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 18. PATTERNS ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="14" title="Pattern & Doku" subtitle="Marka desenleri ve kullanım alanları" />
                    <div className="grid grid-cols-4 gap-6">
                        <div className="aspect-square bg-gradient-to-br from-black to-gray-800" />
                        <div className="aspect-square" style={{ background: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                        <div className="aspect-square" style={{ background: 'repeating-linear-gradient(0deg, #eee 0, #eee 1px, white 0, white 50%)', backgroundSize: '20px 20px' }} />
                        <div className="aspect-square bg-gray-100" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    </div>
                </div>
            </section>

            {/* ========== 19. SOCIAL MEDIA ========== */}
            <section className="py-32 px-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="15" title="Sosyal Medya" subtitle="Platform bazında görsel kurallar" />
                    <div className="grid grid-cols-3 gap-8">
                        {(data.socialMediaSizes || []).map((item, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur p-8 rounded-xl">
                                <EditableText
                                    value={item.platform}
                                    onChange={(v: string) => {
                                        const n = [...(data.socialMediaSizes || [])];
                                        n[idx] = { ...item, platform: v };
                                        onUpdate('socialMediaSizes', n);
                                    }}
                                    placeholder="Platform"
                                    className="text-xl font-bold block mb-4"
                                    isEditing={isEditing}
                                />
                                <p className="text-sm opacity-70">Post: {item.size}</p>
                                <p className="text-sm opacity-70">Oran: {item.ratio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 20. STATIONERY ========== */}
            <section className="py-32 px-20">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="16" title="Kırtasiye" subtitle="Kartvizit, antetli kağıt, zarf tasarımları" />
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.slice(0, 3).map((mockup, idx) => (
                            <div key={idx}>
                                <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full bg-gray-100" isEditing={isEditing} />
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }} placeholder="Uygulama" className="text-sm font-bold mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== 21. DIGITAL APPLICATIONS ========== */}
            <section className="py-32 px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="17" title="Dijital Uygulamalar" subtitle="Website, mobil app, email tasarımları" />
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-white p-4 shadow-lg">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">Website Mockup</div>
                        </div>
                        <div className="bg-white p-4 shadow-lg">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">Mobile App Mockup</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 22. ACCESSIBILITY ========== */}
            <section className="py-32 px-20 bg-blue-600 text-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader number="18" title="Erişilebilirlik" subtitle="Tüm kullanıcılar için tasarım standartları" />
                    <div className="grid grid-cols-3 gap-8">
                        <div className="bg-white/10 backdrop-blur p-8 rounded-xl">
                            <h4 className="text-xl font-bold mb-4">Renk Kontrastı</h4>
                            <p className="text-sm opacity-70">WCAG AA standardı: 4.5:1 minimum</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur p-8 rounded-xl">
                            <h4 className="text-xl font-bold mb-4">Font Boyutu</h4>
                            <p className="text-sm opacity-70">Minimum 16px body text</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur p-8 rounded-xl">
                            <h4 className="text-xl font-bold mb-4">Alt Text</h4>
                            <p className="text-sm opacity-70">Tüm görsellerde açıklayıcı metin</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== 23. FOOTER ========== */}
            <section className="py-32 px-20" style={{ background: sc.footerBg || 'black', color: sc.footerText || 'white' }}>
                <div className="max-w-6xl mx-auto text-center">
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-20 h-20 mx-auto mb-8 invert" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="Marka" className="text-4xl font-bold block mb-4" isEditing={isEditing} />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="www.marka.com" className="text-sm opacity-50 block mb-8" isEditing={isEditing} />
                    <div className="text-xs opacity-30">© {data.year} {data.brandName}. Tüm hakları saklıdır.</div>
                </div>
            </section>
        </div>
    );
}
