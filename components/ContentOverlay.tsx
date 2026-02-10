import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAgency, Project } from "@/context/AgencyContext";

export type SectionType = 'work' | 'about' | 'contact' | null;

interface ContentOverlayProps {
    activeSection: SectionType;
    onClose: () => void;
    onSectionChange?: (section: SectionType) => void;
    isNight: boolean;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    },
    exit: { opacity: 0 }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
    }
};

export function ContentOverlay({ activeSection, onClose, onSectionChange, isNight }: ContentOverlayProps) {
    const bgClass = isNight ? "bg-black/95 text-[#f5f3e9]" : "bg-[#f5f3e9]/95 text-[#1a1a1a]";
    const iconColor = isNight ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white';

    return (
        <AnimatePresence>
            {activeSection && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`fixed inset-0 z-50 flex flex-col backdrop-blur-xl ${bgClass}`}
                >
                    {/* Close Button - Premium Position */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 z-50 group flex items-center gap-3"
                    >
                        <span className="uppercase text-xs font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">Close</span>
                        <div className={`p-3 rounded-full border border-current transition-transform duration-500 group-hover:rotate-90 ${iconColor}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                    </button>

                    {/* Mobile Navigation Tabs */}
                    <div className="md:hidden flex gap-6 px-6 pt-20 pb-4 border-b border-current/10">
                        <button
                            onClick={() => onSectionChange?.('work')}
                            className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeSection === 'work' ? 'opacity-100' : 'opacity-40'}`}
                        >
                            Work
                        </button>
                        <button
                            onClick={() => onSectionChange?.('about')}
                            className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeSection === 'about' ? 'opacity-100' : 'opacity-40'}`}
                        >
                            Agency
                        </button>
                        <button
                            onClick={() => onSectionChange?.('contact')}
                            className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeSection === 'contact' ? 'opacity-100' : 'opacity-40'}`}
                        >
                            Contact
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 w-full min-h-0 overflow-y-auto px-6 md:px-20 py-6 md:py-20 md:pt-24">
                        <motion.div
                            key={activeSection}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="max-w-7xl mx-auto w-full"
                        >
                            {/* Dynamic Content */}
                            {activeSection === 'work' && <WorkContent onSectionChange={onSectionChange} />}
                            {activeSection === 'about' && <AboutContent />}
                            {activeSection === 'contact' && <ContactContent />}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function WorkContent({ onSectionChange }: { onSectionChange?: (section: SectionType) => void }) {
    const { projects } = useAgency();

    // Filter Brand Pages - show ONLY published brand pages
    const brandProjects = projects.filter(p => {
        const isBrandPage = p.category === 'Brand Page' || p.category === 'Brand Value';
        const isPublished = p.isPagePublished === true || p.status === 'Completed';

        return isBrandPage && isPublished;
    });

    // Debug: Log filtering details
    console.log('🔍 WorkContent - Filtering brand pages:', {
        totalProjects: projects.length,
        brandPagesFound: projects.filter(p => p.category === 'Brand Page' || p.category === 'Brand Value').length,
        publishedBrandPages: brandProjects.length,
        allProjects: projects.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            isPagePublished: p.isPagePublished,
            status: p.status,
            willShow: (p.category === 'Brand Page' || p.category === 'Brand Value') && (p.isPagePublished === true || p.status === 'Completed')
        }))
    });

    return (
        <div className="flex flex-col relative w-full">
            {/* Header */}
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h2 className="text-6xl md:text-8xl font-[900] tracking-tighter leading-none">
                            Our Work
                        </h2>
                        <p className="text-lg md:text-xl opacity-50 mt-4">
                            Premium brand identity systems for ambitious brands
                        </p>
                    </div>
                </div>
            </div>

            {/* Brand Pages Section */}
            <div className="mt-20">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                    <div>
                        <h3 className="text-4xl md:text-5xl font-[900] tracking-tighter leading-none">
                            Brand Guidelines
                        </h3>
                        <p className="text-base opacity-50 mt-3">
                            Interactive brand identity systems
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Dynamic Brand Pages */}
                    {brandProjects.length > 0 ? (
                        brandProjects.map(project => (
                            <a
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group block"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-[#f5f3e9] to-[#e8e6dc] mb-4 border border-current/5">
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        {/* Use Brand Logo (light or dark), Project Image, or fallback to initials */}
                                        {(project.brandData?.logos?.dark || project.brandData?.logos?.primary || project.brandData?.logos?.light) ? (
                                            <img
                                                src={project.brandData.logos.dark || project.brandData.logos.primary || project.brandData.logos.light}
                                                alt={project.title}
                                                className="w-[70%] h-[70%] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : project.image ? (
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                className="w-[70%] h-[70%] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <span className="text-5xl font-[900] tracking-tighter text-[#1a1a1a]/20 group-hover:text-[#a62932]/40 transition-colors text-center">
                                                {project.title.substring(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {/* Overlay on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                        <span className="text-white text-sm font-bold uppercase tracking-widest">View Guidelines</span>
                                        <span className="text-white text-2xl">↗</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-[800] tracking-tight group-hover:text-[#a62932] transition-colors">
                                        {project.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-current/20 rounded-full">
                                            {project.client || 'Brand Identity'}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-12 opacity-40">
                            <p>No brand pages published yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="mt-16 pt-8 border-t border-current/10 flex justify-between items-center">
                <p className="text-lg opacity-50">Interested in working together?</p>
                <button
                    onClick={() => onSectionChange?.('contact')}
                    className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all duration-300"
                >
                    <span>Get in Touch</span>
                    <span className="text-[#a62932] group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    );
}

function AboutContent() {
    const services = [
        { name: "Brand Identity", desc: "Logo, Guidelines, Visual Systems" },
        { name: "Digital Design", desc: "Web, App, UI/UX" },
        { name: "Art Direction", desc: "Campaigns, Editorial, Motion" },
        { name: "Development", desc: "React, Next.js, 3D/WebGL" },
    ];

    return (
        <div className="flex flex-col">
            <motion.div variants={itemVariants} className="mb-16">
                <h2 className="text-6xl md:text-8xl font-[900] tracking-tighter leading-none">
                    The Studio
                </h2>
                <p className="text-lg md:text-xl opacity-50 mt-4">
                    Independent design practice
                </p>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 flex-1">
                {/* Left Column - Philosophy */}
                <motion.div variants={itemVariants} className="lg:col-span-3 space-y-8">
                    <p className="text-3xl md:text-5xl font-[500] leading-[1.15] tracking-tight">
                        We craft <span className="italic font-serif opacity-60">digital artifacts</span> that bridge the gap between rigorous experimentation and functional design.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-current/10">
                        <p className="text-lg leading-relaxed opacity-70">
                            Operating remotely across Turkey, alpgraphics works at the intersection of technology, typography, and motion. We believe that every pixel should serve a purpose.
                        </p>
                        <p className="text-lg leading-relaxed opacity-70">
                            Our methodology is rooted in the "less but better" philosophy, yet we aren't afraid to break the grid when the narrative demands it.
                        </p>
                    </div>
                </motion.div>

                {/* Right Column - Services */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Services</h3>
                    <div className="space-y-4">
                        {services.map((service, i) => (
                            <div key={i} className="group flex justify-between items-baseline py-4 border-b border-current/10 hover:pl-4 transition-all duration-300">
                                <span className="text-xl font-bold">{service.name}</span>
                                <span className="text-sm opacity-40 group-hover:opacity-100 transition-opacity">{service.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="pt-8 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-[900]">200+</p>
                            <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Projects</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-[900]">11</p>
                            <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Years</p>
                        </div>

                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="mt-auto pt-12 border-t border-current/10 flex justify-between items-end opacity-40 font-mono text-xs uppercase">
                <span>Est. 2014</span>
                <span>Turkey / Remote</span>
            </motion.div>
        </div>
    );
}

function ContactContent() {
    const { addMessage } = useAgency();
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMessage({
            id: Date.now(),
            from: email,
            subject: subject || "New Inquiry",
            content: message,
            date: "Just now",
            read: false,
            type: 'request'
        });
        setSent(true);
        setEmail('');
        setSubject('');
        setMessage('');
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <div className="flex flex-col">
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-16">
                <h2 className="text-6xl md:text-8xl font-[900] tracking-tighter leading-none">
                    Let's Talk
                </h2>
                <p className="text-lg md:text-xl opacity-50 mt-4 max-w-md">
                    Got a project in mind? We'd love to hear about it.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 flex-1">
                {/* Form Section - Takes 3 columns */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Email Field - Required */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    Email Address <span className="text-[#a62932]">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-transparent border-b-2 border-current/10 focus:border-current py-4 text-2xl font-medium focus:outline-none placeholder:opacity-20 transition-colors"
                                />
                            </div>

                            {/* Subject Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    placeholder="What's this about?"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-current/10 focus:border-current py-4 text-2xl font-medium focus:outline-none placeholder:opacity-20 transition-colors"
                                />
                            </div>

                            {/* Message Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    Message <span className="text-[#a62932]">*</span>
                                </label>
                                <textarea
                                    placeholder="Tell us about your project, goals, and timeline..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={5}
                                    className="w-full bg-transparent border-b-2 border-current/10 focus:border-current py-4 text-xl font-medium focus:outline-none placeholder:opacity-20 resize-none transition-colors"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="group mt-8 flex items-center gap-4 text-2xl md:text-3xl font-[800] tracking-tight hover:gap-8 transition-all duration-300"
                            >
                                <span>Send Message</span>
                                <span className="text-[#a62932] group-hover:translate-x-2 transition-transform">→</span>
                            </button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-12"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <span className="text-green-500 text-2xl">✓</span>
                            </div>
                            <h4 className="text-4xl font-bold mb-2">Message Sent</h4>
                            <p className="opacity-60 text-lg">We'll get back to you within 24 hours.</p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Contact Info Section - Takes 2 columns */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-12">
                    {/* Direct Contact */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Direct</h3>
                        <a href="mailto:hello@alpgraphicstudio.com" className="block text-2xl font-medium hover:opacity-60 transition-opacity">
                            hello@alpgraphicstudio.com
                        </a>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Timezone</h3>
                        <p className="text-xl opacity-80">
                            Turkey<br />
                            <span className="opacity-50">GMT+3</span>
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Follow</h3>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="https://www.instagram.com/alpgraphicstudio/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold uppercase tracking-widest px-4 py-2 border border-current/20 rounded-full hover:bg-current hover:text-[#f5f3e9] dark:hover:text-[#0a0a0a] transition-all duration-300"
                            >
                                Instagram
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="mt-auto pt-12 border-t border-current/10 flex justify-between items-end opacity-40 font-mono text-xs uppercase">
                <span>© 2026 Alpgraphics</span>
                <span>Turkey / Remote</span>
            </motion.div>
        </div>
    );
}
