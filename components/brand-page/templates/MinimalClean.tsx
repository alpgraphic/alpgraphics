"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface MinimalCleanProps {
    brandPage: BrandPage;
}

export default function MinimalClean({ brandPage }: MinimalCleanProps) {
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
    const heroLogoSize = brandPage.heroConfig?.logoSize || 300;
    const headingFontSize = brandPage.sizeConfig?.headingFontSize || 72;
    const bodyFontSize = brandPage.sizeConfig?.bodyFontSize || 18;

    // Custom font styles
    const headingFontStyle = fonts.heading?.name ? { fontFamily: `'${fonts.heading.name}', sans-serif` } : {};
    const bodyFontStyle = fonts.body?.name ? { fontFamily: `'${fonts.body.name}', sans-serif` } : {};

    return (
        <div className="min-h-screen w-full bg-white text-black">

            {/* HERO - Ultra Minimal */}
            {isEnabled('hero') && (
                <section className="min-h-screen flex flex-col justify-center items-center px-8 relative">
                    {/* Small brand identifier top */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute top-12 left-1/2 -translate-x-1/2"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-black/40">
                            {brandPage.heroConfig?.categoryLabel || "Brand Guidelines"}
                        </p>
                    </motion.div>

                    {/* Center Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-16"
                    >
                        {logos.dark ? (
                            <img
                                src={logos.dark}
                                alt={brandName}
                                className="object-contain"
                                style={{ maxWidth: `${heroLogoSize}px`, maxHeight: `${heroLogoSize}px` }}
                            />
                        ) : (
                            <h1 className="text-6xl md:text-8xl font-light tracking-tight" style={headingFontStyle}>
                                {brandName}
                            </h1>
                        )}
                    </motion.div>

                    {/* Year */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute bottom-12 text-[10px] tracking-[0.3em] text-black/30"
                    >
                        {brandPage.heroConfig?.year || new Date().getFullYear()}
                    </motion.p>
                </section>
            )}

            {/* STORY - Clean Text Block */}
            {isEnabled('story') && story && (
                <section className="w-full py-40 px-8">
                    <div className="max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        >
                            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-8">
                                About
                            </p>
                            <p className="text-2xl md:text-3xl font-light leading-relaxed text-black/80" style={bodyFontStyle}>
                                {story}
                            </p>
                            {brandPage.storyFeaturedImage && (
                                <div className="mt-12">
                                    <img
                                        src={brandPage.storyFeaturedImage}
                                        alt="Featured"
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* LOGO VARIATIONS - Grid with labels */}
            {isEnabled('logo') && (
                <section className="w-full py-40 px-8 bg-black/[0.02]">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-4">
                                01
                            </p>
                            <h2 className="text-4xl md:text-5xl font-light" style={headingFontStyle}>
                                {textOverrides?.logoShowcaseTitle || "Logo System"}
                            </h2>
                            {textOverrides?.logoShowcaseSubtitle && (
                                <p className="text-lg text-black/40 mt-4" style={bodyFontStyle}>
                                    {textOverrides.logoShowcaseSubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {/* Primary Logo - Light BG */}
                            {logos.dark && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="aspect-square bg-white border border-black/5 flex items-center justify-center p-16"
                                >
                                    <img
                                        src={logos.dark}
                                        alt="Primary"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoDarkSize}px`, maxHeight: `${logoDarkSize}px` }}
                                    />
                                </motion.div>
                            )}

                            {/* Primary Logo - Dark BG */}
                            {logos.light && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="aspect-square bg-black flex items-center justify-center p-16"
                                >
                                    <img
                                        src={logos.light}
                                        alt="Inverted"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoLightSize}px`, maxHeight: `${logoLightSize}px` }}
                                    />
                                </motion.div>
                            )}

                            {/* Fallback if no logos uploaded */}
                            {!logos.dark && !logos.light && (
                                <>
                                    <div className="aspect-square bg-white border border-black/5 flex items-center justify-center p-16">
                                        <span className="text-4xl font-light" style={headingFontStyle}>{brandName}</span>
                                    </div>
                                    <div className="aspect-square bg-black flex items-center justify-center p-16">
                                        <span className="text-4xl font-light text-white" style={headingFontStyle}>{brandName}</span>
                                    </div>
                                </>
                            )}

                            {/* Icon Light */}
                            {logos.iconLight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="aspect-square bg-white border border-black/5 flex items-center justify-center p-20"
                                >
                                    <img
                                        src={logos.iconLight}
                                        alt="Icon"
                                        className="object-contain"
                                        style={{ maxWidth: `${iconLightSize}px`, maxHeight: `${iconLightSize}px` }}
                                    />
                                </motion.div>
                            )}

                            {/* Icon Dark */}
                            {logos.iconDark && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="aspect-square bg-black flex items-center justify-center p-20"
                                >
                                    <img
                                        src={logos.iconDark}
                                        alt="Icon Dark"
                                        className="object-contain"
                                        style={{ maxWidth: `${iconDarkSize}px`, maxHeight: `${iconDarkSize}px` }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* COLORS - Horizontal Strip */}
            {isEnabled('colors') && (
                <section className="w-full py-40 px-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-4">
                                02
                            </p>
                            <h2 className="text-4xl md:text-5xl font-light" style={headingFontStyle}>
                                {textOverrides?.colorTitle || "Color Palette"}
                            </h2>
                            {textOverrides?.colorSubtitle && (
                                <p className="text-lg text-black/40 mt-4" style={bodyFontStyle}>
                                    {textOverrides.colorSubtitle}
                                </p>
                            )}
                        </motion.div>

                        {/* Color strips */}
                        <div className="flex flex-col gap-0">
                            {(colors.colors || []).map((color, index) => (
                                <motion.div
                                    key={color.hex}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-stretch"
                                >
                                    <div
                                        className="w-32 h-24 md:w-48 md:h-32 flex-shrink-0"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <div className="flex-1 border-b border-black/5 flex items-center px-8">
                                        <div>
                                            <p className="text-lg font-light" style={bodyFontStyle}>{color.name}</p>
                                            <p className="text-xs text-black/40 font-mono mt-1">{color.hex}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* TYPOGRAPHY - Clean specimen */}
            {isEnabled('typography') && (
                <section className="w-full py-40 px-8 bg-black/[0.02]">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-4">
                                03
                            </p>
                            <h2 className="text-4xl md:text-5xl font-light" style={headingFontStyle}>
                                {textOverrides?.typographyTitle || "Typography"}
                            </h2>
                            {textOverrides?.typographySubtitle && (
                                <p className="text-lg text-black/40 mt-4" style={bodyFontStyle}>
                                    {textOverrides.typographySubtitle}
                                </p>
                            )}
                        </motion.div>

                        {/* Heading Font */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-24"
                        >
                            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">
                                Primary Typeface
                            </p>
                            <p
                                className="font-light tracking-tight mb-8"
                                style={{ ...headingFontStyle, fontSize: `${Math.min(headingFontSize, 144)}px`, lineHeight: 1 }}
                            >
                                Aa
                            </p>
                            <p className="text-xl font-light text-black/60" style={headingFontStyle}>
                                {fonts.heading?.name || "Helvetica Neue"}
                            </p>
                            <div className="mt-8 text-2xl md:text-3xl font-light tracking-wide text-black/40" style={headingFontStyle}>
                                ABCDEFGHIJKLMNOPQRSTUVWXYZ
                            </div>
                            {fonts.heading?.weights && fonts.heading.weights.length > 1 && (
                                <div className="mt-8 flex gap-8">
                                    {fonts.heading.weights.map((weight) => (
                                        <div key={weight} className="text-center">
                                            <div className="text-4xl mb-1" style={{ ...headingFontStyle, fontWeight: weight }}>Aa</div>
                                            <p className="text-xs text-black/30">{weight}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Body Font */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">
                                Secondary Typeface
                            </p>
                            <p
                                className="font-normal mb-8"
                                style={{ ...bodyFontStyle, fontSize: `${Math.min(headingFontSize * 0.75, 96)}px`, lineHeight: 1 }}
                            >
                                Aa
                            </p>
                            <p className="text-xl font-normal text-black/60" style={bodyFontStyle}>
                                {fonts.body?.name || "Inter"}
                            </p>
                            <div className="mt-6 max-w-3xl" style={{ ...bodyFontStyle, fontSize: `${bodyFontSize}px` }}>
                                <p className="leading-relaxed text-black/60">
                                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                                </p>
                            </div>
                            {fonts.body?.weights && fonts.body.weights.length > 1 && (
                                <div className="mt-8 flex gap-8">
                                    {fonts.body.weights.map((weight) => (
                                        <div key={weight} className="text-center">
                                            <div className="text-4xl mb-1" style={{ ...bodyFontStyle, fontWeight: weight }}>Aa</div>
                                            <p className="text-xs text-black/30">{weight}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* MOCKUPS - Simple grid */}
            {isEnabled('mockups') && mockups.length > 0 && (
                <section className="w-full py-40 px-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 mb-4">
                                04
                            </p>
                            <h2 className="text-4xl md:text-5xl font-light" style={headingFontStyle}>
                                {textOverrides?.mockupsTitle || "Applications"}
                            </h2>
                            {textOverrides?.mockupsSubtitle && (
                                <p className="text-lg text-black/40 mt-4" style={bodyFontStyle}>
                                    {textOverrides.mockupsSubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {mockups.map((mockup, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="aspect-[4/3] bg-black/[0.02] overflow-hidden"
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

            {/* FOOTER - Minimal */}
            {isEnabled('footer') && (
                <section className="w-full py-40 px-8 border-t border-black/5">
                    <div className="max-w-2xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-light mb-8" style={headingFontStyle}>
                                {textOverrides?.footerTitle || "Thank You"}
                            </h2>
                            <p className="text-black/40 text-sm mb-4" style={bodyFontStyle}>
                                {textOverrides?.footerSubtitle || "Questions? Get in touch."}
                            </p>
                            <a
                                href={`mailto:${textOverrides?.footerEmail || 'hello@example.com'}`}
                                className="text-sm underline underline-offset-4 hover:no-underline"
                            >
                                {textOverrides?.footerEmail || 'hello@example.com'}
                            </a>
                        </motion.div>

                        <div className="mt-24 pt-8 border-t border-black/5 flex justify-between text-[10px] text-black/30 uppercase tracking-wider">
                            <span>{textOverrides?.footerCopyright || `© ${new Date().getFullYear()} ${brandName}`}</span>
                            <span>Brand Guidelines</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
