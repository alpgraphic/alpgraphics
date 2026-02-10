"use client";

import { useState, useEffect, useRef } from "react";

interface SceneSettingsData {
    dayImage: string | null;
    nightImage: string | null;
    dayPosition: { x: number; y: number; z: number };
    nightPosition: { x: number; y: number; z: number };
    dayWidth: { desktop: number; mobile: number };
    nightWidth: { desktop: number; mobile: number };
    imageAspect: number;
}

const DEFAULTS: SceneSettingsData = {
    dayImage: null,
    nightImage: null,
    dayPosition: { x: 0, y: 0.01, z: 0 },
    nightPosition: { x: 0, y: 0.02, z: 0 },
    dayWidth: { desktop: 20, mobile: 15 },
    nightWidth: { desktop: 20, mobile: 19 },
    imageAspect: 1.778,
};

export default function SceneSettings({ isAdminNight }: { isAdminNight: boolean }) {
    const [settings, setSettings] = useState<SceneSettingsData>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingDay, setUploadingDay] = useState(false);
    const [uploadingNight, setUploadingNight] = useState(false);
    const dayInputRef = useRef<HTMLInputElement>(null);
    const nightInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/site-settings')
            .then(r => r.json())
            .then(data => {
                if (data.settings) setSettings({ ...DEFAULTS, ...data.settings });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/site-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Save error:', err);
        }
        setSaving(false);
    };

    const handleImageUpload = async (file: File, type: 'day' | 'night') => {
        const setter = type === 'day' ? setUploadingDay : setUploadingNight;
        setter(true);
        try {
            if (file.size > 5 * 1024 * 1024) { alert('Maks 5MB.'); setter(false); return; }
            if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) { alert('PNG, JPG, WebP veya SVG.'); setter(false); return; }

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                setSettings(prev => ({
                    ...prev,
                    [type === 'day' ? 'dayImage' : 'nightImage']: base64,
                    imageAspect: aspect,
                }));
                setter(false);
            };
            img.onerror = () => { setter(false); alert('Gorsel yuklenemedi'); };
            img.src = base64;
        } catch { setter(false); }
    };

    const card = `p-6 rounded-xl border ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5'}`;
    const inp = `w-full px-3 py-2 rounded-lg border text-sm ${isAdminNight ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`;
    const lbl = "text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2";

    if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-[#a62932] border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Sahne Ayarlari</h3>
                    <p className="text-sm opacity-60">Anasayfadaki 3D sahne gorsellerini ve konumlarini yonetin</p>
                </div>
                <button onClick={handleSave} disabled={saving} className={`px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${saved ? 'bg-green-500 text-white' : 'bg-[#a62932] text-white hover:bg-[#c4323d] shadow-lg shadow-[#a62932]/20'} ${saving ? 'opacity-50 cursor-wait' : ''}`}>
                    {saved ? '✓ Kaydedildi' : saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Day */}
                <div className={card}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">☀️</span>
                        <div><h4 className="font-bold">Gunduz Gorseli</h4><p className="text-xs opacity-40">Acik tema sahne gorseli</p></div>
                    </div>
                    <div className={`relative aspect-video rounded-lg overflow-hidden mb-4 border-2 border-dashed flex items-center justify-center cursor-pointer group transition-colors ${isAdminNight ? 'border-white/10 hover:border-white/30 bg-white/5' : 'border-black/10 hover:border-black/30 bg-black/5'}`} onClick={() => dayInputRef.current?.click()}>
                        {(() => {
                            const src = settings.dayImage || '/backgrounds.svg';
                            return (
                                <>
                                    <img src={src} alt="Day" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-1">
                                        <span className="text-white text-sm font-bold">{uploadingDay ? 'Yukleniyor...' : 'Degistir'}</span>
                                        {!settings.dayImage && <span className="text-white/50 text-[10px]">Varsayilan gorsel</span>}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    <input ref={dayInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'day'); e.target.value = ''; }} />
                    {settings.dayImage && <button onClick={() => setSettings(prev => ({ ...prev, dayImage: null }))} className="text-xs text-red-500 hover:text-red-400">✕ Gorseli kaldir (varsayilana don)</button>}
                </div>

                {/* Night */}
                <div className={card}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🌙</span>
                        <div><h4 className="font-bold">Gece Gorseli</h4><p className="text-xs opacity-40">Koyu tema sahne gorseli</p></div>
                    </div>
                    <div className={`relative aspect-video rounded-lg overflow-hidden mb-4 border-2 border-dashed flex items-center justify-center cursor-pointer group transition-colors ${isAdminNight ? 'border-white/10 hover:border-white/30 bg-white/5' : 'border-black/10 hover:border-black/30 bg-black/5'}`} onClick={() => nightInputRef.current?.click()}>
                        {(() => {
                            const src = settings.nightImage || '/backgrounds_2.svg';
                            return (
                                <>
                                    <img src={src} alt="Night" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-1">
                                        <span className="text-white text-sm font-bold">{uploadingNight ? 'Yukleniyor...' : 'Degistir'}</span>
                                        {!settings.nightImage && <span className="text-white/50 text-[10px]">Varsayilan gorsel</span>}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    <input ref={nightInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'night'); e.target.value = ''; }} />
                    {settings.nightImage && <button onClick={() => setSettings(prev => ({ ...prev, nightImage: null }))} className="text-xs text-red-500 hover:text-red-400">✕ Gorseli kaldir (varsayilana don)</button>}
                </div>
            </div>

            {/* Size & Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={card}>
                    <h4 className="font-bold mb-4">☀️ Gunduz — Boyut & Konum</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className={lbl}>Genislik (Desktop)</label><input type="number" step="0.5" value={settings.dayWidth.desktop} onChange={e => setSettings(prev => ({ ...prev, dayWidth: { ...prev.dayWidth, desktop: parseFloat(e.target.value) || 20 } }))} className={inp} /></div>
                        <div><label className={lbl}>Genislik (Mobil)</label><input type="number" step="0.5" value={settings.dayWidth.mobile} onChange={e => setSettings(prev => ({ ...prev, dayWidth: { ...prev.dayWidth, mobile: parseFloat(e.target.value) || 15 } }))} className={inp} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className={lbl}>X</label><input type="number" step="0.5" value={settings.dayPosition.x} onChange={e => setSettings(prev => ({ ...prev, dayPosition: { ...prev.dayPosition, x: parseFloat(e.target.value) || 0 } }))} className={inp} /></div>
                        <div><label className={lbl}>Y</label><input type="number" step="0.01" value={settings.dayPosition.y} onChange={e => setSettings(prev => ({ ...prev, dayPosition: { ...prev.dayPosition, y: parseFloat(e.target.value) || 0.01 } }))} className={inp} /></div>
                        <div><label className={lbl}>Z</label><input type="number" step="0.5" value={settings.dayPosition.z} onChange={e => setSettings(prev => ({ ...prev, dayPosition: { ...prev.dayPosition, z: parseFloat(e.target.value) || 0 } }))} className={inp} /></div>
                    </div>
                </div>
                <div className={card}>
                    <h4 className="font-bold mb-4">🌙 Gece — Boyut & Konum</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className={lbl}>Genislik (Desktop)</label><input type="number" step="0.5" value={settings.nightWidth.desktop} onChange={e => setSettings(prev => ({ ...prev, nightWidth: { ...prev.nightWidth, desktop: parseFloat(e.target.value) || 20 } }))} className={inp} /></div>
                        <div><label className={lbl}>Genislik (Mobil)</label><input type="number" step="0.5" value={settings.nightWidth.mobile} onChange={e => setSettings(prev => ({ ...prev, nightWidth: { ...prev.nightWidth, mobile: parseFloat(e.target.value) || 19 } }))} className={inp} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className={lbl}>X</label><input type="number" step="0.5" value={settings.nightPosition.x} onChange={e => setSettings(prev => ({ ...prev, nightPosition: { ...prev.nightPosition, x: parseFloat(e.target.value) || 0 } }))} className={inp} /></div>
                        <div><label className={lbl}>Y</label><input type="number" step="0.01" value={settings.nightPosition.y} onChange={e => setSettings(prev => ({ ...prev, nightPosition: { ...prev.nightPosition, y: parseFloat(e.target.value) || 0.02 } }))} className={inp} /></div>
                        <div><label className={lbl}>Z</label><input type="number" step="0.5" value={settings.nightPosition.z} onChange={e => setSettings(prev => ({ ...prev, nightPosition: { ...prev.nightPosition, z: parseFloat(e.target.value) || 0 } }))} className={inp} /></div>
                    </div>
                </div>
            </div>


            <div className={`p-4 rounded-lg border border-dashed text-xs opacity-50 ${isAdminNight ? 'border-white/10' : 'border-black/10'}`}>
                <p>💡 Gorseller base64 olarak veritabaninda saklanir. SVG veya optimize PNG onerilir (maks 5MB). Gorsel yuklenmezse varsayilan /backgrounds.svg ve /backgrounds_2.svg kullanilir.</p>
            </div>
        </div>
    );
}
