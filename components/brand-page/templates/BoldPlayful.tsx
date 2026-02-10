"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface BoldPlayfulProps {
    brandPage: BrandPage;
}

export default function BoldPlayful({ brandPage }: BoldPlayfulProps) {
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

    // Helper to check if section is enabled
    const isEnabled = (sectionType: string) => {
        const section = sections.find(s => s.type === sectionType);
        return section?.enabled !== false;
    };

    // Size config with defaults
    const logoLightSize = brandPage.sizeConfig?.logoLightSize || 200;
    const logoDarkSize = brandPage.sizeConfig?.logoDarkSize || 200;
    const iconLightSize = brandPage.sizeConfig?.iconLightSize || 180;
    const iconDarkSize = brandPage.sizeConfig?.iconDarkSize || 180;
    const heroLogoSize = brandPage.heroConfig?.logoSize || 400;
    const headingFontSize = brandPage.sizeConfig?.headingFontSize || 72;
    const bodyFontSize = brandPage.sizeConfig?.bodyFontSize || 18;

    // Custom font styles
    const headingFontStyle = fonts.heading?.name ? { fontFamily: `'${fonts.heading.name}', sans-serif` } : {};
    const bodyFontStyle = fonts.body?.name ? { fontFamily: `'${fonts.body.name}', sans-serif` } : {};

    // Vibrant colors
    const primaryColor = colors.colors?.[0]?.hex || colors.primary || '#FF6B6B';
    const secondaryColor = colors.colors?.[1]?.hex || colors.secondary || '#4ECDC4';

    return (
        <div className="min-h-screen w-full bg-white text-black overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>

            {/* HERO - Bold & Dynamic */}
            {isEnabled('hero') && (
                <section className="min-h-screen flex flex-col justify-center items-center px-8 relative overflow-hidden">
                    {/* Decorative shapes */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="absolute top-20 left-20 w-32 h-32 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <motion.div
                        initial={{ scale: 0, rotate: 20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                        className="absolute bottom-32 right-20 w-48 h-48 rounded-3xl"
                        style={{ backgroundColor: secondaryColor }}
                    />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="absolute top-40 right-1/4 w-16 h-16 rotate-45 bg-yellow-400"
                    />

                    {/* Category label */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute top-8 left-8"
                    >
                        <span className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full">
                            {brandPage.heroConfig?.categoryLabel || "Brand Identity"}
                        </span>
                    </motion.div>

                    {/* Center Logo / Brand Name */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                        className="relative z-10 text-center"
                    >
                        {logos.dark ? (
                            <img
                                src={logos.dark}
                                alt={brandName}
                                className="object-contain mx-auto"
                                style={{ maxWidth: `${heroLogoSize}px`, maxHeight: `${heroLogoSize * 0.5}px` }}
                            />
                        ) : (
                            <h1 className="text-7xl md:text-9xl font-black tracking-tight" style={headingFontStyle}>
                                {brandName}
                            </h1>
                        )}

                        {tagline && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-6 text-xl font-bold"
                                style={{ color: primaryColor, ...bodyFontStyle }}
                            >
                                {tagline}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* Year badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                        className="absolute bottom-8 right-8"
                    >
                        <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center">
                            <span className="text-sm font-black">{brandPage.heroConfig?.year || new Date().getFullYear()}</span>
                        </div>
                    </motion.div>
                </section>
            )}

            {/* STORY - Bold text block */}
            {isEnabled('story') && story && (
                <section className="w-full py-24 px-8" style={{ backgroundColor: primaryColor }}>
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mb-6">
                                About Us
                            </span>
                            <p className="text-2xl md:text-4xl font-bold leading-tight text-white" style={bodyFontStyle}>
                                {story}
                            </p>
                            {brandPage.storyFeaturedImage && (
                                <div className="mt-10">
                                    <img
                                        src={brandPage.storyFeaturedImage}
                                        alt="Featured"
                                        className="w-full h-auto rounded-3xl"
                                    />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* LOGOS - Playful grid */}
            {isEnabled('logo') && (
                <section className="w-full py-24 px-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-12"
                        >
                            <span className="text-8xl font-black" style={{ color: primaryColor }}>01</span>
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black" style={headingFontStyle}>
                                    {textOverrides?.logoShowcaseTitle || "Logo"}
                                </h2>
                                <p className="text-lg text-black/60 mt-2" style={bodyFontStyle}>
                                    {textOverrides?.logoShowcaseSubtitle || "Our visual identity"}
                                </p>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {/* Primary */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="aspect-square rounded-3xl bg-black flex items-center justify-center p-8 col-span-2 row-span-2"
                            >
                                {logos.light ? (
                                    <img
                                        src={logos.light}
                                        alt="Primary"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoLightSize}px`, maxHeight: `${logoLightSize}px` }}
                                    />
                                ) : (
                                    <span className="text-5xl font-black text-white" style={headingFontStyle}>{brandName}</span>
                                )}
                            </motion.div>

                            {/* On color 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="aspect-square rounded-3xl flex items-center justify-center p-6"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {logos.light ? (
                                    <img
                                        src={logos.light}
                                        alt="On Primary"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoLightSize * 0.6}px`, maxHeight: `${logoLightSize * 0.6}px` }}
                                    />
                                ) : (
                                    <span className="text-2xl font-black text-white" style={headingFontStyle}>{brandName}</span>
                                )}
                            </motion.div>

                            {/* On color 2 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="aspect-square rounded-3xl flex items-center justify-center p-6"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                {logos.dark ? (
                                    <img
                                        src={logos.dark}
                                        alt="On Secondary"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoDarkSize * 0.6}px`, maxHeight: `${logoDarkSize * 0.6}px` }}
                                    />
                                ) : (
                                    <span className="text-2xl font-black" style={headingFontStyle}>{brandName}</span>
                                )}
                            </motion.div>

                            {/* Icon variants */}
                            {logos.iconLight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="aspect-square rounded-3xl bg-black/90 flex items-center justify-center p-6"
                                >
                                    <img
                                        src={logos.iconLight}
                                        alt="Icon Light"
                                        className="object-contain"
                                        style={{ maxWidth: `${iconLightSize * 0.6}px`, maxHeight: `${iconLightSize * 0.6}px` }}
                                    />
                                </motion.div>
                            )}

                            {logos.iconDark && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="aspect-square rounded-3xl bg-white border-2 border-black/10 flex items-center justify-center p-6"
                                >
                                    <img
                                        src={logos.iconDark}
                                        alt="Icon Dark"
                                        className="object-contain"
                                        style={{ maxWidth: `${iconDarkSize * 0.6}px`, maxHeight: `${iconDarkSize * 0.6}px` }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* COLORS - Stacked blocks */}
            {isEnabled('colors') && (
                <section className="w-full py-24 px-8 bg-black text-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-12"
                        >
                            <span className="text-8xl font-black" style={{ color: secondaryColor }}>02</span>
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black" style={headingFontStyle}>
                                    {textOverrides?.colorTitle || "Colors"}
                                </h2>
                                {textOverrides?.colorSubtitle && (
                                    <p className="text-lg text-white/60 mt-2" style={bodyFontStyle}>
                                        {textOverrides.colorSubtitle}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            {(colors.colors || []).map((color, index) => (
                                <motion.div
                                    key={color.hex}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-stretch rounded-2xl overflow-hidden"
                                >
                                    <div
                                        className="w-1/3 md:w-1/4 py-8"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <div className="flex-1 bg-white/10 backdrop-blur p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-black" style={bodyFontStyle}>{color.name}</p>
                                            <p className="text-sm font-mono text-white/60 mt-1">{color.hex}</p>
                                        </div>
                                        <div className="text-right text-xs text-white/40 font-mono">
                                            {color.rgb && <p>RGB: {color.rgb}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* TYPOGRAPHY - Dynamic */}
            {isEnabled('typography') && (
                <section className="w-full py-24 px-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-12"
                        >
                            <span className="text-8xl font-black" style={{ color: primaryColor }}>03</span>
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black" style={headingFontStyle}>
                                    {textOverrides?.typographyTitle || "Type"}
                                </h2>
                                {textOverrides?.typographySubtitle && (
                                    <p className="text-lg text-black/60 mt-2" style={bodyFontStyle}>
                                        {textOverrides.typographySubtitle}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Heading */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Headlines</span>
                                <p
                                    className="font-black text-white mt-4"
                                    style={{ ...headingFontStyle, fontSize: `${Math.min(headingFontSize, 128)}px`, lineHeight: 1 }}
                                >
                                    Aa
                                </p>
                                <p className="text-xl font-bold text-white mt-4" style={headingFontStyle}>{fonts.heading?.name || "Poppins"}</p>
                                <div className="mt-6 pt-6 border-t border-white/20">
                                    <p className="text-3xl font-black text-white" style={headingFontStyle}>GO BOLD OR GO HOME!</p>
                                </div>
                                {fonts.heading?.weights && fonts.heading.weights.length > 1 && (
                                    <div className="mt-6 pt-4 border-t border-white/20 flex gap-4">
                                        {fonts.heading.weights.map((weight) => (
                                            <div key={weight} className="text-center">
                                                <div className="text-3xl text-white" style={{ ...headingFontStyle, fontWeight: weight }}>Aa</div>
                                                <p className="text-xs text-white/50 mt-1">{weight}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Body */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="p-8 rounded-3xl"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider text-black/60">Body Text</span>
                                <p
                                    className="font-bold mt-4"
                                    style={{ ...bodyFontStyle, fontSize: `${Math.min(headingFontSize * 0.85, 96)}px`, lineHeight: 1 }}
                                >
                                    Aa
                                </p>
                                <p className="text-xl font-medium mt-4" style={bodyFontStyle}>{fonts.body?.name || "Inter"}</p>
                                <div className="mt-6 pt-6 border-t border-black/20">
                                    <p className="leading-relaxed" style={{ ...bodyFontStyle, fontSize: `${bodyFontSize}px` }}>
                                        The quick brown fox jumps over the lazy dog.
                                    </p>
                                </div>
                                {fonts.body?.weights && fonts.body.weights.length > 1 && (
                                    <div className="mt-6 pt-4 border-t border-black/20 flex gap-4">
                                        {fonts.body.weights.map((weight) => (
                                            <div key={weight} className="text-center">
                                                <div className="text-3xl" style={{ ...bodyFontStyle, fontWeight: weight }}>Aa</div>
                                                <p className="text-xs text-black/50 mt-1">{weight}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Alphabet showcase */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="col-span-1 md:col-span-2 text-center py-8 bg-black rounded-3xl"
                            >
                                <p className="text-4xl md:text-5xl font-black text-white tracking-wider" style={headingFontStyle}>
                                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-white/40 mt-4 tracking-wide" style={headingFontStyle}>
                                    0123456789 !@#$%
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* MOCKUPS - Playful gallery */}
            {isEnabled('mockups') && mockups.length > 0 && (
                <section className="w-full py-24 px-8" style={{ backgroundColor: secondaryColor }}>
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4 mb-12"
                        >
                            <span className="text-8xl font-black text-black">04</span>
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black" style={headingFontStyle}>
                                    {textOverrides?.mockupsTitle || "In Action"}
                                </h2>
                                {textOverrides?.mockupsSubtitle && (
                                    <p className="text-lg text-black/60 mt-2" style={bodyFontStyle}>
                                        {textOverrides.mockupsSubtitle}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mockups.map((mockup, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    whileInView={{ opacity: 1, rotate: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, type: "spring" }}
                                    className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-white"
                                >
                                    <img
                                        src={mockup.url}
                                        alt={mockup.categoryLabel}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER - Fun & Bold */}
            {isEnabled('footer') && (
                <section className="w-full py-24 px-8 bg-black text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", bounce: 0.4 }}
                        >
                            <h2 className="text-5xl md:text-7xl font-black mb-6" style={headingFontStyle}>
                                <span style={{ color: primaryColor }}>{(textOverrides?.footerTitle || "Let's Talk!").split(' ')[0]}</span>{' '}
                                <span style={{ color: secondaryColor }}>{(textOverrides?.footerTitle || "Let's Talk!").split(' ').slice(1).join(' ')}</span>
                            </h2>
                            <p className="text-xl text-white/60 mb-8" style={bodyFontStyle}>
                                {textOverrides?.footerSubtitle || "Ready to make something awesome?"}
                            </p>
                            <a
                                href={`mailto:${textOverrides?.footerEmail || 'hello@example.com'}`}
                                className="inline-block px-8 py-4 rounded-full text-lg font-bold text-black transition-transform hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {textOverrides?.footerEmail || 'Say Hello →'}
                            </a>
                        </motion.div>

                        <div className="mt-24 pt-8 border-t border-white/10 flex justify-between items-center text-sm">
                            <span className="font-bold">{textOverrides?.footerCopyright || `© ${new Date().getFullYear()} ${brandName}`}</span>
                            <div className="flex gap-2">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryColor }} />
                                <span className="w-4 h-4 rounded-full bg-yellow-400" />
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
