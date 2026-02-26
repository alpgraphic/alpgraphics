"use client";

import { motion } from "framer-motion";
import { OverviewTabProps } from "./types";

// Extracted from ProjectCard in page.tsx
function ProjectCard({ project, index, isAdminNight }: { project: any; index: number; isAdminNight: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-6 rounded-xl border flex items-center justify-between transition-all hover:border-[#a62932]/30 ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-2 h-8 rounded-full ${project.status === 'In Progress' ? 'bg-yellow-500' : project.status === 'Review' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <div>
                    <h4 className="font-bold">{project.title}</h4>
                    <p className="text-xs opacity-40">{project.client} • {project.status}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold">{project.progress || 0}%</p>
                <div className="w-20 h-1.5 bg-current/10 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#a62932] rounded-full" style={{ width: `${project.progress || 0}%` }} />
                </div>
            </div>
        </motion.div>
    );
}

export default function OverviewTab({ stats, projects, isAdminNight, setActiveTab }: OverviewTabProps) {
    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className={`border p-6 rounded-2xl relative overflow-hidden group transition-all hover:scale-[1.02] ${isAdminNight ? 'bg-[#0a0a0a]/60 border-white/5 hover:border-white/10' : 'bg-white/80 border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/5'}`}
                    >
                        <div className={`absolute top-4 right-4 ${stat.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                            {stat.icon}
                        </div>
                        <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-3">{stat.label}</h3>
                        <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                        <p className={`text-xs mt-3 ${stat.color} flex items-center gap-1 font-medium`}>
                            {stat.change}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                    Active Work <span className="w-full h-px bg-current/5 ml-4"></span>
                </h3>
                <div className="grid gap-4">
                    {projects.filter(p => p.status === 'In Progress' || p.status === 'Review').length === 0 ? (
                        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                            <div className="text-5xl mb-4">🚀</div>
                            <h4 className="text-lg font-bold mb-2">Aktif İş Yok</h4>
                            <p className="text-sm opacity-50 max-w-xs mx-auto">Şu anda devam eden veya incelemede bekleyen proje bulunmuyor.</p>
                            <button
                                onClick={() => setActiveTab('projects')}
                                className="mt-6 px-6 py-2 text-xs font-bold uppercase tracking-widest bg-[#a62932] text-white rounded-lg hover:bg-[#a62932]/80 transition-colors"
                            >
                                Projelere Git
                            </button>
                        </div>
                    ) : (
                        projects.filter(p => p.status === 'In Progress' || p.status === 'Review').map((project, i) => (
                            <div key={project.id}>
                                <ProjectCard project={project} index={i} isAdminNight={isAdminNight} />
                            </div>
                        ))
                    )}
                </div>
            </section>
        </>
    );
}
