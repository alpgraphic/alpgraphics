"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useAgency, Project, ProjectTask, ProjectFile, TeamMember, ProjectGalleryItem } from "@/context/AgencyContext";

interface ProjectDetailViewProps {
    project: Project;
    onClose: () => void;
    isAdminNight: boolean;
}

export default function ProjectDetailView({ project, onClose, isAdminNight }: ProjectDetailViewProps) {
    const { updateProject, teamMembers, deleteTask } = useAgency();
    const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'files'>('overview');
    const [isDragging, setIsDragging] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Local State for Add Task
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Local State for Assignment
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Task Logic
    const toggleTask = (taskId: number) => {
        const currentTasks = project.tasks || [];
        const newTasks = currentTasks.map(t =>
            t.id === taskId ? { ...t, status: t.status === 'Done' ? 'In Progress' : 'Done' } : t
        );
        updateProject(project.id as any, { tasks: newTasks as ProjectTask[] });

        // Auto-update progress based on completed tasks
        if (newTasks.length > 0) {
            const completed = newTasks.filter(t => t.status === 'Done').length;
            const newProgress = Math.round((completed / newTasks.length) * 100);
            updateProject(project.id, { progress: newProgress });
        }
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const newTask: ProjectTask = {
            id: Date.now(),
            title: newTaskTitle,
            status: 'To Do',
            priority: 'Medium'
        };
        const currentTasks = project.tasks || [];
        updateProject(project.id as any, { tasks: [...currentTasks, newTask] });
        setNewTaskTitle('');
        setShowAddTask(false);
    };

    const handleDeleteTask = (taskId: number) => {
        deleteTask(project.id as any, taskId);
    };

    // File Drag Logic
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // Simulate file upload
        const newFile: ProjectFile = {
            name: `Upload_${Date.now()}.jpg`,
            type: "IMG",
            size: "2.4MB",
            date: "Just now",
            status: "Pending"
        };
        const currentFiles = project.files || [];
        updateProject(project.id as any, { files: [newFile, ...currentFiles] });
    };

    // Team Logic
    const handleAssignment = (memberId: number) => {
        // Find member in global list
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return;

        // Check if already assigned
        if (project.team?.some(m => m.id === memberId)) return;

        const currentTeam = project.team || [];
        updateProject(project.id as any, { team: [...currentTeam, member] });
        setShowAssignModal(false);
    };

    const handleRemoveMember = (memberId: number) => {
        const currentTeam = project.team || [];
        updateProject(project.id as any, { team: currentTeam.filter(m => m.id !== memberId) });
    };

    // Gallery Logic
    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newItem: ProjectGalleryItem = {
                    id: Date.now() + index,
                    imageData: reader.result as string,
                    order: (project.gallery?.length || 0) + index,
                    isFeatured: false
                };
                const currentGallery = project.gallery || [];
                updateProject(project.id as any, { gallery: [...currentGallery, newItem] });
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        if (e.target) e.target.value = '';
    };

    const handleRemoveGalleryItem = (itemId: number) => {
        const currentGallery = project.gallery || [];
        updateProject(project.id as any, { gallery: currentGallery.filter(g => g.id !== itemId) });
    };

    const handleSetFeatured = (itemId: number) => {
        const currentGallery = project.gallery || [];
        updateProject(project.id as any, {
            gallery: currentGallery.map(g => ({ ...g, isFeatured: g.id === itemId }))
        });
    };

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 right-0 w-full md:w-[800px] z-50 flex flex-col shadow-2xl border-l backdrop-blur-3xl ${isAdminNight ? 'bg-[#0a0a0a]/95 border-white/10 text-white' : 'bg-[#f5f3e9]/95 border-black/10 text-black'}`}
        >
            {/* Header */}
            <div className={`flex justify-between items-center p-8 border-b ${isAdminNight ? 'border-white/5' : 'border-black/5'}`}>
                <div>
                    <h2 className="text-3xl font-[300] tracking-tight">{project.title}</h2>
                    <p className="opacity-40 text-xs font-bold uppercase tracking-widest mt-1">{project.client} — {project.category}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full border border-current opacity-40 hover:opacity-100 transition-opacity">
                    ✕
                </button>
            </div>

            {/* Navigation */}
            <div className={`px-8 pt-6 flex gap-8 border-b ${isAdminNight ? 'border-white/5' : 'border-black/5'} overflow-x-auto no-scrollbar`}>
                {['overview', 'workflow', 'files'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`text-sm font-bold uppercase tracking-widest pb-4 transition-all relative whitespace-nowrap ${activeTab === tab ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
                    >
                        {tab}
                        {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#a62932]" />}
                    </button>
                ))}
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 relative no-scrollbar">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                        <div className="grid grid-cols-2 gap-8">
                            <div className={`p-6 rounded-xl border ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                                <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2">Status</h4>
                                <select
                                    value={project.status}
                                    onChange={(e) => updateProject(project.id as any, { status: e.target.value as any })}
                                    className="bg-transparent text-xl font-bold focus:outline-none w-full appearance-none"
                                >
                                    <option value="Completed">Completed</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Planning">Planning</option>
                                </select>
                            </div>
                            <div className={`p-6 rounded-xl border ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                                <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2">Overall Progress</h4>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold">{project.progress}%</span>
                                    <span className="text-[10px] opacity-40 uppercase">Manual</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={project.progress}
                                    onChange={(e) => updateProject(project.id as any, { progress: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-current/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#a62932]"
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-4">Project Brief</h4>
                            <textarea
                                value={project.description}
                                onChange={(e) => updateProject(project.id as any, { description: e.target.value })}
                                className="text-lg opacity-80 leading-relaxed max-w-2xl bg-transparent w-full h-40 focus:outline-none resize-none"
                            />
                        </div>
                    </motion.div>
                )}

                {/* WORKFLOW */}
                {activeTab === 'workflow' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40">Task List</h4>
                            <button onClick={() => setShowAddTask(true)} className="text-xs bg-[#a62932] text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors">+ Add Task</button>
                        </div>

                        {/* New Task Input */}
                        {showAddTask && (
                            <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
                                <input
                                    autoFocus
                                    placeholder="Task Title..."
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className={`flex-1 bg-transparent border-b py-2 focus:outline-none ${isAdminNight ? 'border-white/20' : 'border-black/20'}`}
                                />
                                <button type="submit" className="text-xs font-bold uppercase">Save</button>
                                <button type="button" onClick={() => setShowAddTask(false)} className="text-xs opacity-50">Cancel</button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {(project.tasks || []).length === 0 && !showAddTask && <p className="opacity-40 text-sm">No tasks defined.</p>}
                            {(project.tasks || []).map(task => (
                                <div
                                    key={task.id}
                                    className={`p-4 rounded-lg border flex items-center gap-4 transition-all ${task.status === 'Done' ? 'opacity-40' : 'opacity-100'} ${isAdminNight ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
                                >
                                    <div
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${task.status === 'Done' ? 'bg-[#a62932] border-[#a62932]' : 'border-current opacity-40'}`}
                                    >
                                        {task.status === 'Done' && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <span className={`flex-1 font-bold text-sm ${task.status === 'Done' ? 'line-through' : ''}`}>{task.title}</span>
                                    <span className="text-[10px] opacity-40 uppercase tracking-widest">{task.priority}</span>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-500 transition-all"
                                        title="Delete task"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* FILES (The Vault) */}
                {activeTab === 'files' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center mb-8 transition-colors ${isDragging ? 'border-[#a62932] bg-[#a62932]/10' : (isAdminNight ? 'border-white/10 hover:border-white/20' : 'border-black/10 hover:border-black/20')}`}
                        >
                            <p className="text-lg font-bold mb-2">Drop Project Files Here</p>
                            <p className="opacity-40 text-xs uppercase tracking-widest">Supports PDF, JPG, ZIP, AI</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(project.files || []).map((file, i) => (
                                <div key={i} className={`p-4 rounded-xl border relative group ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                                    {/* Status Badge */}
                                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${file.status === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                                    <div className="aspect-square bg-current/5 rounded-lg mb-4 flex items-center justify-center text-xl font-bold opacity-30">
                                        {file.type}
                                    </div>
                                    <p className="text-sm font-bold truncate">{file.name}</p>
                                    <p className="text-[10px] opacity-40 mt-1 flex justify-between">
                                        <span>{file.size}</span>
                                        <span className="opacity-100">{file.status}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Page tab removed - use Brand Pages section instead */}

            </div>
        </motion.div>
    );
}
