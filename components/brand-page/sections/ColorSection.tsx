"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type ColorPalette = Array<{
    name: string;
    hex: string;
    rgb?: string;
    cmyk?: string;
    pantone?: string;
}>;

interface ColorSectionProps {
    colors: ColorPalette;
    title?: string;
    subtitle?: string;
    isNight?: boolean;
}

export default function ColorSection({
    colors,
    title,
    subtitle,
    isNight = false
}: ColorSectionProps) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null);

    const copyToClipboard = (hex: string) => {
        navigator.clipboard.writeText(hex);
        setCopiedColor(hex);
        setTimeout(() => setCopiedColor(null), 2000);
    };

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
                        {title || "Brand Colors"}
                    </h2>
                    <p className="text-lg opacity-50 max-w-3xl mx-auto leading-relaxed mt-4">
                        {subtitle || "A carefully curated palette that embodies the brand's visual identity"}
                    </p>
                </motion.div>

                {/* Color Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {colors.map((color, index) => (
                        <motion.div
                            key={color.hex}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="group cursor-pointer"
                            onClick={() => copyToClipboard(color.hex)}
                        >
                            {/* Color Block */}
                            <div
                                className="aspect-square rounded-2xl mb-6 relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02] shadow-lg"
                                style={{ backgroundColor: color.hex }}
                            >
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    {copiedColor === color.hex ? (
                                        <span className="text-white text-sm font-bold tracking-wider px-4 py-2 bg-black/50 rounded-full backdrop-blur-sm">
                                            Copied!
                                        </span>
                                    ) : (
                                        <span className="text-white text-sm font-bold tracking-wider px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to copy
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Color Info */}
                            <div className="space-y-3">
                                <h4 className="text-2xl font-bold">{color.name}</h4>

                                <div className="space-y-1 text-sm font-mono">
                                    <p className="opacity-60">
                                        <span className="opacity-40 text-[10px] uppercase tracking-wider mr-2">HEX</span>
                                        {color.hex}
                                    </p>
                                    {color.rgb && (
                                        <p className="opacity-60">
                                            <span className="opacity-40 text-[10px] uppercase tracking-wider mr-2">RGB</span>
                                            {color.rgb}
                                        </p>
                                    )}
                                    {color.cmyk && (
                                        <p className="opacity-60">
                                            <span className="opacity-40 text-[10px] uppercase tracking-wider mr-2">CMYK</span>
                                            {color.cmyk}
                                        </p>
                                    )}
                                    {color.pantone && (
                                        <p className="opacity-60">
                                            <span className="opacity-40 text-[10px] uppercase tracking-wider mr-2">PMS</span>
                                            {color.pantone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
