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
            <div className={`relative ${aspectRatio} ${className} overflow-hidden group cursor-pointer rounded-3xl`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <img src={src} alt="" className="w-full h-full object-contain" />
                {isEditing && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity rounded-3xl ${isDragging ? 'bg-purple-500 opacity-100' : 'bg-gradient-to-br from-pink-500 to-purple-500 opacity-0 group-hover:opacity-90'}`}>
                        <span className="text-white font-bold">{isDragging ? '🎉 Drop it!' : '🔄 Change'}</span>
                    </div>
                )}
            </div>
        );
    }
    if (isEditing) {
        return (
            <div className={`${aspectRatio} ${className} border-4 border-dashed rounded-3xl ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300'} flex flex-col items-center justify-center cursor-pointer transition-all hover:border-pink-400 hover:rotate-1`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleClick}>
                <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                <span className="text-4xl mb-2">{isDragging ? '🎉' : '📸'}</span>
                <span className="text-sm font-bold text-gray-400">{isDragging ? 'Drop it!' : 'Add image'}</span>
            </div>
        );
    }
    return <div className={`${aspectRatio} ${className} bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl`} />;
};

const EditableText = ({ value, onChange, className, placeholder, multiline = false, isEditing }: any) => {
    if (!isEditing) return <span className={className}>{value || placeholder}</span>;
    if (multiline) {
        return <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={`${className} bg-transparent border-b-4 border-dashed border-pink-200 focus:border-pink-400 focus:outline-none resize-none w-full`} rows={4} />;
    }
    return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`${className} bg-transparent border-b-4 border-dashed border-pink-200 focus:border-pink-400 focus:outline-none w-full`} />;
};

