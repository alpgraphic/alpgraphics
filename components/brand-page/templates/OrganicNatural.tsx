"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface OrganicNaturalProps {
    brandPage: BrandPage;
}

export default function OrganicNatural({ brandPage }: OrganicNaturalProps) {
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
    const heroLogoSize = brandPage.heroConfig?.logoSize || 320;
    const headingFontSize = brandPage.sizeConfig?.headingFontSize || 72;
    const bodyFontSize = brandPage.sizeConfig?.bodyFontSize || 18;

    // Custom font styles
    const headingFontStyle = fonts.heading?.name ? { fontFamily: `'${fonts.heading.name}', Georgia, serif` } : { fontFamily: 'Georgia, serif' };
    const bodyFontStyle = fonts.body?.name ? { fontFamily: `'${fonts.body.name}', sans-serif` } : {};

    // Earthy color palette defaults
    const sage = "#7a8b72";
    const terracotta = "#c17f59";
    const warmBrown = "#8b7355";

    return (
        <div className="min-h-screen w-full bg-[#f5f2ed] text-[#3d3d3d]" style={{ fontFamily: 'Georgia, serif' }}>

            {/* HERO - Organic with soft curves */}
            {isEnabled('hero') && (
                <section className="min-h-screen flex flex-col justify-center items-center px-8 relative overflow-hidden">
                    {/* Decorative organic shape */}
                    <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-[#7a8b72]/10 blur-3xl" />
                    <div className="absolute bottom-32 left-16 w-48 h-48 rounded-full bg-[#c17f59]/10 blur-2xl" />

                    {/* Top label */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute top-12 left-1/2 -translate-x-1/2"
                    >
                        <p className="text-xs tracking-[0.3em] text-[#7a8b72] uppercase">
                            {brandPage.heroConfig?.categoryLabel || "Brand Identity"}
                        </p>
                    </motion.div>

                    {/* Center Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10"
                    >
                        {logos.dark ? (
                            <img
                                src={logos.dark}
                                alt={brandName}
                                className="object-contain"
                                style={{ maxWidth: `${heroLogoSize}px`, maxHeight: `${heroLogoSize * 0.5}px` }}
                            />
                        ) : (
                            <h1 className="text-5xl md:text-7xl font-normal tracking-tight italic" style={{ color: warmBrown, ...headingFontStyle }}>
                                {brandName}
                            </h1>
                        )}
                    </motion.div>

                    {/* Tagline */}
                    {tagline && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="mt-8 text-lg text-[#7a8b72] italic"
                            style={bodyFontStyle}
                        >
                            {tagline}
                        </motion.p>
                    )}

                    {/* Year */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="absolute bottom-12 text-xs tracking-widest text-[#8b7355]/60"
                    >
                        Est. {brandPage.heroConfig?.year || new Date().getFullYear()}
                    </motion.p>
                </section>
            )}

            {/* STORY - Warm text block */}
            {isEnabled('story') && story && (
                <section className="w-full py-32 px-8 bg-white">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-px bg-[#7a8b72]" />
                                <span className="text-xs uppercase tracking-[0.2em] text-[#7a8b72]">Our Story</span>
                            </div>
                            <p className="text-2xl md:text-3xl leading-relaxed font-normal italic" style={{ color: warmBrown, ...bodyFontStyle }}>
                                {story}
                            </p>
                            {brandPage.storyFeaturedImage && (
                                <div className="mt-12">
                                    <img
                                        src={brandPage.storyFeaturedImage}
                                        alt="Featured"
                                        className="w-full h-auto rounded-[1.5rem]"
                                    />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* LOGOS - Rounded cards */}
            {isEnabled('logo') && (
                <section className="w-full py-32 px-8">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-xs uppercase tracking-[0.3em] text-[#7a8b72] mb-4 block">01</span>
                            <h2 className="text-4xl md:text-5xl font-normal italic" style={{ color: warmBrown, ...headingFontStyle }}>
                                {textOverrides?.logoShowcaseTitle || "Brand Mark"}
                            </h2>
                            {textOverrides?.logoShowcaseSubtitle && (
                                <p className="text-lg text-[#7a8b72] mt-4" style={bodyFontStyle}>
                                    {textOverrides.logoShowcaseSubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Primary on cream */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="aspect-[4/3] rounded-[2rem] bg-[#f5f2ed] border border-[#7a8b72]/20 flex items-center justify-center p-12"
                            >
                                {logos.dark ? (
                                    <img
                                        src={logos.dark}
                                        alt="Primary"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoDarkSize}px`, maxHeight: `${logoDarkSize * 0.5}px` }}
                                    />
                                ) : (
                                    <span className="text-3xl italic" style={{ color: warmBrown, ...headingFontStyle }}>{brandName}</span>
                                )}
                            </motion.div>

                            {/* Primary on sage */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="aspect-[4/3] rounded-[2rem] flex items-center justify-center p-12"
                                style={{ backgroundColor: sage }}
                            >
                                {logos.light ? (
                                    <img
                                        src={logos.light}
                                        alt="Inverted"
                                        className="object-contain"
                                        style={{ maxWidth: `${logoLightSize}px`, maxHeight: `${logoLightSize * 0.5}px` }}
                                    />
                                ) : (
                                    <span className="text-3xl italic text-white" style={headingFontStyle}>{brandName}</span>
                                )}
                            </motion.div>

                            {/* Icon on terracotta */}
                            {logos.iconLight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="aspect-square rounded-[2rem] flex items-center justify-center p-12"
                                    style={{ backgroundColor: terracotta }}
                                >
                                    <img
                                        src={logos.iconLight}
                                        alt="Icon"
                                        className="object-contain"
                                        style={{ maxWidth: `${iconLightSize}px`, maxHeight: `${iconLightSize}px` }}
                                    />
                                </motion.div>
                            )}

                            {/* Icon on cream */}
                            {logos.iconDark && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="aspect-square rounded-[2rem] bg-white border border-[#7a8b72]/20 flex items-center justify-center p-12"
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

            {/* COLORS - Organic circles */}
            {isEnabled('colors') && (
                <section className="w-full py-32 px-8 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-xs uppercase tracking-[0.3em] text-[#7a8b72] mb-4 block">02</span>
                            <h2 className="text-4xl md:text-5xl font-normal italic" style={{ color: warmBrown, ...headingFontStyle }}>
                                {textOverrides?.colorTitle || "Color Palette"}
                            </h2>
                            {textOverrides?.colorSubtitle && (
                                <p className="text-lg text-[#7a8b72] mt-4" style={bodyFontStyle}>
                                    {textOverrides.colorSubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="flex flex-wrap justify-center gap-8">
                            {(colors.colors || []).map((color, index) => (
                                <motion.div
                                    key={color.hex}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div
                                        className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 shadow-lg"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <p className="text-sm font-medium" style={{ color: warmBrown, ...bodyFontStyle }}>{color.name}</p>
                                    <p className="text-xs text-[#7a8b72] mt-1">{color.hex}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* TYPOGRAPHY */}
            {isEnabled('typography') && (
                <section className="w-full py-32 px-8">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-xs uppercase tracking-[0.3em] text-[#7a8b72] mb-4 block">03</span>
                            <h2 className="text-4xl md:text-5xl font-normal italic" style={{ color: warmBrown, ...headingFontStyle }}>
                                {textOverrides?.typographyTitle || "Typography"}
                            </h2>
                            {textOverrides?.typographySubtitle && (
                                <p className="text-lg text-[#7a8b72] mt-4" style={bodyFontStyle}>
                                    {textOverrides.typographySubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Heading Font */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <p className="text-xs uppercase tracking-[0.2em] text-[#7a8b72] mb-6">Display</p>
                                <p
                                    className="italic mb-4"
                                    style={{ color: warmBrown, ...headingFontStyle, fontSize: `${Math.min(headingFontSize, 128)}px`, lineHeight: 1 }}
                                >
                                    Aa
                                </p>
                                <p className="text-lg" style={{ color: sage, ...headingFontStyle }}>{fonts.heading?.name || "Cormorant Garamond"}</p>
                                <div className="mt-8 text-2xl italic leading-relaxed" style={{ color: warmBrown, ...headingFontStyle }}>
                                    The quick brown fox jumps over the lazy dog
                                </div>
                                {fonts.heading?.weights && fonts.heading.weights.length > 1 && (
                                    <div className="mt-8 flex justify-center gap-6">
                                        {fonts.heading.weights.map((weight) => (
                                            <div key={weight} className="text-center">
                                                <div className="text-4xl" style={{ color: warmBrown, ...headingFontStyle, fontWeight: weight }}>Aa</div>
                                                <p className="text-xs text-[#7a8b72] mt-1">{weight}</p>
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
                                transition={{ delay: 0.1 }}
                                className="text-center"
                            >
                                <p className="text-xs uppercase tracking-[0.2em] text-[#7a8b72] mb-6">Body</p>
                                <p
                                    className="font-normal mb-4"
                                    style={{ color: warmBrown, ...bodyFontStyle, fontSize: `${Math.min(headingFontSize * 0.8, 96)}px`, lineHeight: 1 }}
                                >
                                    Aa
                                </p>
                                <p className="text-lg" style={{ color: sage, ...bodyFontStyle }}>{fonts.body?.name || "Lato"}</p>
                                <div className="mt-8 leading-relaxed" style={{ color: warmBrown, ...bodyFontStyle, fontSize: `${bodyFontSize}px` }}>
                                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                                </div>
                                {fonts.body?.weights && fonts.body.weights.length > 1 && (
                                    <div className="mt-8 flex justify-center gap-6">
                                        {fonts.body.weights.map((weight) => (
                                            <div key={weight} className="text-center">
                                                <div className="text-4xl" style={{ color: warmBrown, ...bodyFontStyle, fontWeight: weight }}>Aa</div>
                                                <p className="text-xs text-[#7a8b72] mt-1">{weight}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* MOCKUPS - Rounded gallery */}
            {isEnabled('mockups') && mockups.length > 0 && (
                <section className="w-full py-32 px-8 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-xs uppercase tracking-[0.3em] text-[#7a8b72] mb-4 block">04</span>
                            <h2 className="text-4xl md:text-5xl font-normal italic" style={{ color: warmBrown, ...headingFontStyle }}>
                                {textOverrides?.mockupsTitle || "In Application"}
                            </h2>
                            {textOverrides?.mockupsSubtitle && (
                                <p className="text-lg text-[#7a8b72] mt-4" style={bodyFontStyle}>
                                    {textOverrides.mockupsSubtitle}
                                </p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mockups.map((mockup, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-lg"
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

            {/* FOOTER */}
            {isEnabled('footer') && (
                <section className="w-full py-32 px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            {/* Decorative element */}
                            <div className="flex justify-center mb-8">
                                <div className="w-16 h-px bg-[#7a8b72]" />
                            </div>

                            <h2 className="text-4xl md:text-5xl font-normal italic mb-8" style={{ color: warmBrown, ...headingFontStyle }}>
                                {textOverrides?.footerTitle || "Thank You"}
                            </h2>
                            <p className="text-[#7a8b72] text-lg mb-4" style={bodyFontStyle}>
                                {textOverrides?.footerSubtitle || "We'd love to hear from you"}
                            </p>
                            <a
                                href={`mailto:${textOverrides?.footerEmail || 'hello@example.com'}`}
                                className="text-lg underline underline-offset-4 hover:no-underline"
                                style={{ color: warmBrown }}
                            >
                                {textOverrides?.footerEmail || 'hello@example.com'}
                            </a>
                        </motion.div>

                        <div className="mt-24 pt-8 border-t border-[#7a8b72]/20 flex justify-between text-xs text-[#7a8b72]">
                            <span>{textOverrides?.footerCopyright || `© ${new Date().getFullYear()} ${brandName}`}</span>
                            <span>Brand Guidelines</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
