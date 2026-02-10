"use client";

import { motion } from "framer-motion";

interface FooterSectionProps {
    brandName: string;
    year?: string;
    contactEmail: string;
    title?: string;
    subtitle?: string;
    copyrightText?: string;  // Custom copyright text
    isNight?: boolean;
}

export default function FooterSection({
    brandName,
    contactEmail,
    year,
    title,
    subtitle,
    copyrightText,
    isNight = false
}: FooterSectionProps) {
    const currentYear = year || new Date().getFullYear().toString();
    const copyright = copyrightText || `© ${currentYear} ${brandName}`;

    return (
        <section className={`w-full py-32 ${isNight ? 'bg-[#0a0a0a] text-[#f5f3e9]' : 'bg-white text-[#1a1a1a]'}`}>
            <div className="w-full px-8 md:px-20">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center"
                    >
                        <h2 className="text-6xl md:text-8xl font-[900] tracking-tighter mb-12">
                            {title || "Thank You"}
                        </h2>

                        <div className="space-y-4 mb-16">
                            <p className="text-lg opacity-60">{subtitle || "Questions? Get in touch"}</p>
                            <a
                                href={`mailto:${contactEmail}`}
                                className="text-xl font-medium hover:opacity-60 transition-opacity inline-block"
                            >
                                {contactEmail}
                            </a>
                        </div>

                        <div className="pt-12 border-t border-current/10 flex justify-between items-center text-sm opacity-40">
                            <span>{copyright}</span>
                            <span className="uppercase tracking-widest text-xs">Brand Guidelines</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
