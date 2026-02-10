"use client";

import { useAgency, Project } from "@/context/AgencyContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import BlockRenderer from "@/components/editor/BlockRenderer";
import EditorialLuxury from "@/components/brand-page/templates/EditorialLuxury";

export default function ProjectPage() {
    const params = useParams();
    const { projects } = useAgency();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Support both string and numeric IDs
    const rawId = params.id as string;
    const project = projects.find(p => String(p.id) === rawId);

    // Check if this is a brand page project with brandData
    const isBrandPage = project?.category === 'Brand Page' && project?.brandData;

    // If brand page with brandData, render brand template
    if (isBrandPage && project?.brandData) {
        return <EditorialLuxury brandPage={project.brandData} />;
    }

    // Find next and previous projects (exclude internal)
    const publicProjects = projects.filter(p => p.client !== 'Internal');
    const currentIndex = publicProjects.findIndex(p => String(p.id) === rawId);
    const prevProject = currentIndex > 0 ? publicProjects[currentIndex - 1] : null;
    const nextProject = currentIndex < publicProjects.length - 1 ? publicProjects[currentIndex + 1] : null;

    if (!project) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-6xl font-[900] mb-4">404</h1>
                    <p className="text-xl opacity-60 mb-8">Project not found</p>
                    <Link href="/" className="text-lg font-bold underline hover:no-underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // Check if project has page blocks (using page builder)
    const hasPageBlocks = project.pageBlocks && project.pageBlocks.length > 0;

    // If using page builder, render blocks
    if (hasPageBlocks) {
        return (
            <main className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a]">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-20 py-6 flex justify-between items-center bg-[#f5f3e9]/80 backdrop-blur-sm">
                    <Link href="/" className="text-xl font-[900] tracking-tight hover:opacity-60 transition-opacity">
                        alpgraphics
                    </Link>
                    <Link
                        href="/?section=work"
                        className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                    >
                        ← All Projects
                    </Link>
                </header>

                {/* Spacer for fixed header */}
                <div className="h-20" />

                {/* Render Page Blocks */}
                {project.pageBlocks!
                    .sort((a, b) => a.order - b.order)
                    .map(block => (
                        <BlockRenderer
                            key={block.id}
                            block={block}
                            isEditing={false}
                        />
                    ))}

                {/* Navigation */}
                <section className="px-6 md:px-20 py-20 border-t border-current/10">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        {prevProject ? (
                            <Link
                                href={`/projects/${prevProject.id}`}
                                className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all duration-300"
                            >
                                <span className="text-[#a62932] group-hover:-translate-x-1 transition-transform">←</span>
                                <span>{prevProject.title}</span>
                            </Link>
                        ) : <div />}

                        {nextProject ? (
                            <Link
                                href={`/projects/${nextProject.id}`}
                                className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all duration-300"
                            >
                                <span>{nextProject.title}</span>
                                <span className="text-[#a62932] group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        ) : <div />}
                    </div>
                </section>

                {/* Footer */}
                <footer className="px-6 md:px-20 py-12 border-t border-current/10">
                    <div className="max-w-7xl mx-auto flex justify-between items-center text-sm opacity-40">
                        <span>© 2026 Alpgraphics</span>
                        <span>Turkey / Remote</span>
                    </div>
                </footer>
            </main>
        );
    }

    // Legacy layout (no page blocks)
    return (
        <main className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-20 py-6 flex justify-between items-center">
                <Link href="/" className="text-xl font-[900] tracking-tight hover:opacity-60 transition-opacity">
                    alpgraphics
                </Link>
                <Link
                    href="/"
                    className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                >
                    ← All Projects
                </Link>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-6 md:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-7xl mx-auto"
                >
                    {/* Category & Year */}
                    <div className="mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            {project.category} — {project.year}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-[900] tracking-tighter leading-none mb-8">
                        {project.title}
                    </h1>

                    {/* Description */}
                    <p className="text-xl md:text-2xl leading-relaxed opacity-70 max-w-3xl">
                        {project.description}
                    </p>
                </motion.div>
            </section>

            {/* Main Hero Image */}
            <motion.section
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="px-6 md:px-20 pb-20"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/5">
                        <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </motion.section>

            {/* Project Info Grid */}
            <section className="px-6 md:px-20 py-20 border-t border-current/10">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Client</h3>
                        <p className="text-lg font-medium">{project.client}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Year</h3>
                        <p className="text-lg font-medium">{project.year}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Category</h3>
                        <p className="text-lg font-medium">{project.category}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Role</h3>
                        <p className="text-lg font-medium">{project.role || "Art Direction, Design"}</p>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            {project.gallery && project.gallery.length > 0 && (
                <section className="px-6 md:px-20 py-20">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-[900] tracking-tight mb-12">Gallery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {project.gallery
                                .sort((a, b) => a.order - b.order)
                                .map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="cursor-pointer overflow-hidden rounded-lg bg-black/5"
                                        onClick={() => setLightboxImage(item.imageData)}
                                    >
                                        <img
                                            src={item.imageData}
                                            alt={item.caption || project.title}
                                            className="w-full h-auto object-cover"
                                        />
                                        {item.caption && (
                                            <p className="p-4 text-sm opacity-60">{item.caption}</p>
                                        )}
                                    </motion.div>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonial */}
            {project.testimonial && (
                <section className="px-6 md:px-20 py-20 bg-[#1a1a1a] text-[#f5f3e9]">
                    <div className="max-w-4xl mx-auto text-center">
                        <blockquote className="text-2xl md:text-4xl font-[500] leading-relaxed mb-8 italic">
                            "{project.testimonial.quote}"
                        </blockquote>
                        <p className="text-lg font-bold">{project.testimonial.author}</p>
                    </div>
                </section>
            )}

            {/* Navigation */}
            <section className="px-6 md:px-20 py-20 border-t border-current/10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {prevProject ? (
                        <Link
                            href={`/projects/${prevProject.id}`}
                            className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all duration-300"
                        >
                            <span className="text-[#a62932] group-hover:-translate-x-1 transition-transform">←</span>
                            <span>{prevProject.title}</span>
                        </Link>
                    ) : <div />}

                    {nextProject ? (
                        <Link
                            href={`/projects/${nextProject.id}`}
                            className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all duration-300"
                        >
                            <span>{nextProject.title}</span>
                            <span className="text-[#a62932] group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    ) : <div />}
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 md:px-20 py-12 border-t border-current/10">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-sm opacity-40">
                    <span>© 2026 Alpgraphics</span>
                    <span>Turkey / Remote</span>
                </div>
            </footer>

            {/* Lightbox */}
            {lightboxImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 cursor-pointer"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 text-white text-2xl hover:opacity-60 transition-opacity"
                        onClick={() => setLightboxImage(null)}
                    >
                        ✕
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Gallery"
                        className="max-w-full max-h-full object-contain"
                    />
                </motion.div>
            )}
        </main>
    );
}
