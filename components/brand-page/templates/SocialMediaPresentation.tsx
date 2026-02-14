"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface SocialMediaPresentationProps {
    brandPage: BrandPage;
}

export default function SocialMediaPresentation({ brandPage }: SocialMediaPresentationProps) {
    const {
        brandName,
        tagline,
        story,
        logos,
        fonts,
        mockups,
        sections,
        textOverrides,
        socialMediaStrategy
    } = brandPage;

    const isEnabled = (sectionType: string) => {
        const section = sections.find(s => s.type === sectionType);
        return section?.enabled !== false;
    };

    const heroLogoSize = brandPage.heroConfig?.logoSize || 180;
    const headingFontStyle = fonts.heading?.name ? { fontFamily: `'${fonts.heading.name}', sans-serif` } : {};
    const bodyFontStyle = fonts.body?.name ? { fontFamily: `'${fonts.body.name}', sans-serif` } : {};

    const platformIcons: Record<string, string> = {
        'Instagram': 'Ig', 'TikTok': 'Tk', 'Facebook': 'Fb', 'YouTube': 'Yt', 'Pinterest': 'Pn', 'Threads': 'Th',
    };

    // Defaults
    const goals = socialMediaStrategy?.goals || [
        { title: 'Marka Bilinirliği', description: 'Sosyal medya kanallarında marka görünürlüğünü artırma', icon: '01' },
        { title: 'Topluluk Oluşturma', description: 'Sadık ve etkileşimli bir takipçi kitlesi yaratma', icon: '02' },
        { title: 'Etkileşim Artışı', description: 'Beğeni, yorum ve paylaşım oranlarını yükseltme', icon: '03' },
    ];

    const contentPillars = socialMediaStrategy?.contentPillars || [
        { title: 'Eğitim', description: 'Sektörle ilgili bilgilendirici içerikler, ipuçları ve rehberler', icon: '01' },
        { title: 'İlham', description: 'Motivasyonel içerikler, başarı hikayeleri ve örnekler', icon: '02' },
        { title: 'Tanıtım', description: 'Ürün/hizmet tanıtımları, kampanyalar ve duyurular', icon: '03' },
        { title: 'Etkileşim', description: 'Anketler, sorular, yarışmalar ve topluluk içerikleri', icon: '04' },
    ];

    const platformStrategy = socialMediaStrategy?.platformStrategy || [
        { platform: 'Instagram', tone: 'Görsel, ilham verici', frequency: 'Haftada 5 post + Günlük Story', contentTypes: ['Carousel', 'Reels', 'Hikayeler'], icon: 'Ig' },
    ];

    const hashtagStrategy = socialMediaStrategy?.hashtagStrategy || {
        branded: ['#MarkaAdı', '#MarkaSlogan'],
        industry: ['#SektörHashtag', '#TrendKonu'],
        campaign: ['#KampanyaAdı', '#ÖzelSeri'],
    };

    const calendarData = socialMediaStrategy?.calendarData || [
        { day: 'Pazartesi', platform: 'Instagram', contentType: 'Carousel', description: 'Haftalık ipuçları serisi', time: '10:00', color: '#1a1a1a' },
        { day: 'Salı', platform: 'Instagram', contentType: 'Reels', description: 'Sektör analizi & İnfografik', time: '09:00', color: '#1a1a1a' },
        { day: 'Çarşamba', platform: 'Instagram', contentType: 'Reels', description: 'Kısa video içerik & Sahne arkası', time: '12:00', color: '#1a1a1a' },
        { day: 'Perşembe', platform: 'Instagram', contentType: 'Post', description: 'Bilgi dizisi & Eğitim', time: '11:00', color: '#1a1a1a' },
        { day: 'Cuma', platform: 'Instagram', contentType: 'Hikayeler', description: 'Hafta sonu önerisi & Etkileşim', time: '17:00', color: '#1a1a1a' },
        { day: 'Cumartesi', platform: 'Instagram', contentType: 'Post', description: 'Kullanıcı içeriği paylaşımı', time: '11:00', color: '#1a1a1a' },
        { day: 'Pazar', platform: 'Instagram', contentType: 'Reels', description: 'Haftalık özet & İlham', time: '10:00', color: '#1a1a1a' },
    ];

    const kpiMetrics = socialMediaStrategy?.kpiMetrics || [
        { metric: 'Takipçi Artışı', target: 'Aylık %10', icon: '↑' },
        { metric: 'Etkileşim Oranı', target: '%3-5', icon: '♡' },
        { metric: 'Erişim', target: 'Aylık 50K+', icon: '◎' },
        { metric: 'Web Trafiği', target: 'Aylık %15 artış', icon: '→' },
        { metric: 'Dönüşüm Oranı', target: '%2+', icon: '◆' },
        { metric: 'İçerik Kaydetme', target: 'Post başı 50+', icon: '✦' },
    ];

    const targetAudience = socialMediaStrategy?.targetAudience || [
        { persona: 'Genç Profesyoneller', age: '25-35', interests: ['Teknoloji', 'Kariyer', 'Yaşam Tarzı'], platforms: ['Instagram', 'TikTok'] },
        { persona: 'Girişimciler', age: '30-45', interests: ['İş Dünyası', 'Yenilik', 'Networking'], platforms: ['Instagram'] },
    ];

    const brandVoice = {
        tone: socialMediaStrategy?.brandVoice?.tone || ['Samimi', 'Profesyonel', 'İlham Verici', 'Bilgilendirici'],
        doList: socialMediaStrategy?.brandVoice?.doList || ['Samimi ama profesyonel ol', 'Değer katan içerik paylaş', 'Soru sor, etkileşim kur', 'Görsel kaliteye önem ver'],
        dontList: socialMediaStrategy?.brandVoice?.dontList || ['Aşırı satışçı olma', 'Politik/tartışmalı konulardan kaçın', 'Rakipleri kötüleme', 'Düşük kaliteli görsel kullanma'],
    };

    const mockupCols = socialMediaStrategy?.mockupGridCols || 3;
    const gridColsClass: Record<number, string> = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    // Get the first available logo
    const displayLogo = logos.dark || logos.light || logos.iconDark || logos.iconLight;

    const slideUp = {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as any
    };

    const fade = {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true },
        transition: { duration: 0.8 }
    };

    const Divider = () => <div className="mx-12 md:mx-20 h-px bg-[#1a1a1a]/10" />;

    const SectionLabel = ({ num, text }: { num: string; text: string }) => (
        <span className="text-[11px] tracking-[0.3em] uppercase text-[#1a1a1a]/50 block mb-6">{num} — {text}</span>
    );

    return (
        <div className="min-h-screen w-full bg-[#fafaf8] text-[#1a1a1a]" style={bodyFontStyle}>

            {/* ===== KAPAK ===== */}
            {isEnabled('hero') && (
                <section className="min-h-screen flex flex-col justify-between p-12 md:p-20">
                    <motion.div {...fade} className="flex justify-between items-start">
                        <div>
                            {displayLogo && (
                                <img
                                    src={displayLogo}
                                    alt={brandName}
                                    className="object-contain"
                                    style={{ maxHeight: `${heroLogoSize}px` }}
                                />
                            )}
                        </div>
                        <span className="text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                            {brandPage.heroConfig?.year || new Date().getFullYear()}
                        </span>
                    </motion.div>

                    <div className="flex-1 flex flex-col justify-center max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="text-[11px] tracking-[0.3em] uppercase text-[#1a1a1a]/50 mb-8">
                                {brandPage.heroConfig?.categoryLabel || "Sosyal Medya Stratejisi"}
                            </p>
                            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-light leading-[1.05] tracking-[-0.02em] mb-8" style={headingFontStyle}>
                                {brandName || 'Brand Name'}
                            </h1>
                            <div className="w-16 h-px bg-[#1a1a1a]/25 mb-8" />
                            <p className="text-lg md:text-xl font-light text-[#1a1a1a]/65 max-w-lg leading-relaxed">
                                {tagline || 'Sosyal Medya Stratejisi & İçerik Planlaması'}
                            </p>
                        </motion.div>
                    </div>

                    <motion.div {...fade} transition={{ delay: 0.6, duration: 1 }} className="flex justify-between items-end">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/40">
                            Gizli Belge
                        </span>
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/40">
                            {brandPage.heroConfig?.copyrightText || `© ${brandName}`}
                        </span>
                    </motion.div>
                </section>
            )}

            <Divider />

            {/* ===== HAKKINDA ===== */}
            {isEnabled('story') && story && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="01" text="Hakkında" />
                            </motion.div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                                <motion.div {...slideUp} className="lg:col-span-7">
                                    <p className="text-2xl md:text-3xl font-light leading-[1.6] text-[#1a1a1a]/85 tracking-[-0.01em]">
                                        {story}
                                    </p>
                                </motion.div>
                                <motion.div {...slideUp} transition={{ delay: 0.15 }} className="lg:col-span-5">
                                    {brandPage.storyFeaturedImage ? (
                                        <img src={brandPage.storyFeaturedImage} alt="Brand" className="w-full h-auto" />
                                    ) : displayLogo ? (
                                        <div className="aspect-[4/5] bg-[#f0efeb] flex items-center justify-center p-20">
                                            <img src={displayLogo} alt={brandName} className="object-contain max-w-[140px] max-h-[140px] opacity-20" />
                                        </div>
                                    ) : null}
                                </motion.div>
                            </div>
                        </div>
                    </section>
                    <Divider />
                </>
            )}

            {/* ===== HEDEF KİTLE ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="02" text="Hedef Kitle" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Kime Ulaşıyoruz
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a]/10">
                        {targetAudience.map((persona, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.12, duration: 0.8 }}
                                className="bg-[#fafaf8] p-10 md:p-12"
                            >
                                <div className="flex items-baseline justify-between mb-8">
                                    <h3 className="text-xl font-normal">{persona.persona}</h3>
                                    <span className="text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">{persona.age}</span>
                                </div>
                                <div className="mb-6">
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-3">İlgi Alanları</span>
                                    <div className="flex flex-wrap gap-2">
                                        {persona.interests.map((interest, i) => (
                                            <span key={i} className="text-[12px] text-[#1a1a1a]/70 py-1.5 px-4 border border-[#1a1a1a]/15">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-3">Platformlar</span>
                                    <div className="flex gap-3">
                                        {persona.platforms.map((platform, i) => (
                                            <span key={i} className="text-[12px] text-[#1a1a1a]/65">{platform}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== HEDEFLER ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="03" text="Strateji" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Stratejik Hedefler
                        </h2>
                    </motion.div>

                    <div className="space-y-0">
                        {goals.map((goal, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.1, duration: 0.8 }}
                                className="grid grid-cols-12 gap-6 py-8 border-t border-[#1a1a1a]/10"
                            >
                                <div className="col-span-1">
                                    <span className="text-[12px] text-[#1a1a1a]/40">
                                        {goal.icon || String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="col-span-4">
                                    <h3 className="text-lg font-medium">{goal.title}</h3>
                                </div>
                                <div className="col-span-7">
                                    <p className="text-[15px] leading-relaxed text-[#1a1a1a]/70">{goal.description}</p>
                                </div>
                            </motion.div>
                        ))}
                        <div className="border-t border-[#1a1a1a]/10" />
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== İÇERİK SÜTUNLARI ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="04" text="İçerik" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                            İçerik Sütunları
                        </h2>
                        <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">Tüm içerikler bu kategoriler etrafında şekillenir.</p>
                    </motion.div>

                    <div className="space-y-12">
                        {contentPillars.map((pillar, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.1, duration: 0.8 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12 border-b border-[#1a1a1a]/[0.08] last:border-0 last:pb-0"
                            >
                                <div className="lg:col-span-7">
                                    <span className="text-[11px] tracking-[0.2em] text-[#1a1a1a]/40 block mb-4">
                                        {pillar.icon || String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <h3 className="text-2xl font-normal tracking-[-0.01em] mb-3">{pillar.title}</h3>
                                    <p className="text-[15px] leading-relaxed text-[#1a1a1a]/70">{pillar.description}</p>
                                </div>
                                <div className="lg:col-span-5">
                                    {(pillar as any).image ? (
                                        <img src={(pillar as any).image} alt={pillar.title} className="w-full h-auto aspect-[4/3] object-cover" />
                                    ) : null}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== MARKA SESİ ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="05" text="Ton & Üslup" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Marka Sesi
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
                        <motion.div {...slideUp}>
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">Ses Tonu</span>
                            <div className="space-y-3">
                                {brandVoice.tone.map((t, i) => (
                                    <div key={i} className="text-lg font-light text-[#1a1a1a]/80">{t}</div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div {...slideUp} transition={{ delay: 0.1 }}>
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">Yapılacaklar</span>
                            <div className="space-y-4">
                                {brandVoice.doList.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <span className="text-[#1a1a1a]/30 mt-0.5 shrink-0">+</span>
                                        <span className="text-[14px] leading-relaxed text-[#1a1a1a]/70">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div {...slideUp} transition={{ delay: 0.2 }}>
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">Kaçınılacaklar</span>
                            <div className="space-y-4">
                                {brandVoice.dontList.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <span className="text-[#1a1a1a]/30 mt-0.5 shrink-0">—</span>
                                        <span className="text-[14px] leading-relaxed text-[#1a1a1a]/70">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== İÇERİK ÖRNEKLERİ ===== */}
            {isEnabled('mockups') && mockups && mockups.length > 0 && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="06" text="Görseller" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                                    {textOverrides?.mockupsTitle || 'İçerik Örnekleri'}
                                </h2>
                                <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">
                                    {textOverrides?.mockupsSubtitle || 'Sosyal medyada paylaşılacak içerik örnekleri'}
                                </p>
                            </motion.div>

                            <div className={`grid gap-3 ${gridColsClass[mockupCols] || 'grid-cols-2 md:grid-cols-3'}`}>
                                {mockups.map((mockup, idx) => (
                                    <motion.div
                                        key={idx}
                                        {...fade}
                                        transition={{ delay: idx * 0.08, duration: 0.8 }}
                                        className="group"
                                    >
                                        <div className="aspect-square overflow-hidden bg-[#f0efeb]">
                                            <img
                                                src={mockup.url}
                                                alt={`İçerik ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                            />
                                        </div>
                                        {mockup.categoryLabel && mockup.categoryLabel !== 'General' && (
                                            <p className="mt-3 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/40">
                                                {mockup.categoryLabel}
                                            </p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                    <Divider />
                </>
            )}

            {/* ===== PLATFORM STRATEJİSİ ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="07" text="Platformlar" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Platform Stratejisi
                        </h2>
                    </motion.div>

                    <div className="space-y-0">
                        {platformStrategy.map((platform, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.1, duration: 0.8 }}
                                className="border-t border-[#1a1a1a]/10 py-10"
                            >
                                <div className="grid grid-cols-12 gap-6 items-start">
                                    <div className="col-span-3 flex items-center gap-4">
                                        <span className="text-[11px] text-[#1a1a1a]/40 w-6">
                                            {platformIcons[platform.platform] || '·'}
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-medium">{platform.platform}</h3>
                                            <span className="text-[12px] text-[#1a1a1a]/55">{platform.frequency}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-4">
                                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/40 block mb-2">Üslup</span>
                                        <p className="text-[14px] text-[#1a1a1a]/70 leading-relaxed">{platform.tone}</p>
                                    </div>
                                    <div className="col-span-5">
                                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/40 block mb-3">Formatlar</span>
                                        <div className="flex flex-wrap gap-2">
                                            {platform.contentTypes.map((type, i) => (
                                                <span key={i} className="text-[12px] text-[#1a1a1a]/65 py-1.5 px-4 border border-[#1a1a1a]/12">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <div className="border-t border-[#1a1a1a]/10" />
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== HASHTAG STRATEJİSİ ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="08" text="Keşfedilebilirlik" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Hashtag Stratejisi
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1a1a1a]/10">
                        {[
                            { label: 'Marka', tags: hashtagStrategy.branded || [] },
                            { label: 'Sektör', tags: hashtagStrategy.industry || [] },
                            { label: 'Kampanya', tags: hashtagStrategy.campaign || [] },
                        ].map((group, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.12, duration: 0.8 }}
                                className="bg-[#fafaf8] p-10 md:p-12"
                            >
                                <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">{group.label}</span>
                                <div className="space-y-3">
                                    {group.tags.map((tag, i) => (
                                        <div key={i} className="text-[15px] text-[#1a1a1a]/70">{tag}</div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* ===== İÇERİK TAKVİMİ ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="09" text="Planlama" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                            Haftalık İçerik Takvimi
                        </h2>
                        <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">Her gün için planlanan içerik ve paylaşım detayları.</p>
                    </motion.div>

                    <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[#1a1a1a]/15 mb-0">
                        <span className="col-span-2 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/50 font-medium">Gün</span>
                        <span className="col-span-2 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/50 font-medium">Platform</span>
                        <span className="col-span-2 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/50 font-medium">Format</span>
                        <span className="col-span-5 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/50 font-medium">Açıklama</span>
                        <span className="col-span-1 text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/50 font-medium text-right">Saat</span>
                    </div>

                    {calendarData.map((item, idx) => (
                        <motion.div
                            key={idx}
                            {...fade}
                            transition={{ delay: idx * 0.04, duration: 0.5 }}
                            className="grid grid-cols-12 gap-4 py-5 border-b border-[#1a1a1a]/[0.07] items-center"
                        >
                            <div className="col-span-2">
                                <span className="text-[14px] font-medium">{item.day}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[13px] text-[#1a1a1a]/65">{item.platform}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[11px] text-[#1a1a1a]/60 py-1 px-3 border border-[#1a1a1a]/12 inline-block">
                                    {item.contentType}
                                </span>
                            </div>
                            <div className="col-span-5">
                                <span className="text-[13px] text-[#1a1a1a]/65">{item.description}</span>
                            </div>
                            <div className="col-span-1 text-right">
                                <span className="text-[12px] text-[#1a1a1a]/45 font-mono">{item.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <Divider />

            {/* ===== KPI ===== */}
            <section className="px-12 md:px-20 py-28 md:py-36">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...slideUp}>
                        <SectionLabel num="10" text="Ölçümleme" />
                        <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                            Başarı Metrikleri
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a]/10">
                        {kpiMetrics.map((kpi, idx) => (
                            <motion.div
                                key={idx}
                                {...fade}
                                transition={{ delay: idx * 0.06, duration: 0.8 }}
                                className="bg-[#fafaf8] p-8 md:p-10"
                            >
                                <p className="text-[13px] text-[#1a1a1a]/60 mb-3">{kpi.metric}</p>
                                <p className="text-2xl md:text-3xl font-light tracking-[-0.02em]" style={headingFontStyle}>{kpi.target}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            {isEnabled('footer') && (
                <>
                    <Divider />
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-4xl mx-auto text-center">
                            <motion.div {...slideUp}>
                                {displayLogo && (
                                    <img
                                        src={displayLogo}
                                        alt={brandName}
                                        className="h-8 object-contain mx-auto mb-14 opacity-20"
                                    />
                                )}
                                <h2 className="text-4xl md:text-5xl font-light tracking-[-0.02em] mb-5" style={headingFontStyle}>
                                    {textOverrides?.footerTitle || 'Teşekkürler'}
                                </h2>
                                <p className="text-[15px] text-[#1a1a1a]/60 mb-10 max-w-md mx-auto leading-relaxed">
                                    {textOverrides?.footerSubtitle || 'Bu stratejiyle markanızı sosyal medyada bir adım öne taşıyalım.'}
                                </p>

                                {textOverrides?.footerEmail && (
                                    <a
                                        href={`mailto:${textOverrides.footerEmail}`}
                                        className="inline-block text-[13px] tracking-[0.1em] text-[#1a1a1a]/60 border-b border-[#1a1a1a]/20 pb-1 hover:text-[#1a1a1a] hover:border-[#1a1a1a]/50 transition-all duration-300"
                                    >
                                        {textOverrides.footerEmail}
                                    </a>
                                )}

                                <div className="mt-20">
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/35">
                                        {textOverrides?.footerCopyright || `© ${new Date().getFullYear()} ${brandName}`}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
