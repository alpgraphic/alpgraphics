"use client";

import { useRef } from "react";
import { useAgency, Project, ProjectFont } from "@/context/AgencyContext";
import { motion } from "framer-motion";

interface AssetPanelProps {
    project: Project;
}

export default function AssetPanel({ project }: AssetPanelProps) {
    const { uploadLogo, deleteLogo, uploadFont, deleteFont, setGlobalFont } = useAgency();

    const logoInputRef = useRef<HTMLInputElement>(null);
    const fontInputRef = useRef<HTMLInputElement>(null);
    const activeLogoType = useRef<'primary' | 'secondary' | 'icon'>('primary');

    const handleLogoUpload = (type: 'primary' | 'secondary' | 'icon') => {
        activeLogoType.current = type;
        logoInputRef.current?.click();
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                uploadLogo(project.id, activeLogoType.current, base64);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (limit to 1MB)
        if (file.size > 1024 * 1024) {
            alert('Font file too large! Maximum 1MB.');
            return;
        }

        // Get format from file extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'ttf' ? 'ttf' : ext === 'otf' ? 'otf' : null;

        if (!format) {
            alert('Invalid font format! Use .woff2, .woff, .ttf, or .otf');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;

            // Extract font name from filename (remove extension)
            const fontName = file.name.replace(/\.[^/.]+$/, '');

            const newFont: ProjectFont = {
                id: `font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: fontName,
                family: fontName, // Can be customized by user later
                base64Data: base64,
                format
            };

            uploadFont(project.id, newFont);
        };
        reader.readAsDataURL(file);

        // Reset input
        if (fontInputRef.current) fontInputRef.current.value = '';
    };

    const logos = project.projectAssets?.logos || {};
    const fonts = project.projectAssets?.fonts || [];
    const selectedFontId = project.projectAssets?.selectedFontId;

    return (
        <div className="space-y-6">
            {/* Hidden file inputs */}
            <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
            />
            <input
                ref={fontInputRef}
                type="file"
                accept=".woff2,.woff,.ttf,.otf"
                onChange={handleFontFileChange}
                className="hidden"
            />

            {/* Logo Section */}
            <div>
                <h4 className="text-xs uppercase tracking-widest opacity-40 mb-3">Project Logos</h4>
                <div className="space-y-2">
                    {/* Primary Logo */}
                    <LogoUploadBox
                        label="Primary"
                        src={logos.primary}
                        onUpload={() => handleLogoUpload('primary')}
                        onDelete={() => deleteLogo(project.id, 'primary')}
                    />

                    {/* Secondary Logo */}
                    <LogoUploadBox
                        label="Secondary"
                        src={logos.secondary}
                        onUpload={() => handleLogoUpload('secondary')}
                        onDelete={() => deleteLogo(project.id, 'secondary')}
                    />

                    {/* Icon */}
                    <LogoUploadBox
                        label="Icon"
                        src={logos.icon}
                        onUpload={() => handleLogoUpload('icon')}
                        onDelete={() => deleteLogo(project.id, 'icon')}
                        aspectRatio="aspect-square"
                    />
                </div>
            </div>

            {/* Font Section */}
            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase tracking-widest opacity-40">Custom Fonts</h4>
                    <button
                        onClick={() => fontInputRef.current?.click()}
                        className="text-xs bg-[#a62932] hover:bg-[#8a2229] px-3 py-1 rounded transition-colors"
                    >
                        + Upload
                    </button>
                </div>

                {fonts.length === 0 ? (
                    <p className="text-xs opacity-30 py-4 text-center">No custom fonts</p>
                ) : (
                    <div className="space-y-2">
                        {fonts.map(font => (
                            <FontPreviewBox
                                key={font.id}
                                font={font}
                                isSelected={selectedFontId === font.id}
                                onSelect={() => setGlobalFont(project.id, font.id)}
                                onDelete={() => deleteFont(project.id, font.id)}
                            />
                        ))}
                    </div>
                )}

                {selectedFontId && (
                    <button
                        onClick={() => setGlobalFont(project.id, undefined)}
                        className="w-full mt-3 text-xs opacity-40 hover:opacity-100 underline"
                    >
                        Clear Global Font
                    </button>
                )}
            </div>
        </div>
    );
}

// Logo Upload Box Component
function LogoUploadBox({
    label,
    src,
    onUpload,
    onDelete,
    aspectRatio = "aspect-[3/2]"
}: {
    label: string;
    src?: string;
    onUpload: () => void;
    onDelete: () => void;
    aspectRatio?: string;
}) {
    return (
        <div>
            <p className="text-[10px] opacity-40 mb-1">{label}</p>
            {src ? (
                <div className={`${aspectRatio} relative bg-white/5 rounded-lg overflow-hidden group border border-white/10`}>
                    <img src={src} alt={label} className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={onUpload}
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                        >
                            Change
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-3 py-1 bg-red-500/80 hover:bg-red-500 rounded text-xs"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onUpload}
                    className={`${aspectRatio} w-full border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center hover:border-white/30 transition-colors group`}
                >
                    <span className="text-xs opacity-30 group-hover:opacity-60">+ Upload</span>
                </button>
            )}
        </div>
    );
}

// Font Preview Box Component
function FontPreviewBox({
    font,
    isSelected,
    onSelect,
    onDelete
}: {
    font: ProjectFont;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            layout
            className={`p-3 rounded-lg border transition-colors group ${isSelected
                    ? 'border-[#a62932] bg-[#a62932]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{font.name}</p>
                    <p className="text-[10px] opacity-40 font-mono">.{font.format}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onSelect}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${isSelected
                                ? 'bg-[#a62932] text-white'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        {isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-1 text-xs"
                    >
                        ✕
                    </button>
                </div>
            </div>
            {/* Font Preview */}
            <p
                className="text-lg opacity-60"
                style={{ fontFamily: `'${font.family}', sans-serif` }}
            >
                Aa Bb 123
            </p>
        </motion.div>
    );
}
