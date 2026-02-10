"use client";

import { motion } from "framer-motion";
import { LogoVariants } from "@/lib/brandPageTypes";

interface SizeConfig {
    logoLightSize?: number;
    logoDarkSize?: number;
    iconLightSize?: number;
    iconDarkSize?: number;
    headingFontSize?: number;
    bodyFontSize?: number;
}

interface LogoShowcaseSectionProps {
    logos: LogoVariants;
    sizeConfig?: SizeConfig;
    title?: string;
    subtitle?: string;
    isNight?: boolean;
}

export default function LogoShowcaseSection({
    logos,
    sizeConfig,
    title,
    subtitle,
    isNight = false
}: LogoShowcaseSectionProps) {
    // Get logo sizes from sizeConfig or use defaults
    const logoLightSize = sizeConfig?.logoLightSize || 200;
    const logoDarkSize = sizeConfig?.logoDarkSize || 200;
    const iconLightSize = sizeConfig?.iconLightSize || 180;
    const iconDarkSize = sizeConfig?.iconDarkSize || 180;

    return (
        <section className={`w-full py-32 px-8 md:px-20 ${isNight ? 'bg-[#0a0a0a] text-[#f5f3e9]' : 'bg-white text-[#1a1a1a]'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-20 text-center"
                >
                    <h2 className="text-5xl md:text-7xl font-[900] tracking-tighter mb-6">
                        {title || "The Brand Mark System"}
                    </h2>
                    <p className="text-lg opacity-50 max-w-3xl mx-auto leading-relaxed mt-4">
                        {subtitle || "Logo variations optimized for different backgrounds and use cases"}
                    </p>
                </motion.div>

                {/* Logo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Primary Logo Light */}
                    {logos.light && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="group"
                        >
                            <div className="bg-[#f5f3e9] rounded-2xl p-16 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={logos.light}
                                    alt="Logo Light"
                                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    style={{ maxHeight: `${logoLightSize}px` }}
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Primary Logo</h4>
                                <p className="text-xs opacity-30 mt-1">Light Backgrounds</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Primary Logo Dark */}
                    {logos.dark && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="group"
                        >
                            <div className="bg-[#1a1a1a] rounded-2xl p-16 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={logos.dark}
                                    alt="Logo Dark"
                                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    style={{ maxHeight: `${logoDarkSize}px` }}
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Primary Logo</h4>
                                <p className="text-xs opacity-30 mt-1">Dark Backgrounds</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Icon Light */}
                    {logos.iconLight && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="group"
                        >
                            <div className="bg-[#f5f3e9] rounded-2xl p-16 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={logos.iconLight}
                                    alt="Icon Light"
                                    className="w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    style={{ maxHeight: `${iconLightSize}px`, maxWidth: `${iconLightSize}px` }}
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Icon Mark</h4>
                                <p className="text-xs opacity-30 mt-1">Light Backgrounds</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Icon Dark */}
                    {logos.iconDark && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="group"
                        >
                            <div className="bg-[#1a1a1a] rounded-2xl p-16 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={logos.iconDark}
                                    alt="Icon Dark"
                                    className="w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    style={{ maxHeight: `${iconDarkSize}px`, maxWidth: `${iconDarkSize}px` }}
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Icon Mark</h4>
                                <p className="text-xs opacity-30 mt-1">Dark Backgrounds</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Grid/Anatomy Images */}
                {(logos.grid || logos.anatomy) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                        {logos.grid && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                <img
                                    src={logos.grid}
                                    alt="Logo Construction Grid"
                                    className="w-full h-auto rounded-2xl border border-current/10"
                                />
                                <p className="text-sm text-center mt-4 opacity-40 uppercase tracking-widest font-mono">
                                    Construction Grid
                                </p>
                            </motion.div>
                        )}

                        {logos.anatomy && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                <img
                                    src={logos.anatomy}
                                    alt="Logo Anatomy"
                                    className="w-full h-auto rounded-2xl border border-current/10"
                                />
                                <p className="text-sm text-center mt-4 opacity-40 uppercase tracking-widest font-mono">
                                    Logo Anatomy
                                </p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
