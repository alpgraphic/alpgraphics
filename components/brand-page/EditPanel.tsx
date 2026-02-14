"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgency, Account } from "@/context/AgencyContext";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { uploadFile, getFileInfo } from "@/lib/uploadService";

interface EditPanelProps {
    brandPage: any;
    onUpdate: (updates: any) => void;
    onSave: () => void;
    onPublish: () => void;
    isNight?: boolean;
}

export default function EditPanel({
    brandPage,
    onUpdate,
    onSave,
    onPublish,
    isNight = false
}: EditPanelProps) {
    const { accounts } = useAgency();
    const { showToast } = useToast();
    const [expandedSection, setExpandedSection] = useState<string | null>("hero");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Helper: convert hex to RGB string
    const hexToRgb = (hex: string): string => {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    };

    // Fix: Weak comparison or string conversion for ID match
    const selectedAccount = accounts.find(a => String(a.id) === String(brandPage.linkedAccountId));

    const handleAccountSelect = (accountId: string) => {
        // Fix: Compare as strings to handle both number (demo) and string (mongo) IDs
        const account = accounts.find(a => String(a.id) === accountId);
        if (account) {
            onUpdate({
                linkedAccountId: account.id,
                brandName: account.company
            });
        } else {
            onUpdate({
                linkedAccountId: undefined
            });
        }
    };

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    const handleFileUpload = async (type: string, file: File) => {
        setIsUploading(true);

        // Get file info for better UX
        const fileInfo = await getFileInfo(file);
        setUploadProgress(`Uploading ${fileInfo.name} (${fileInfo.sizeFormatted})...`);

        try {
            // Determine allowed formats based on upload type
            const isFont = type.startsWith('font');
            const allowedFormats = isFont
                ? [
                    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
                    'application/x-font-ttf', 'application/x-font-otf',
                    'application/font-woff', 'application/font-woff2',
                    'application/octet-stream' // Fallback for some browsers
                ]
                : ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

            // Upload using unified service (auto cloud or base64 fallback)
            const result = await uploadFile(file, {
                maxSize: 5 * 1024 * 1024,
                allowedFormats,
                folder: isFont ? 'brand-pages/fonts' : 'brand-pages/logos',
                compress: !isFont,  // Only compress images, not fonts
                quality: 90      // High quality for logos
            });

            if (!result.success) {
                showToast(result.error || 'Upload failed', 'error');
                return;
            }

            if (type.startsWith('logo')) {
                onUpdate({
                    logos: {
                        ...brandPage.logos,
                        [type.replace('logo-', '')]: result.url
                    }
                });
                const storageType = result.storage === 'cloud' ? '☁️ Cloud' : '📦 Local';
                showToast(`Logo uploaded successfully! (${storageType})`, 'success');
            } else if (type.startsWith('font')) {
                // Font file upload
                const fontType = type.replace('font-', ''); // 'heading' or 'body'
                onUpdate({
                    fonts: {
                        ...brandPage.fonts,
                        [fontType]: {
                            ...brandPage.fonts?.[fontType],
                            file: result.url,
                            name: file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '')
                        }
                    }
                });
                const storageType = result.storage === 'cloud' ? '☁️ Cloud' : '📦 Local';
                showToast(`Font uploaded successfully! (${storageType})`, 'success');
            }
        } catch (error) {
            console.error('File upload error:', error);
            showToast('Failed to upload file', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress('');
        }
    };

    const toggleSectionEnabled = (sectionId: string) => {
        const updatedSections = brandPage.sections.map((s: any) =>
            s.id === sectionId ? { ...s, enabled: !s.enabled } : s
        );
        onUpdate({ sections: updatedSections });
    };

    // Helper function to convert multiple files to base64
    const handleMockupsUpload = async (files: FileList) => {
        // Calculate how many more mockups we can add
        const currentCount = brandPage.mockups?.length || 0;
        const remainingSlots = 8 - currentCount;

        if (remainingSlots <= 0) {
            showToast('Maximum 8 mockup images reached', 'warning');
            return;
        }

        // Limit files to available slots
        const filesArray = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            showToast(`Only ${remainingSlots} more mockup(s) can be added`, 'warning');
        }

        setIsUploading(true);
        setUploadProgress(`Uploading ${filesArray.length} mockup${filesArray.length > 1 ? 's' : ''}...`);

        try {
            // Upload all files using the service (base64 - no compression to avoid canvas issues)
            const results = await Promise.all(
                filesArray.map(async (file, index) => {
                    console.log(`Uploading file ${index + 1}/${filesArray.length}: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`);
                    const result = await uploadFile(file, {
                        maxSize: 10 * 1024 * 1024, // Increased to 10MB
                        allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
                        folder: 'brand-pages/mockups',
                        compress: true,  // Re-enabled compression
                        quality: 85
                    });
                    if (!result.success) {
                        console.error(`Failed to upload ${file.name}:`, result.error);
                    }
                    return result;
                })
            );

            // Filter successful uploads only
            const successfulResults = results.filter(r => r.success);
            const failures = results.filter(r => !r.success);

            if (failures.length > 0) {
                console.log('Failed uploads:', failures);
                showToast(`${failures.length} file(s) failed to upload`, 'warning');
            }

            if (successfulResults.length === 0) {
                showToast('No files were uploaded successfully', 'error');
                return;
            }

            // Convert to mockup format
            const newMockups = successfulResults.map(result => ({
                url: result.url!,
                category: 'other',
                categoryLabel: 'General'
            }));

            onUpdate({
                mockups: [...(brandPage.mockups || []), ...newMockups].slice(0, 8)
            });

            const cloudCount = successfulResults.filter(r => r.storage === 'cloud').length;
            const storageInfo = cloudCount > 0 ? ` (${cloudCount} to ☁️ Cloud)` : ' (📦 Local)';
            showToast(`${successfulResults.length} mockup${successfulResults.length > 1 ? 's' : ''} uploaded successfully!${storageInfo}`, 'success');
        } catch (error) {
            console.error('Mockup upload error:', error);
            showToast('Failed to upload mockups', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress('');
        }
    };

    return (
        <div className={`h-screen flex flex-col ${isNight ? 'bg-[#0a0a0a] text-[#f5f3e9]' : 'bg-white text-[#1a1a1a]'} border-r border-black/5`}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-current/5 bg-black/[0.02]">
                <a href="/admin/dashboard" className="text-xs opacity-40 hover:opacity-100 transition-opacity block mb-3">
                    ← Dashboard
                </a>
                <h2 className="text-lg font-bold">{brandPage.brandName || "New Brand"}</h2>
                <p className="text-[10px] opacity-30 mt-1 font-mono uppercase tracking-wider">
                    {brandPage.status === 'published' ? '● Published' : '○ Draft'}
                </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-b border-current/5">
                {isUploading && (
                    <div className="mb-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
                        <LoadingSpinner size="sm" />
                        <span className="text-xs font-medium text-blue-500">{uploadProgress}</span>
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={onSave}
                        disabled={isUploading}
                        className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-current/10 hover:bg-current/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        💾 Save
                    </button>
                    <button
                        onClick={onPublish}
                        disabled={isUploading}
                        className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#a62932] text-white hover:bg-[#c4323d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🚀 Publish
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">

                {/* CLIENT SELECTION - TOP SECTION */}
                <div className="border-b border-current/5">
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">🏢</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider">Firma Seç</h3>
                        </div>

                        <select
                            value={brandPage.linkedAccountId || ''}
                            onChange={(e) => handleAccountSelect(e.target.value)}
                            className="w-full p-3 rounded-lg border border-current/10 bg-current/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a62932]/30"
                        >
                            <option value="">-- Firma Seçin --</option>
                            {accounts.filter(a => a.status === 'Active').map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.company} ({account.name})
                                </option>
                            ))}
                        </select>

                        {/* Selected Firm Info */}
                        {selectedAccount && (
                            <div className="mt-4 p-3 bg-current/5 rounded-lg">
                                <p className="font-bold text-sm">{selectedAccount.company}</p>
                                <p className="text-xs opacity-60 mt-1">{selectedAccount.name}</p>
                                <p className="text-[10px] opacity-40 mt-0.5">{selectedAccount.email}</p>
                            </div>
                        )}

                        {accounts.filter(a => a.status === 'Active').length === 0 && (
                            <p className="text-xs opacity-40 mt-2 italic">Henüz firma eklenmedi</p>
                        )}
                    </div>
                </div>

                {/* TEMPLATE SELECTOR */}
                <div className="border-b border-current/5">
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">🎨</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider">Şablon Seç</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Editorial Luxury */}
                            <button
                                onClick={() => onUpdate({ template: 'editorial-luxury' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'editorial-luxury' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#f5f3e9] to-[#e8e6dc] mb-2 flex items-center justify-center">
                                    <span className="text-[10px] text-[#1a1a1a] font-serif italic opacity-60">Editorial</span>
                                </div>
                                <p className="text-[10px] font-bold">Editorial Luxury</p>
                                <p className="text-[8px] opacity-40">Klasik, zarif</p>
                            </button>

                            {/* Minimal Clean */}
                            <button
                                onClick={() => onUpdate({ template: 'minimal-clean' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'minimal-clean' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-white border border-black/10 mb-2 flex items-center justify-center">
                                    <span className="text-[10px] text-black font-light tracking-widest">MINIMAL</span>
                                </div>
                                <p className="text-[10px] font-bold">Minimal Clean</p>
                                <p className="text-[8px] opacity-40">Sade, beyaz alan</p>
                            </button>

                            {/* Tech Modern */}
                            <button
                                onClick={() => onUpdate({ template: 'tech-modern' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'tech-modern' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-[#0a0a0a] mb-2 flex items-center justify-center">
                                    <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">TECH</span>
                                </div>
                                <p className="text-[10px] font-bold">Tech Modern</p>
                                <p className="text-[8px] opacity-40">Dark, futuristik</p>
                            </button>

                            {/* Organic Natural */}
                            <button
                                onClick={() => onUpdate({ template: 'organic-natural' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'organic-natural' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#e8e0d5] to-[#c9d1c5] mb-2 flex items-center justify-center">
                                    <span className="text-[10px] text-[#5a6b5a] font-medium">organic</span>
                                </div>
                                <p className="text-[10px] font-bold">Organic Natural</p>
                                <p className="text-[8px] opacity-40">Doğal, sıcak</p>
                            </button>

                            {/* Bold Playful */}
                            <button
                                onClick={() => onUpdate({ template: 'bold-playful' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'bold-playful' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-2 flex items-center justify-center">
                                    <span className="text-[12px] text-white font-black tracking-tight">BOLD!</span>
                                </div>
                                <p className="text-[10px] font-bold">Bold Playful</p>
                                <p className="text-[8px] opacity-40">Cesur, enerjik</p>
                            </button>

                            {/* Social Media */}
                            <button
                                onClick={() => onUpdate({ template: 'social-media' })}
                                className={`p-2 rounded-lg border text-left transition-all ${brandPage.template === 'social-media' ? 'border-[#a62932] bg-[#a62932]/10 ring-1 ring-[#a62932]' : 'border-current/10 hover:border-current/30'}`}
                            >
                                <div className="aspect-[4/3] rounded bg-[#fafaf8] border border-black/10 mb-2 flex flex-col items-center justify-center gap-1">
                                    <span className="text-[8px] text-[#1a1a1a]/40 tracking-[0.2em] uppercase">Strategy</span>
                                    <span className="text-[11px] text-[#1a1a1a] font-light tracking-tight">Social Media</span>
                                    <div className="w-6 h-px bg-[#1a1a1a]/15 mt-0.5" />
                                </div>
                                <p className="text-[10px] font-bold">Social Media</p>
                                <p className="text-[8px] opacity-40">SM Sunumu</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* HERO SECTION */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('hero')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">🎯 Hero Section</span>
                        <span className="text-lg opacity-40">{expandedSection === 'hero' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'hero' && (
                        <div className="px-6 py-5 space-y-5 bg-black/[0.01]">

                            {/* Logo Size Slider */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider opacity-40 mb-3 block">Logo Size</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="600"
                                    step="20"
                                    value={brandPage.heroConfig?.logoSize || 400}
                                    onChange={(e) => onUpdate({
                                        heroConfig: {
                                            ...brandPage.heroConfig,
                                            logoSize: parseInt(e.target.value)
                                        }
                                    })}
                                    className="w-full accent-[#a62932]"
                                />
                                <p className="text-xs opacity-40 mt-1">{brandPage.heroConfig?.logoSize || 400}px</p>
                            </div>

                            {/* Category Label */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider opacity-40 mb-2 block">Category Label</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Brand Identity"
                                        value={brandPage.heroConfig?.categoryLabel || ''}
                                        onChange={(e) => onUpdate({
                                            heroConfig: {
                                                ...brandPage.heroConfig,
                                                categoryLabel: e.target.value
                                            }
                                        })}
                                        className="flex-1 px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                    />
                                    <input
                                        type="color"
                                        value={brandPage.heroConfig?.categoryLabelColor || '#000000'}
                                        onChange={(e) => onUpdate({
                                            heroConfig: {
                                                ...brandPage.heroConfig,
                                                categoryLabelColor: e.target.value
                                            }
                                        })}
                                        title="Label Color"
                                        className="w-12 h-10 rounded-lg cursor-pointer border border-current/10"
                                    />
                                </div>
                            </div>

                            {/* Copyright */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider opacity-40 mb-2 block">Copyright Text</label>
                                <input
                                    type="text"
                                    placeholder="© Brand Name"
                                    value={brandPage.heroConfig?.copyrightText || ''}
                                    onChange={(e) => onUpdate({
                                        heroConfig: {
                                            ...brandPage.heroConfig,
                                            copyrightText: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider opacity-40 mb-2 block">Year</label>
                                <input
                                    type="text"
                                    placeholder="2026"
                                    value={brandPage.heroConfig?.year || ''}
                                    onChange={(e) => onUpdate({
                                        heroConfig: {
                                            ...brandPage.heroConfig,
                                            year: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* LOGOS */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('logos')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">🖼️ {brandPage.template === 'social-media' ? 'Logo & İkon' : 'Logo Files & Sizes'}</span>
                        <span className="text-lg opacity-40">{expandedSection === 'logos' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'logos' && (
                        <div className="px-6 py-5 space-y-6 bg-black/[0.01]">
                            {(brandPage.template === 'social-media'
                                ? [
                                    { key: 'dark', label: 'Logo', sizeKey: 'logoDarkSize' },
                                    { key: 'iconDark', label: 'İkon', sizeKey: 'iconDarkSize' }
                                ]
                                : [
                                    { key: 'light', label: 'Logo Light (dark backgrounds)', sizeKey: 'logoLightSize' },
                                    { key: 'dark', label: 'Logo Dark (light backgrounds)', sizeKey: 'logoDarkSize' },
                                    { key: 'iconLight', label: 'Icon Light', sizeKey: 'iconLightSize' },
                                    { key: 'iconDark', label: 'Icon Dark', sizeKey: 'iconDarkSize' }
                                ]
                            ).map(({ key, label, sizeKey }) => (
                                <div key={key} className="space-y-3 pb-4 border-b border-current/5 last:border-0 last:pb-0">
                                    <label className="text-[10px] uppercase tracking-wider opacity-40 block">{label}</label>

                                    {/* File Upload */}
                                    <input
                                        type="file"
                                        accept="image/*,.svg"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(`logo-${key}`, e.target.files[0])}
                                        className="text-xs w-full file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-black/5 hover:file:bg-black/10 file:cursor-pointer"
                                    />

                                    {brandPage.logos?.[key] && (
                                        <>
                                            <div className="relative group inline-block">
                                                <img src={brandPage.logos[key]} alt={label} className="h-16 object-contain bg-current/5 rounded p-2" />
                                                <button
                                                    onClick={() => onUpdate({ logos: { ...brandPage.logos, [key]: '' } })}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >×</button>
                                            </div>

                                            {/* Logo Size Slider */}
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-40">Boyut</span>
                                                    <span className="text-xs font-mono opacity-60">
                                                        {brandPage.heroConfig?.logoSize || 180}px
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="40"
                                                    max="400"
                                                    step="10"
                                                    value={brandPage.heroConfig?.logoSize || 180}
                                                    onChange={(e) => onUpdate({
                                                        heroConfig: {
                                                            ...brandPage.heroConfig,
                                                            logoSize: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    className="w-full accent-[#a62932]"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FONTS - Hidden for social-media template */}
                {brandPage.template !== 'social-media' && <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('fonts')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">🔤 Custom Fonts & Sizes</span>
                        <span className="text-lg opacity-40">{expandedSection === 'fonts' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'fonts' && (
                        <div className="px-6 py-5 space-y-5 bg-black/[0.01]">

                            {/* Heading Font */}
                            <div className="space-y-3 pb-5 border-b border-current/5">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Heading Font</h4>
                                <input
                                    type="file"
                                    accept=".ttf,.otf,.woff,.woff2"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload('font-heading', e.target.files[0])}
                                    className="text-xs w-full file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-black/5 hover:file:bg-black/10 file:cursor-pointer"
                                />
                                {brandPage.fonts?.heading?.name && (
                                    <>
                                        <p className="text-sm font-bold" style={{ fontFamily: brandPage.fonts.heading.name }}>
                                            {brandPage.fonts.heading.name}
                                        </p>

                                        {/* Font Size Slider */}
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] uppercase tracking-wider opacity-40">Font Size</span>
                                                <span className="text-xs font-mono opacity-60">
                                                    {brandPage.sizeConfig?.headingFontSize || 72}px
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="40"
                                                max="120"
                                                step="4"
                                                value={brandPage.sizeConfig?.headingFontSize || 72}
                                                onChange={(e) => onUpdate({
                                                    sizeConfig: {
                                                        ...brandPage.sizeConfig,
                                                        headingFontSize: parseInt(e.target.value)
                                                    }
                                                })}
                                                className="w-full accent-[#a62932]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Body Font */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Body Font</h4>
                                <input
                                    type="file"
                                    accept=".ttf,.otf,.woff,.woff2"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload('font-body', e.target.files[0])}
                                    className="text-xs w-full file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-black/5 hover:file:bg-black/10 file:cursor-pointer"
                                />
                                {brandPage.fonts?.body?.name && (
                                    <>
                                        <p className="text-sm" style={{ fontFamily: brandPage.fonts.body.name }}>
                                            {brandPage.fonts.body.name}
                                        </p>

                                        {/* Font Size Slider */}
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] uppercase tracking-wider opacity-40">Font Size</span>
                                                <span className="text-xs font-mono opacity-60">
                                                    {brandPage.sizeConfig?.bodyFontSize || 18}px
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="14"
                                                max="32"
                                                step="2"
                                                value={brandPage.sizeConfig?.bodyFontSize || 18}
                                                onChange={(e) => onUpdate({
                                                    sizeConfig: {
                                                        ...brandPage.sizeConfig,
                                                        bodyFontSize: parseInt(e.target.value)
                                                    }
                                                })}
                                                className="w-full accent-[#a62932]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>}

                {/* COLORS */}
                {brandPage.template !== 'social-media' && <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('colors')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">🎨 Brand Colors</span>
                        <span className="text-lg opacity-40">{expandedSection === 'colors' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'colors' && (
                        <div className="px-6 py-5 bg-black/[0.01]">
                            {/* Color Grid */}
                            <div className="space-y-4">
                                {(brandPage.colors?.colors || []).map((color: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={color.hex}
                                            onChange={(e) => {
                                                const updated = [...(brandPage.colors?.colors || [])];
                                                const newHex = e.target.value;
                                                updated[index] = { ...updated[index], hex: newHex, rgb: hexToRgb(newHex) };
                                                onUpdate({
                                                    colors: { ...brandPage.colors, colors: updated }
                                                });
                                            }}
                                            className="w-16 h-12 rounded-lg cursor-pointer border border-current/10"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Color name"
                                            value={color.name}
                                            onChange={(e) => {
                                                const updated = [...(brandPage.colors?.colors || [])];
                                                updated[index] = { ...updated[index], name: e.target.value };
                                                onUpdate({
                                                    colors: { ...brandPage.colors, colors: updated }
                                                });
                                            }}
                                            className="flex-1 px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const updated = (brandPage.colors?.colors || []).filter((_: any, i: number) => i !== index);
                                                onUpdate({
                                                    colors: { ...brandPage.colors, colors: updated }
                                                });
                                            }}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Color Button */}
                            <button
                                onClick={() => {
                                    const defaultHex = '#000000';
                                    const newColor = {
                                        name: 'New Color',
                                        hex: defaultHex,
                                        rgb: hexToRgb(defaultHex)
                                    };
                                    onUpdate({
                                        colors: {
                                            ...brandPage.colors,
                                            colors: [...(brandPage.colors?.colors || []), newColor]
                                        }
                                    });
                                }}
                                className="w-full mt-4 px-4 py-3 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 hover:border-current/40 transition-all"
                            >
                                + Add Color
                            </button>
                        </div>
                    )}
                </div>}

                {/* SECTIONS TOGGLE */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('sections')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">📝 Show/Hide Sections</span>
                        <span className="text-lg opacity-40">{expandedSection === 'sections' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'sections' && (
                        <div className="px-6 py-5 space-y-3 bg-black/[0.01]">
                            {['story', 'logo', 'colors', 'typography', 'mockups', 'footer'].map((sectionType) => (
                                <label key={sectionType} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={brandPage.sections?.find((s: any) => s.type === sectionType)?.enabled}
                                        onChange={() => toggleSectionEnabled(sectionType)}
                                        className="w-4 h-4 accent-[#a62932]"
                                    />
                                    <span className="text-sm capitalize group-hover:opacity-100 opacity-60 transition-opacity">
                                        {sectionType === 'logo' ? 'Logo Showcase' :
                                            sectionType === 'colors' ? 'Color Palette' :
                                                sectionType}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* MOCKUPS */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('mockups')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">📸 Mockup Images</span>
                        <span className="text-lg opacity-40">{expandedSection === 'mockups' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'mockups' && (
                        <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                            <p className="text-xs opacity-40 mb-3">Upload mockup images (max 8)</p>

                            {/* Upload Multiple Files */}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        handleMockupsUpload(e.target.files);
                                    }
                                }}
                                className="text-xs w-full file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-black/5 hover:file:bg-black/10 file:cursor-pointer"
                            />

                            {/* Mockup Preview Grid */}
                            {brandPage.mockups && brandPage.mockups.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {brandPage.mockups.map((mockup: any, index: number) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={mockup.url}
                                                alt={`Mockup ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-current/10"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updated = brandPage.mockups.filter((_: any, i: number) => i !== index);
                                                    onUpdate({ mockups: updated });
                                                }}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs opacity-30 mt-2">
                                {brandPage.mockups?.length || 0} / 8 mockups uploaded
                            </p>
                        </div>
                    )}
                </div>

                {/* BRAND STORY */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('story')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">📖 Brand Story</span>
                        <span className="text-lg opacity-40">{expandedSection === 'story' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'story' && (
                        <div className="px-6 py-5 bg-black/[0.01] space-y-4">
                            {/* Featured Image Upload */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider opacity-40 block">Featured Image</label>

                                {brandPage.storyFeaturedImage ? (
                                    <div className="relative group">
                                        <img
                                            src={brandPage.storyFeaturedImage}
                                            alt="Story featured"
                                            className="w-full h-40 object-cover rounded-lg border border-current/10"
                                        />
                                        <button
                                            onClick={() => onUpdate({ storyFeaturedImage: '' })}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-current/20 rounded-lg cursor-pointer hover:border-current/40 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setIsUploading(true);
                                                    setUploadProgress('Uploading featured image...');
                                                    try {
                                                        const result = await uploadFile(file, {
                                                            maxSize: 5 * 1024 * 1024,
                                                            allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
                                                            compress: true,
                                                            quality: 85
                                                        });
                                                        if (result.success) {
                                                            onUpdate({ storyFeaturedImage: result.url });
                                                            showToast('Featured image uploaded!', 'success');
                                                        } else {
                                                            showToast(result.error || 'Upload failed', 'error');
                                                        }
                                                    } catch {
                                                        showToast('Failed to upload image', 'error');
                                                    } finally {
                                                        setIsUploading(false);
                                                        setUploadProgress('');
                                                    }
                                                }
                                            }}
                                        />
                                        <span className="text-sm opacity-40">📷 Click to upload featured image</span>
                                    </label>
                                )}
                                <p className="text-[10px] opacity-30">This image appears alongside your brand story</p>
                            </div>

                            {/* Story Text */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider opacity-40 block">Story Text</label>
                                <textarea
                                    placeholder="Tell your brand's story..."
                                    value={brandPage.story || ''}
                                    onChange={(e) => onUpdate({ story: e.target.value })}
                                    rows={8}
                                    className="w-full px-3 py-3 text-sm bg-white border border-current/10 rounded-lg focus:border-current focus:outline-none resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* SOCIAL MEDIA STRATEGY - Only visible for social-media template */}
                {brandPage.template === 'social-media' && (
                    <>
                        {/* GOALS */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smGoals')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">🎯 Hedefler</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smGoals' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smGoals' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.goals || []).map((goal: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-current/10 rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="İkon (emoji)" value={goal.icon || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.goals || [])];
                                                        updated[idx] = { ...goal, icon: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, goals: updated } });
                                                    }}
                                                    className="w-16 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none text-center" />
                                                <input type="text" placeholder="Hedef başlığı" value={goal.title || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.goals || [])];
                                                        updated[idx] = { ...goal, title: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, goals: updated } });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <button onClick={() => {
                                                    const updated = (brandPage.socialMediaStrategy?.goals || []).filter((_: any, i: number) => i !== idx);
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, goals: updated } });
                                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                            </div>
                                            <input type="text" placeholder="Açıklama" value={goal.description || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.goals || [])];
                                                    updated[idx] = { ...goal, description: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, goals: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newGoal = { title: '', description: '', icon: '🎯' };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, goals: [...(brandPage.socialMediaStrategy?.goals || []), newGoal] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Hedef Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* CONTENT PILLARS */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smPillars')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">📚 İçerik Sütunları</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smPillars' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smPillars' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.contentPillars || []).map((pillar: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-current/10 rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="İkon" value={pillar.icon || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.contentPillars || [])];
                                                        updated[idx] = { ...pillar, icon: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: updated } });
                                                    }}
                                                    className="w-16 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none text-center" />
                                                <input type="text" placeholder="Sütun adı" value={pillar.title || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.contentPillars || [])];
                                                        updated[idx] = { ...pillar, title: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: updated } });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="color" value={pillar.color || '#6366f1'}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.contentPillars || [])];
                                                        updated[idx] = { ...pillar, color: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: updated } });
                                                    }}
                                                    className="w-10 h-8 rounded cursor-pointer border border-current/10" />
                                                <button onClick={() => {
                                                    const updated = (brandPage.socialMediaStrategy?.contentPillars || []).filter((_: any, i: number) => i !== idx);
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: updated } });
                                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                            </div>
                                            <input type="text" placeholder="Açıklama" value={pillar.description || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.contentPillars || [])];
                                                    updated[idx] = { ...pillar, description: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newPillar = { title: '', description: '', icon: '📌', color: '#6366f1' };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, contentPillars: [...(brandPage.socialMediaStrategy?.contentPillars || []), newPillar] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Sütun Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* PLATFORM STRATEGY */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smPlatforms')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">📱 Platform Stratejisi</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smPlatforms' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smPlatforms' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.platformStrategy || []).map((plat: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-current/10 rounded-lg space-y-2">
                                            <div className="flex gap-2 items-center">
                                                <input type="text" placeholder="Platform" value={plat.platform || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.platformStrategy || [])];
                                                        updated[idx] = { ...plat, platform: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: updated } });
                                                    }}
                                                    className="w-32 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="text" placeholder="Sıklık" value={plat.frequency || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.platformStrategy || [])];
                                                        updated[idx] = { ...plat, frequency: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: updated } });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <button onClick={() => {
                                                    const updated = (brandPage.socialMediaStrategy?.platformStrategy || []).filter((_: any, i: number) => i !== idx);
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: updated } });
                                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                            </div>
                                            <input type="text" placeholder="Ton & Üslup" value={plat.tone || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.platformStrategy || [])];
                                                    updated[idx] = { ...plat, tone: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            <input type="text" placeholder="İçerik türleri (virgülle ayırın)" value={(plat.contentTypes || []).join(', ')}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.platformStrategy || [])];
                                                    updated[idx] = { ...plat, contentTypes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newPlat = { platform: '', tone: '', frequency: '', contentTypes: [] };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, platformStrategy: [...(brandPage.socialMediaStrategy?.platformStrategy || []), newPlat] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Platform Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* HASHTAG STRATEGY */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smHashtags')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">#️⃣ Hashtag Stratejisi</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smHashtags' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smHashtags' && (
                                <div className="px-6 py-5 space-y-5 bg-black/[0.01]">
                                    {(['branded', 'industry', 'campaign'] as const).map((category) => {
                                        const labels: Record<string, string> = { branded: '🏷️ Marka Hashtag\'leri', industry: '🏭 Sektör Hashtag\'leri', campaign: '🚀 Kampanya Hashtag\'leri' };
                                        return (
                                            <div key={category} className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-wider opacity-40 block">{labels[category]}</label>
                                                <input type="text" placeholder="Virgülle ayırarak yazın (#tag1, #tag2)"
                                                    value={(brandPage.socialMediaStrategy?.hashtagStrategy?.[category] || []).join(', ')}
                                                    onChange={(e) => {
                                                        const tags = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                                        onUpdate({
                                                            socialMediaStrategy: {
                                                                ...brandPage.socialMediaStrategy,
                                                                hashtagStrategy: { ...brandPage.socialMediaStrategy?.hashtagStrategy, [category]: tags }
                                                            }
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* CONTENT CALENDAR */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smCalendar')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">📅 İçerik Takvimi</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smCalendar' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smCalendar' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.calendarData || []).map((item: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-current/10 rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <select value={item.day || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, day: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="w-28 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none">
                                                    <option value="Pazartesi">Pazartesi</option>
                                                    <option value="Salı">Salı</option>
                                                    <option value="Çarşamba">Çarşamba</option>
                                                    <option value="Perşembe">Perşembe</option>
                                                    <option value="Cuma">Cuma</option>
                                                    <option value="Cumartesi">Cumartesi</option>
                                                    <option value="Pazar">Pazar</option>
                                                </select>
                                                <input type="text" placeholder="Platform" value={item.platform || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, platform: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="w-28 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="time" value={item.time || '10:00'}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, time: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="w-24 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="color" value={item.color || '#6366f1'}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, color: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="w-10 h-8 rounded cursor-pointer border border-current/10" />
                                                <button onClick={() => {
                                                    const updated = (brandPage.socialMediaStrategy?.calendarData || []).filter((_: any, i: number) => i !== idx);
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="İçerik türü" value={item.contentType || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, contentType: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="w-32 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="text" placeholder="Açıklama" value={item.description || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.calendarData || [])];
                                                        updated[idx] = { ...item, description: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: updated } });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newItem = { day: 'Pazartesi', platform: 'Instagram', contentType: 'Post', description: '', time: '10:00', color: '#6366f1' };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, calendarData: [...(brandPage.socialMediaStrategy?.calendarData || []), newItem] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Takvim Öğesi Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* KPI METRICS */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smKpi')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">📊 KPI & Metrikler</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smKpi' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smKpi' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.kpiMetrics || []).map((kpi: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input type="text" placeholder="İkon" value={kpi.icon || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.kpiMetrics || [])];
                                                    updated[idx] = { ...kpi, icon: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, kpiMetrics: updated } });
                                                }}
                                                className="w-16 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none text-center" />
                                            <input type="text" placeholder="Metrik adı" value={kpi.metric || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.kpiMetrics || [])];
                                                    updated[idx] = { ...kpi, metric: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, kpiMetrics: updated } });
                                                }}
                                                className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            <input type="text" placeholder="Hedef" value={kpi.target || ''}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.kpiMetrics || [])];
                                                    updated[idx] = { ...kpi, target: e.target.value };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, kpiMetrics: updated } });
                                                }}
                                                className="w-32 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            <button onClick={() => {
                                                const updated = (brandPage.socialMediaStrategy?.kpiMetrics || []).filter((_: any, i: number) => i !== idx);
                                                onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, kpiMetrics: updated } });
                                            }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newKpi = { metric: '', target: '', icon: '📊' };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, kpiMetrics: [...(brandPage.socialMediaStrategy?.kpiMetrics || []), newKpi] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Metrik Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* TARGET AUDIENCE */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smAudience')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">👥 Hedef Kitle</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smAudience' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smAudience' && (
                                <div className="px-6 py-5 space-y-4 bg-black/[0.01]">
                                    {(brandPage.socialMediaStrategy?.targetAudience || []).map((persona: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-current/10 rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Persona adı" value={persona.persona || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.targetAudience || [])];
                                                        updated[idx] = { ...persona, persona: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: updated } });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <input type="text" placeholder="Yaş aralığı" value={persona.age || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(brandPage.socialMediaStrategy?.targetAudience || [])];
                                                        updated[idx] = { ...persona, age: e.target.value };
                                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: updated } });
                                                    }}
                                                    className="w-24 px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                                <button onClick={() => {
                                                    const updated = (brandPage.socialMediaStrategy?.targetAudience || []).filter((_: any, i: number) => i !== idx);
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: updated } });
                                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold">×</button>
                                            </div>
                                            <input type="text" placeholder="İlgi alanları (virgülle ayırın)" value={(persona.interests || []).join(', ')}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.targetAudience || [])];
                                                    updated[idx] = { ...persona, interests: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                            <input type="text" placeholder="Platformlar (virgülle ayırın)" value={(persona.platforms || []).join(', ')}
                                                onChange={(e) => {
                                                    const updated = [...(brandPage.socialMediaStrategy?.targetAudience || [])];
                                                    updated[idx] = { ...persona, platforms: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) };
                                                    onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: updated } });
                                                }}
                                                className="w-full px-2 py-1.5 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const newPersona = { persona: '', age: '', interests: [], platforms: [] };
                                        onUpdate({ socialMediaStrategy: { ...brandPage.socialMediaStrategy, targetAudience: [...(brandPage.socialMediaStrategy?.targetAudience || []), newPersona] } });
                                    }} className="w-full px-4 py-2.5 border-2 border-dashed border-current/20 rounded-lg text-sm font-bold opacity-60 hover:opacity-100 transition-all">+ Persona Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* BRAND VOICE */}
                        <div className="border-b border-current/5">
                            <button
                                onClick={() => toggleSection('smVoice')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">🗣️ Marka Sesi</span>
                                <span className="text-lg opacity-40">{expandedSection === 'smVoice' ? '−' : '+'}</span>
                            </button>
                            {expandedSection === 'smVoice' && (
                                <div className="px-6 py-5 space-y-5 bg-black/[0.01]">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider opacity-40 block">Ses Tonu (virgülle ayırın)</label>
                                        <input type="text" placeholder="Samimi, Profesyonel, İlham Verici"
                                            value={(brandPage.socialMediaStrategy?.brandVoice?.tone || []).join(', ')}
                                            onChange={(e) => {
                                                const tones = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                                onUpdate({
                                                    socialMediaStrategy: {
                                                        ...brandPage.socialMediaStrategy,
                                                        brandVoice: { ...brandPage.socialMediaStrategy?.brandVoice, tone: tones }
                                                    }
                                                });
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider opacity-40 block">✅ Yapılacaklar (virgülle ayırın)</label>
                                        <textarea placeholder="Her satıra bir madde yazın"
                                            value={(brandPage.socialMediaStrategy?.brandVoice?.doList || []).join('\n')}
                                            onChange={(e) => {
                                                const items = e.target.value.split('\n').filter(Boolean);
                                                onUpdate({
                                                    socialMediaStrategy: {
                                                        ...brandPage.socialMediaStrategy,
                                                        brandVoice: { ...brandPage.socialMediaStrategy?.brandVoice, doList: items }
                                                    }
                                                });
                                            }}
                                            rows={4}
                                            className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none resize-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider opacity-40 block">❌ Kaçınılacaklar (her satıra bir madde)</label>
                                        <textarea placeholder="Her satıra bir madde yazın"
                                            value={(brandPage.socialMediaStrategy?.brandVoice?.dontList || []).join('\n')}
                                            onChange={(e) => {
                                                const items = e.target.value.split('\n').filter(Boolean);
                                                onUpdate({
                                                    socialMediaStrategy: {
                                                        ...brandPage.socialMediaStrategy,
                                                        brandVoice: { ...brandPage.socialMediaStrategy?.brandVoice, dontList: items }
                                                    }
                                                });
                                            }}
                                            rows={4}
                                            className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none resize-none" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* TEXT OVERRIDES - ALL SECTION TEXTS */}
                <div className="border-b border-current/5">
                    <button
                        onClick={() => toggleSection('textOverrides')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-current/5 transition-colors text-left"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">✏️ Edit All Section Texts</span>
                        <span className="text-lg opacity-40">{expandedSection === 'textOverrides' ? '−' : '+'}</span>
                    </button>

                    {expandedSection === 'textOverrides' && (
                        <div className="px-6 py-5 space-y-6 bg-black/[0.01]">
                            <p className="text-xs opacity-40 mb-4">Edit titles and subtitles for each section</p>

                            {/* Logo Showcase */}
                            <div className="space-y-3 pb-4 border-b border-current/5">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Logo Showcase Section</h4>
                                <input
                                    type="text"
                                    placeholder="The Brand Mark System"
                                    value={brandPage.textOverrides?.logoShowcaseTitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            logoShowcaseTitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Logo variations optimized for different backgrounds..."
                                    value={brandPage.textOverrides?.logoShowcaseSubtitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            logoShowcaseSubtitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>

                            {/* Colors */}
                            <div className="space-y-3 pb-4 border-b border-current/5">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Brand Colors Section</h4>
                                <input
                                    type="text"
                                    placeholder="Brand Colors"
                                    value={brandPage.textOverrides?.colorTitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            colorTitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="A carefully curated palette..."
                                    value={brandPage.textOverrides?.colorSubtitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            colorSubtitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>

                            {/* Typography */}
                            <div className="space-y-3 pb-4 border-b border-current/5">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Typography Section</h4>
                                <input
                                    type="text"
                                    placeholder="Typography System"
                                    value={brandPage.textOverrides?.typographyTitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            typographyTitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Carefully selected typefaces..."
                                    value={brandPage.textOverrides?.typographySubtitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            typographySubtitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>

                            {/* Mockups */}
                            <div className="space-y-3 pb-4 border-b border-current/5">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Mockups Section</h4>
                                <input
                                    type="text"
                                    placeholder="Brand in Action"
                                    value={brandPage.textOverrides?.mockupsTitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            mockupsTitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Real-world applications..."
                                    value={brandPage.textOverrides?.mockupsSubtitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            mockupsSubtitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>

                            {/* Footer */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] uppercase tracking-wider opacity-40">Footer Section</h4>
                                <input
                                    type="text"
                                    placeholder="Thank You"
                                    value={brandPage.textOverrides?.footerTitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            footerTitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Questions? Get in touch"
                                    value={brandPage.textOverrides?.footerSubtitle || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            footerSubtitle: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="hello@brand.com"
                                    value={brandPage.textOverrides?.footerEmail || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            footerEmail: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="© 2026 Brand Name"
                                    value={brandPage.textOverrides?.footerCopyright || ''}
                                    onChange={(e) => onUpdate({
                                        textOverrides: {
                                            ...brandPage.textOverrides,
                                            footerCopyright: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 text-sm bg-transparent border border-current/10 rounded-lg focus:border-current focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
