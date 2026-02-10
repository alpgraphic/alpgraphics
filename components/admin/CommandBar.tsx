"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgency, Project } from "@/context/AgencyContext";

export default function CommandBar({ onNavigate, onProjectSelect }: { onNavigate: (tab: string) => void, onProjectSelect?: (p: Project) => void }) {
    const { projects, toggleAdminTheme, isAdminNight } = useAgency();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Toggle with Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery("");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Filter Logic
    const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    interface Action { id: string; label: string; type: 'nav' | 'action' | 'project'; project?: Project }

    const actions: Action[] = [
        ...filteredProjects.map(p => ({ id: `p-${p.id}`, label: `Open Project: ${p.title}`, type: 'project' as const, project: p })),
        { id: 'nav-overview', label: 'Go to Dashboard', type: 'nav' as const },
        { id: 'nav-finance', label: 'Go to Finance', type: 'nav' as const },
        { id: 'nav-inbox', label: 'Go to Inbox', type: 'nav' as const },
        { id: 'nav-team', label: 'Go to Team', type: 'nav' as const },
        { id: 'action-theme', label: `Switch to ${isAdminNight ? 'Light' : 'Dark'} Mode`, type: 'action' as const },
    ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

    // Keyboard Navigation in List
    useEffect(() => {
        const handleListNav = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "ArrowDown") {
                setSelectedIndex(prev => (prev + 1) % actions.length);
            } else if (e.key === "ArrowUp") {
                setSelectedIndex(prev => (prev - 1 + actions.length) % actions.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                handleSelect(actions[selectedIndex]);
            }
        };
        window.addEventListener("keydown", handleListNav);
        return () => window.removeEventListener("keydown", handleListNav);
    }, [isOpen, selectedIndex, actions]);

    const handleSelect = (action: Action) => {
        if (!action) return;
        if (action.type === 'nav') onNavigate(action.id.replace('nav-', ''));
        if (action.type === 'action' && action.id === 'action-theme') toggleAdminTheme();
        if (action.type === 'project' && onProjectSelect && action.project) onProjectSelect(action.project);
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className={`w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden border ${isAdminNight ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`}
                    >
                        <div className={`flex items-center gap-4 p-4 border-b ${isAdminNight ? 'border-white/5' : 'border-black/5'}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent focus:outline-none text-lg font-medium placeholder:opacity-40"
                            />
                            <div className="flex gap-2">
                                <span className={`text-[10px] px-2 py-1 rounded border opacity-40 uppercase tracking-widest ${isAdminNight ? 'border-white/20' : 'border-black/20'}`}>ESC</span>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {actions.length === 0 && <div className="p-4 text-center opacity-40 text-sm">No results found.</div>}
                            {actions.map((action, i) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleSelect(action)}
                                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between text-sm group transition-all ${i === selectedIndex ? (isAdminNight ? 'bg-white/10' : 'bg-black/5') : 'opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${action.type === 'project' ? 'bg-[#a62932]' : action.type === 'nav' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                        <span className="font-bold">{action.label}</span>
                                    </div>
                                    {i === selectedIndex && <span className="opacity-40 text-[10px] uppercase tracking-widest">Enter</span>}
                                </button>
                            ))}
                        </div>

                        <div className={`p-2 border-t text-[10px] flex justify-between uppercase tracking-widest opacity-30 ${isAdminNight ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                            <span>Alpa OS Command</span>
                            <span>Pro Tip: Use arrows to navigate</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
