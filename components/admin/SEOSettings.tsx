"use client";

import { useState, useEffect } from "react";

interface SEOSettingsData {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
}

export default function SEOSettings({ isAdminNight }: { isAdminNight: boolean }) {
    const [settings, setSettings] = useState<SEOSettingsData>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch('/api/site-settings')
            .then(r => r.json())
            .then(data => {
                if (data.settings) {
                    setSettings({
                        seoTitle: data.settings.seoTitle || '',
                        seoDescription: data.settings.seoDescription || '',
                        seoKeywords: data.settings.seoKeywords || '',
                    });
                }
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

    const card = `p-8 rounded-2xl border ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5 shadow-xl shadow-black/5'}`;
    const inp = `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#a62932]/50 outline-none ${isAdminNight ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-inner'}`;
    const lbl = "text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2";

    if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-[#a62932] border-t-transparent rounded-full" /></div>;

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold mb-2">SEO Ayarları</h3>
                    <p className="text-sm opacity-60">Anasayfanın arama motoru görünürlüğünü buradan yönetin</p>
                </div>
                <button onClick={handleSave} disabled={saving} className={`px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${saved ? 'bg-green-500 text-white' : 'bg-[#a62932] text-white hover:bg-[#c4323d] shadow-lg shadow-[#a62932]/20'} ${saving ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}`}>
                    {saved ? '✓ Kaydedildi' : saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            <div className={card}>
                <div className="grid gap-8">
                    <div>
                        <label className={lbl}>Site Başlığı (SEO Title)</label>
                        <input
                            type="text"
                            placeholder="Örn: Alpgraphics | Creative Design Studio"
                            value={settings.seoTitle || ''}
                            onChange={e => setSettings(prev => ({ ...prev, seoTitle: e.target.value }))}
                            className={inp}
                        />
                        <div className="flex justify-between mt-2">
                            <p className="text-[10px] opacity-30">Arama sonuçlarında görünecek ana başlık.</p>
                            <p className={`text-[10px] ${(settings.seoTitle?.length || 0) > 60 ? 'text-orange-500' : 'opacity-30'}`}>{settings.seoTitle?.length || 0} / 60 karakter</p>
                        </div>
                    </div>

                    <div>
                        <label className={lbl}>Site Açıklaması (Meta Description)</label>
                        <textarea
                            placeholder="Sitenizi kısaca tanıtın (Örn: Alpgraphics, dijital deneyimler ve marka kimliği üzerine odaklanmış bir tasarım stüdyosudur...)"
                            value={settings.seoDescription || ''}
                            onChange={e => setSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
                            className={`${inp} h-32 resize-none`}
                        />
                        <div className="flex justify-between mt-2">
                            <p className="text-[10px] opacity-30">Arama sonuçlarının altındaki kısa açıklama metni.</p>
                            <p className={`text-[10px] ${(settings.seoDescription?.length || 0) > 160 ? 'text-orange-500' : 'opacity-30'}`}>{settings.seoDescription?.length || 0} / 160 karakter</p>
                        </div>
                    </div>

                    <div>
                        <label className={lbl}>Anahtar Kelimeler (Keywords)</label>
                        <input
                            type="text"
                            placeholder="tasarim, mimari, portfolyo, lüks, dijital ajans"
                            value={settings.seoKeywords || ''}
                            onChange={e => setSettings(prev => ({ ...prev, seoKeywords: e.target.value }))}
                            className={inp}
                        />
                        <p className="text-[10px] opacity-30 mt-2">Kelimeleri virgül (,) ile ayırarak yazın.</p>
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-2xl border border-dashed flex gap-4 items-start ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <span className="text-xl">💡</span>
                <div className="text-xs opacity-60 space-y-1">
                    <p className="font-bold">SEO Neden Önemli?</p>
                    <p>Doğru başlık ve açıklamalar, sitenizin Google sıralamalarını iyileştirir ve kullanıcıların sitenize tıklama oranını artırır. Admin paneli ve müşteri portalları otomatik olarak aramalardan gizlenmiş durumdadır.</p>
                </div>
            </div>
        </div>
    );
}
