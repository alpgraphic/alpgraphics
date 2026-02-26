"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProjectsTabProps } from "./types";

const STATUSES = ['To Do', 'In Progress', 'Review', 'Done'] as const;
const STATUS_COLORS: Record<string, string> = {
    'To Do': 'bg-gray-500/20 text-gray-400',
    'In Progress': 'bg-yellow-500/20 text-yellow-500',
    'Review': 'bg-blue-500/20 text-blue-500',
    'Done': 'bg-green-500/20 text-green-500',
};

export default function ProjectsTab({
    projects, isAdminNight, searchQuery,
    setDeleteConfirm, setSelectedProject, setShowMilestonesFor, loadMilestones,
    onStatusChange
}: ProjectsTabProps) {
    const [statusDropdownId, setStatusDropdownId] = useState<number | string | null>(null);

    const filteredProjects = projects.filter(project => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return project.title.toLowerCase().includes(q) ||
            project.client.toLowerCase().includes(q) ||
            project.category.toLowerCase().includes(q) ||
            project.status.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-12">
            {/* Kanban Board */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Kanban Board</h3>
                    <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest opacity-40">
                        {STATUSES.map(s => (
                            <span key={s} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]?.replace('text-', 'bg-') || 'bg-gray-500'}`} />
                                {s} ({filteredProjects.filter(p => p.status === s).length})
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filteredProjects.map(project => (
                        <motion.div
                            key={project.id}
                            layoutId={`project-${project.id}`}
                            className={`group relative aspect-[16/9] rounded-lg overflow-hidden border transition-all ${isAdminNight ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/5 bg-white'}`}
                        >
                            {/* Background Image */}
                            <img
                                src={project.category === 'Brand Page' && project.brandData?.logos?.light
                                    ? project.brandData.logos.light
                                    : project.image}
                                alt={project.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-[#a62932]/20 to-[#1a1a1a]/80 -z-10" />

                            {/* Content Overlay */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                {/* Top Actions */}
                                <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0 duration-300">
                                    {/* Status Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusDropdownId(statusDropdownId === project.id ? null : project.id);
                                            }}
                                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md cursor-pointer hover:ring-1 hover:ring-white/30 transition-all ${STATUS_COLORS[project.status] || 'bg-white/10 text-white'}`}
                                        >
                                            {project.status} ▾
                                        </button>

                                        {statusDropdownId === project.id && (
                                            <div className={`absolute top-8 left-0 z-50 rounded-lg shadow-xl border overflow-hidden min-w-[120px] ${isAdminNight ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'}`}>
                                                {STATUSES.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStatusChange?.(project.id, status);
                                                            setStatusDropdownId(null);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${project.status === status ? 'opacity-40' : 'hover:bg-white/10'}`}
                                                        disabled={project.status === status}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]?.split(' ')[0] || 'bg-gray-500'}`} />
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm({ show: true, type: 'project', id: project.id, title: project.title });
                                        }}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Bottom Info */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 text-white">
                                        {project.client}
                                    </p>
                                    <h3 className="text-xl font-bold leading-none mb-3 text-white">
                                        {project.title}
                                    </h3>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMilestonesFor({ projectId: String(project.id), projectTitle: project.title });
                                                loadMilestones(String(project.id));
                                            }}
                                            className="px-3 py-2 rounded bg-white/10 text-white text-[10px] font-bold uppercase hover:bg-white/20 transition-colors"
                                        >
                                            📋 Adımlar
                                        </button>
                                        <button
                                            onClick={() => setSelectedProject(project)}
                                            className="flex-1 py-2 rounded bg-[#a62932] text-white text-[10px] font-bold uppercase hover:bg-[#a62932]/80 transition-colors shadow-lg shadow-red-900/20"
                                        >
                                            Detaylar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