export default function PlayfulCreative({ data, isEditing, onUpdate, onImageUpload }: TemplateProps) {
    const sc = data.sectionColors || {};

    return (
        <div className="bg-[#fff9f5] text-gray-800 font-['Quicksand','Nunito',system-ui,sans-serif]">

            {/* ========== COVER ========== */}
            <section className="min-h-screen relative overflow-hidden" style={{ background: sc.coverBg || 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)' }}>
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />

                {/* Floating shapes */}
                <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute bottom-40 right-32 w-24 h-24 bg-white/20 rotate-45" style={{ animation: 'spin 10s linear infinite' }} />
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/30 rounded-full" />

                <div className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center p-20 text-white">
                    <span className="text-6xl mb-8">✨</span>
                    <DragImage src={data.coverLogo} field="coverLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-28 h-28 mb-8" isEditing={isEditing} />
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="FUNKY!" className="text-7xl font-black block mb-4 drop-shadow-lg" isEditing={isEditing} />
                    <EditableText value={data.tagline} onChange={(v: string) => onUpdate('tagline', v)} placeholder="Make it POP! 🎨" className="text-2xl font-bold block" isEditing={isEditing} />
                    <div className="mt-12 flex gap-4">
                        {['🌈', '⚡', '🎪', '🎭'].map((emoji, idx) => (
                            <span key={idx} className="text-3xl animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>{emoji}</span>
                        ))}
                    </div>
                    <div className="mt-12 px-6 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold">
                        <EditableText value={data.year} onChange={(v: string) => onUpdate('year', v)} placeholder="✌️ 2026" isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== TOC ========== */}
            <section className="py-16 px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-8">What's Inside? 🎁</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            { emoji: '💡', label: 'Story' },
                            { emoji: '🎨', label: 'Logo' },
                            { emoji: '🌈', label: 'Colors' },
                            { emoji: '✏️', label: 'Fonts' },
                            { emoji: '📸', label: 'Photos' },
                            { emoji: '🚀', label: 'Apps' },
                        ].map((item, idx) => (
                            <div key={idx} className="px-6 py-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="font-bold">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== STORY ========== */}
            <section className="py-24 px-8" style={{ background: sc.sectionBg1 || '#fff9f5' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-6xl block mb-8">💡</span>
                    <h2 className="text-5xl font-black mb-8">Our Story</h2>
                    <EditableText value={data.missionText} onChange={(v: string) => onUpdate('missionText', v)}
                        placeholder="Her proje bir macera! Yaratıcılık sınır tanımaz, renkler sonsuz, fikirler uçuşur. Haydi birlikte eğlenceli bir şeyler yapalım! 🎉"
                        className="text-xl leading-relaxed" multiline isEditing={isEditing} />
                </div>
            </section>

            {/* ========== MISSION/VISION ========== */}
            <section className="py-24 px-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                    <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl">
                        <span className="text-4xl block mb-6">🎯</span>
                        <h3 className="text-2xl font-black mb-4">Mission</h3>
                        <EditableText value={data.missionTitle} onChange={(v: string) => onUpdate('missionTitle', v)}
                            placeholder="Sıkıcılığı yok etmek! 💥 Her projede neşe ve enerji!"
                            className="text-lg leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl">
                        <span className="text-4xl block mb-6">🌟</span>
                        <h3 className="text-2xl font-black mb-4">Vision</h3>
                        <EditableText value={data.imageStyle} onChange={(v: string) => onUpdate('imageStyle', v)}
                            placeholder="Dünyanın en eğlenceli markası olmak! 🚀"
                            className="text-lg leading-relaxed" multiline isEditing={isEditing} />
                    </div>
                </div>
            </section>

            {/* ========== VALUES ========== */}
            <section className="py-24 px-8" style={{ background: sc.sectionBg2 || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">Our Values ❤️</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { emoji: '🎨', title: 'Creative', color: 'from-pink-400 to-red-400' },
                            { emoji: '⚡', title: 'Energetic', color: 'from-yellow-400 to-orange-400' },
                            { emoji: '🤝', title: 'Friendly', color: 'from-green-400 to-teal-400' },
                            { emoji: '🌟', title: 'Unique', color: 'from-purple-400 to-indigo-400' },
                        ].map((value, idx) => (
                            <div key={idx} className={`bg-gradient-to-br ${value.color} p-8 rounded-3xl text-white text-center hover:scale-105 hover:rotate-2 transition-all`}>
                                <span className="text-5xl block mb-4">{value.emoji}</span>
                                <h3 className="text-xl font-black">{value.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== LOGO ========== */}
            <section className="py-24 px-8 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center">🎨 Our Logo</h2>
                    <div className="grid grid-cols-2 gap-16">
                        <div className="bg-white p-12 rounded-3xl shadow-2xl">
                            <DragImage src={data.primaryLogo} field="primaryLogo" onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <EditableText value={data.logoDescription} onChange={(v: string) => onUpdate('logoDescription', v)}
                                placeholder="Enerjik, eğlenceli ve akılda kalıcı! Logomuz markanın ruhunu yansıtır - dinamik, renkli ve neşeli! 🎉"
                                className="text-xl leading-relaxed mb-8" multiline isEditing={isEditing} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-pink-100 rounded-2xl">
                                    <div className="text-xs text-pink-600 font-bold mb-1">Min Size 📏</div>
                                    <EditableText value={data.minimumSize} onChange={(v: string) => onUpdate('minimumSize', v)} placeholder="40px" className="text-2xl font-black" isEditing={isEditing} />
                                </div>
                                <div className="p-4 bg-purple-100 rounded-2xl">
                                    <div className="text-xs text-purple-600 font-bold mb-1">Clear Space 🌌</div>
                                    <EditableText value={data.clearSpace} onChange={(v: string) => onUpdate('clearSpace', v)} placeholder="2x" className="text-xl font-black" isEditing={isEditing} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== VARIANTS ========== */}
            <section className="py-24 px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">Logo Versions 🔄</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoVariants.map((variant, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-3xl mb-4 group-hover:scale-105 group-hover:rotate-1 transition-all">
                                    <DragImage src={variant.image} field={`logoVariants.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={variant.name} onChange={(v: string) => { const n = [...data.logoVariants]; n[idx] = { ...variant, name: v }; onUpdate('logoVariants', n); }}
                                    placeholder="Version" className="font-bold block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== DONTS ========== */}
            <section className="py-24 px-8 bg-red-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">Don'ts 🙅‍♀️</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.logoDonts.map((dont, idx) => (
                            <div key={idx} className="text-center">
                                <div className="aspect-square bg-white border-4 border-red-200 rounded-3xl flex items-center justify-center text-5xl text-red-300 mb-4">❌</div>
                                <EditableText value={dont.description} onChange={(v: string) => { const n = [...data.logoDonts]; n[idx] = { ...dont, description: v }; onUpdate('logoDonts', n); }}
                                    placeholder="Rule" className="text-sm font-bold text-red-500" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COLORS ========== */}
            <section className="py-24 px-8" style={{ background: sc.accentBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: sc.accentText || 'white' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center">🌈 Colors!</h2>
                    <div className="grid grid-cols-4 gap-6">
                        {data.primaryColors.map((color, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="aspect-square rounded-full mb-4 shadow-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: color.hex }} />
                                <EditableText value={color.name} onChange={(v: string) => { const n = [...data.primaryColors]; n[idx] = { ...color, name: v }; onUpdate('primaryColors', n); }}
                                    placeholder="Color" className="font-black block" isEditing={isEditing} />
                                <div className="text-xs opacity-60 font-mono mt-1">{color.hex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section className="py-24 px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center">✏️ Typography</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-12 bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl text-center">
                            <div className="text-[150px] leading-none font-black text-pink-500">Aa</div>
                            <EditableText value={data.headingFont.name} onChange={(v: string) => onUpdate('headingFont', { ...data.headingFont, name: v })}
                                placeholder="Quicksand" className="text-2xl font-bold block mt-4" isEditing={isEditing} />
                            <p className="text-sm opacity-50 mt-2">Headlines 🎉</p>
                        </div>
                        <div className="p-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl text-center">
                            <div className="text-[150px] leading-none text-blue-500">Aa</div>
                            <EditableText value={data.bodyFont.name} onChange={(v: string) => onUpdate('bodyFont', { ...data.bodyFont, name: v })}
                                placeholder="Nunito" className="text-2xl font-bold block mt-4" isEditing={isEditing} />
                            <p className="text-sm opacity-50 mt-2">Body Text 📖</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== IMAGERY ========== */}
            <section className="py-24 px-8 bg-gradient-to-br from-yellow-100 to-orange-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center">📸 Photo Vibes</h2>
                    <div className="grid grid-cols-3 gap-6">
                        {[0, 1, 2].map((idx) => (
                            <DragImage key={idx} src={data.brandImages?.[idx]} field={`brandImages.${idx}`} onUpload={onImageUpload} aspectRatio="aspect-square" className="w-full shadow-xl" isEditing={isEditing} />
                        ))}
                    </div>
                    <div className="mt-8 flex justify-center gap-4">
                        {['Bright 🌞', 'Colorful 🌈', 'Fun 🎉', 'Dynamic ⚡'].map((tag, idx) => (
                            <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm font-bold shadow">{tag}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== APPLICATIONS ========== */}
            <section className="py-24 px-8 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center">🚀 Applications</h2>
                    <div className="grid grid-cols-3 gap-8">
                        {data.mockups.map((mockup, idx) => (
                            <div key={idx} className="group">
                                <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-4 rounded-3xl group-hover:scale-105 transition-transform">
                                    <DragImage src={mockup.image} field={`mockups.${idx}.image`} onUpload={onImageUpload} aspectRatio="aspect-[4/3]" className="w-full" isEditing={isEditing} />
                                </div>
                                <EditableText value={mockup.label} onChange={(v: string) => { const n = [...data.mockups]; n[idx] = { ...mockup, label: v }; onUpdate('mockups', n); }}
                                    placeholder="App" className="font-bold text-center mt-4 block" isEditing={isEditing} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="py-20 px-8" style={{ background: sc.footerBg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: sc.footerText || 'white' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex justify-center gap-4 mb-8">
                        {['🎨', '⚡', '💜', '✨'].map((emoji, idx) => (
                            <span key={idx} className="text-3xl">{emoji}</span>
                        ))}
                    </div>
                    <EditableText value={data.brandName} onChange={(v: string) => onUpdate('brandName', v)} placeholder="FUNKY!" className="text-4xl font-black block mb-4" isEditing={isEditing} />
                    <EditableText value={data.website || ''} onChange={(v: string) => onUpdate('website', v)} placeholder="funky.fun" className="text-sm opacity-60 block" isEditing={isEditing} />
                    <div className="mt-8 text-sm opacity-40">Made with 💜 • {data.year}</div>
                </div>
            </section>
        </div>
    );
}
