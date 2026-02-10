"use client";

import { motion } from "framer-motion";

interface StorySectionProps {
    story: string;
    featuredImage?: string;
    isNight?: boolean;
}

export default function StorySection({
    story,
    featuredImage,
    isNight = false
}: StorySectionProps) {
    return (
        <section className={`w-full py-32 px-8 md:px-20 ${isNight ? 'bg-[#f5f3e9] text-[#1a1a1a]' : 'bg-[#0a0a0a]/5 text-[#1a1a1a]'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
                    {/* Image Column */}
                    {featuredImage && (
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="lg:col-span-2"
                        >
                            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-black/5">
                                <img
                                    src={featuredImage}
                                    alt="Brand Story"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Content Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className={featuredImage ? "lg:col-span-3" : "lg:col-span-5"}
                    >
                        <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mb-8">
                            The Story
                        </h2>
                        <div className="space-y-6 text-xl md:text-2xl leading-relaxed opacity-80">
                            {story.split('\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
