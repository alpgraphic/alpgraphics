"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface CorporateIdentityProps {
    brandPage: BrandPage;
}

export default function CorporateIdentity({ brandPage }: CorporateIdentityProps) {
    const {
        brandName,
        tagline,
        story,
        logos,
        fonts,
        colors,
        mockups,
        sections,
        textOverrides
    } = brandPage;

    const isEnabled = (sectionType: string) => {
        const section = sections.find(s => s.type === sectionType);
        return section?.enabled !== false;
    };

    // Size config with defaults (same as other templates for consistency)
    const logoLightSize = brandPage.sizeConfig?.logoLightSize || 200;
    const logoDarkSize = brandPage.sizeConfig?.logoDarkSize || 200;
    const iconLightSize = brandPage.sizeConfig?.iconLightSize || 180;
    const iconDarkSize = brandPage.sizeConfig?.iconDarkSize || 180;
    const heroLogoSize = brandPage.heroConfig?.logoSize || 400;
    const headingFontSize = brandPage.sizeConfig?.headingFontSize || 72;
    const bodyFontSize = brandPage.sizeConfig?.bodyFontSize || 18;

    const headingFontStyle = fonts.heading?.name ? { fontFamily: `'${fonts.heading.name}', sans-serif` } : {};
    const bodyFontStyle = fonts.body?.name ? { fontFamily: `'${fonts.body.name}', sans-serif` } : {};

    const displayLogo = logos.dark || logos.light || logos.iconDark || logos.iconLight;
    const heroTextColor = brandPage.heroConfig?.heroTextColor || '#000000';

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

    const brandColors = colors?.colors || [];

    return (
        <div className="min-h-screen w-full bg-[#fafaf8] text-[#1a1a1a]" style={bodyFontStyle}>

            {/* ===== HERO / KAPAK ===== */}
            {isEnabled('hero') && (
                <section className="min-h-screen flex flex-col justify-between p-12 md:p-20">
                    <motion.div {...fade} className="flex justify-between items-start">
                        <div>
                            {displayLogo && (
                                <img
                                    src={displayLogo}
                                    alt={brandName}
                                    className="object-contain"
                                    style={{ maxHeight: `${heroLogoSize}px`, maxWidth: `${heroLogoSize}px` }}
                                />
                            )}
                        </div>
                        <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: heroTextColor, opacity: 0.5 }}>
                            {brandPage.heroConfig?.year || new Date().getFullYear()}
                        </span>
                    </motion.div>

                    <div className="flex-1 flex flex-col justify-center max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="text-[11px] tracking-[0.3em] uppercase mb-8"
                               style={{ color: brandPage.heroConfig?.categoryLabelColor || heroTextColor, opacity: 0.5 }}>
                                {brandPage.heroConfig?.categoryLabel || "Kurumsal Kimlik"}
                            </p>
                            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-light leading-[1.05] tracking-[-0.02em] mb-8" style={headingFontStyle}>
                                {brandName || 'Brand Name'}
                            </h1>
                            <div className="w-16 h-px bg-[#1a1a1a]/25 mb-8" />
                            <p className="text-lg md:text-xl font-light text-[#1a1a1a]/65 max-w-lg leading-relaxed">
                                {tagline || 'Marka Kimliği & Kullanım Kılavuzu'}
                            </p>
                        </motion.div>
                    </div>

                    <motion.div {...fade} transition={{ delay: 0.6, duration: 1 }} className="flex justify-between items-end">
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: heroTextColor, opacity: 0.4 }}>
                            {brandPage.heroConfig?.copyrightText || `© ${brandName}`}
                        </span>
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: heroTextColor, opacity: 0.4 }}>
                            Brand Identity
                        </span>
                    </motion.div>
                </section>
            )}

            <Divider />

            {/* ===== MARKA HİKAYESİ ===== */}
            {isEnabled('story') && story && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="01" text="Marka Hikayesi" />
                            </motion.div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                                <motion.div {...slideUp} className="lg:col-span-7">
                                    <p className="text-2xl md:text-3xl font-light leading-[1.6] text-[#1a1a1a]/85 tracking-[-0.01em]"
                                       style={{ fontSize: `${bodyFontSize + 6}px` }}>
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

            {/* ===== LOGO SHOWCASE ===== */}
            {isEnabled('logo') && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="02" text="Logo" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                                    {textOverrides?.logoShowcaseTitle || 'Logo Kullanımı'}
                                </h2>
                                <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">
                                    {textOverrides?.logoShowcaseSubtitle || 'Farklı arka planlarda logo versiyonları'}
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a]/10">
                                {/* Dark Logo on Light */}
                                {logos.dark && (
                                    <motion.div {...fade} className="bg-white p-12 md:p-16 flex items-center justify-center min-h-[280px] relative">
                                        <img src={logos.dark} alt="Logo Dark" className="object-contain" style={{ maxWidth: `${logoDarkSize}px`, maxHeight: `${logoDarkSize}px` }} />
                                        <span className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase text-[#1a1a1a]/30">Açık zemin</span>
                                    </motion.div>
                                )}

                                {/* Light Logo on Dark */}
                                {logos.light && (
                                    <motion.div {...fade} transition={{ delay: 0.1 }} className="bg-[#1a1a1a] p-12 md:p-16 flex items-center justify-center min-h-[280px] relative">
                                        <img src={logos.light} alt="Logo Light" className="object-contain" style={{ maxWidth: `${logoLightSize}px`, maxHeight: `${logoLightSize}px` }} />
                                        <span className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase text-white/30">Koyu zemin</span>
                                    </motion.div>
                                )}

                                {/* Icon Light on Dark */}
                                {logos.iconLight && (
                                    <motion.div {...fade} transition={{ delay: 0.2 }} className="bg-[#2a2a2a] p-12 md:p-16 flex items-center justify-center min-h-[220px] relative">
                                        <img src={logos.iconLight} alt="Icon Light" className="object-contain" style={{ maxWidth: `${iconLightSize}px`, maxHeight: `${iconLightSize}px` }} />
                                        <span className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase text-white/30">İkon — Koyu</span>
                                    </motion.div>
                                )}

                                {/* Icon Dark on Light */}
                                {logos.iconDark && (
                                    <motion.div {...fade} transition={{ delay: 0.3 }} className="bg-[#f0efeb] p-12 md:p-16 flex items-center justify-center min-h-[220px] relative">
                                        <img src={logos.iconDark} alt="Icon Dark" className="object-contain" style={{ maxWidth: `${iconDarkSize}px`, maxHeight: `${iconDarkSize}px` }} />
                                        <span className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase text-[#1a1a1a]/30">İkon — Açık</span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </section>
                    <Divider />
                </>
            )}

            {/* ===== RENK PALETİ ===== */}
            {isEnabled('colors') && brandColors.length > 0 && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="03" text="Renkler" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                                    {textOverrides?.colorTitle || 'Renk Paleti'}
                                </h2>
                                <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">
                                    {textOverrides?.colorSubtitle || 'Marka kimliğini oluşturan ana ve destekleyici renkler'}
                                </p>
                            </motion.div>

                            {/* Primary Colors - Large */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1a1a1a]/10 mb-px">
                                {brandColors.slice(0, 4).map((color, idx) => (
                                    <motion.div key={idx} {...fade} transition={{ delay: idx * 0.08, duration: 0.8 }}>
                                        <div className="aspect-[3/2]" style={{ backgroundColor: color.hex }} />
                                        <div className="bg-[#fafaf8] p-5">
                                            <p className="text-[13px] font-medium mb-1">{color.name || `Color ${idx + 1}`}</p>
                                            <p className="text-[11px] font-mono text-[#1a1a1a]/50 uppercase">{color.hex}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Secondary Colors - Smaller */}
                            {brandColors.length > 4 && (
                                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-px bg-[#1a1a1a]/10">
                                    {brandColors.slice(4).map((color, idx) => (
                                        <motion.div key={idx} {...fade} transition={{ delay: (idx + 4) * 0.06, duration: 0.8 }}>
                                            <div className="aspect-square" style={{ backgroundColor: color.hex }} />
                                            <div className="bg-[#fafaf8] p-3">
                                                <p className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase">{color.hex}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                    <Divider />
                </>
            )}

            {/* ===== TİPOGRAFİ ===== */}
            {isEnabled('typography') && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="04" text="Tipografi" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-16" style={headingFontStyle}>
                                    {textOverrides?.typographyTitle || 'Yazı Tipleri'}
                                </h2>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#1a1a1a]/10">
                                {/* Heading Font */}
                                <motion.div {...slideUp} className="bg-[#fafaf8] p-10 md:p-14">
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">Başlık Fontu</span>
                                    <p className="text-5xl md:text-6xl font-light tracking-[-0.03em] mb-6" style={{ ...headingFontStyle, fontSize: `${headingFontSize}px` }}>
                                        Aa
                                    </p>
                                    <p className="text-lg font-medium mb-3" style={headingFontStyle}>{fonts.heading?.name || 'Inter'}</p>
                                    <p className="text-2xl md:text-3xl font-light leading-relaxed text-[#1a1a1a]/70 tracking-[-0.01em]" style={headingFontStyle}>
                                        ABCDEFGHIJKLM<br />abcdefghijklm<br />0123456789
                                    </p>
                                    {fonts.heading?.weights && fonts.heading.weights.length > 0 && (
                                        <div className="flex gap-2 mt-6 flex-wrap">
                                            {fonts.heading.weights.map((w) => (
                                                <span key={w} className="text-[11px] text-[#1a1a1a]/50 py-1.5 px-3 border border-[#1a1a1a]/12">
                                                    {w}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Body Font */}
                                <motion.div {...slideUp} transition={{ delay: 0.1 }} className="bg-[#fafaf8] p-10 md:p-14">
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/45 block mb-6">Gövde Fontu</span>
                                    <p className="text-5xl md:text-6xl font-light tracking-[-0.03em] mb-6" style={{ ...bodyFontStyle, fontSize: `${bodyFontSize * 3}px` }}>
                                        Aa
                                    </p>
                                    <p className="text-lg font-medium mb-3" style={bodyFontStyle}>{fonts.body?.name || 'Inter'}</p>
                                    <p className="text-base leading-relaxed text-[#1a1a1a]/70" style={{ ...bodyFontStyle, fontSize: `${bodyFontSize}px` }}>
                                        Marka kimliği, bir şirketin görsel ve duygusal temsilini oluşturan tüm öğelerin bütünüdür.
                                        Logo, renk paleti, tipografi ve görsel dil birlikte çalışarak tutarlı bir marka deneyimi sunar.
                                    </p>
                                    {fonts.body?.weights && fonts.body.weights.length > 0 && (
                                        <div className="flex gap-2 mt-6 flex-wrap">
                                            {fonts.body.weights.map((w) => (
                                                <span key={w} className="text-[11px] text-[#1a1a1a]/50 py-1.5 px-3 border border-[#1a1a1a]/12">
                                                    {w}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </section>
                    <Divider />
                </>
            )}

            {/* ===== MOCKUPLAR ===== */}
            {isEnabled('mockups') && mockups && mockups.length > 0 && (
                <>
                    <section className="px-12 md:px-20 py-28 md:py-36">
                        <div className="max-w-6xl mx-auto">
                            <motion.div {...slideUp}>
                                <SectionLabel num="05" text="Uygulama" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4" style={headingFontStyle}>
                                    {textOverrides?.mockupsTitle || 'Uygulama Örnekleri'}
                                </h2>
                                <p className="text-[15px] text-[#1a1a1a]/60 mb-16 max-w-lg">
                                    {textOverrides?.mockupsSubtitle || 'Marka kimliğinin farklı mecralarda kullanımı'}
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {mockups.map((mockup, idx) => (
                                    <motion.div
                                        key={idx}
                                        {...fade}
                                        transition={{ delay: idx * 0.08, duration: 0.8 }}
                                        className="group"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden bg-[#f0efeb]">
                                            <img
                                                src={mockup.url}
                                                alt={mockup.categoryLabel || `Mockup ${idx + 1}`}
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

            {/* ===== FOOTER ===== */}
            {isEnabled('footer') && (
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
                                {textOverrides?.footerSubtitle || 'Bu marka kimliği kılavuzu ile tutarlı bir marka deneyimi sunabilirsiniz.'}
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
            )}
        </div>
    );
}
