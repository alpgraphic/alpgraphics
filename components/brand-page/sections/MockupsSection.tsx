"use client";

import { motion } from "framer-motion";

interface MockupsSectionProps {
    mockups: Array<{
        url: string;
        category: string;
        categoryLabel: string;
    }>;
    title?: string;
    subtitle?: string;
    isNight?: boolean;
}

export default function MockupsSection({ mockups, title, subtitle, isNight = false }: MockupsSectionProps) {
    // Group by category
    const grouped = mockups.reduce((acc, mockup) => {
        if (!acc[mockup.categoryLabel]) {
            acc[mockup.categoryLabel] = [];
        }
        acc[mockup.categoryLabel].push(mockup);
        return acc;
    }, {} as Record<string, typeof mockups>);

    return (
        <section className={`w-full py-32 px-8 md:px-20 ${isNight ? 'bg-[#1a1a1a] text-[#f5f3e9]' : 'bg-[#0a0a0a] text-[#f5f3e9]'}`}>
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
                        {title || "Brand in Action"}
                    </h2>
                    <p className="text-lg opacity-50 max-w-3xl mx-auto leading-relaxed mt-4">
                        {subtitle || "See how the brand comes to life across different mediums and applications"}
                    </p>
                </motion.div>

                {/* Mockups by Category */}
                <div className="space-y-16">
                    {Object.entries(grouped).map(([category, items], categoryIndex) => (
                        <div key={category}>
                            <h3 className="text-sm uppercase tracking-widest font-bold opacity-40 mb-8">
                                {category}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {items.map((mockup, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="group"
                                    >
                                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
                                            <img
                                                src={mockup.url}
                                                alt={`${category} mockup`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
