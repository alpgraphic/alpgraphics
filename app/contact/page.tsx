"use client";

import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Hero */}
            <section className="relative py-24 px-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-[#a62932]/10 to-transparent" />
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                        İletişim
                    </h1>
                    <p className="text-lg opacity-50">
                        Projeniz hakkında konuşalım.
                    </p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div className="space-y-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-40">Bilgiler</h2>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl">📧</span>
                            <div>
                                <h3 className="font-bold text-sm mb-1">E-posta</h3>
                                <a href="mailto:info@alpgraphics.net" className="text-sm opacity-60 hover:text-[#a62932] transition-colors">
                                    info@alpgraphics.net
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="text-2xl">📍</span>
                            <div>
                                <h3 className="font-bold text-sm mb-1">Konum</h3>
                                <p className="text-sm opacity-60">İstanbul, Türkiye</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="text-2xl">🕐</span>
                            <div>
                                <h3 className="font-bold text-sm mb-1">Çalışma Saatleri</h3>
                                <p className="text-sm opacity-60">Pazartesi — Cuma, 09:00 — 18:00</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Mesaj Gönder</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Ad Soyad</label>
                            <input
                                id="contact-name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a62932]/50 transition-colors"
                                placeholder="Adınız"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">E-posta</label>
                            <input
                                id="contact-email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a62932]/50 transition-colors"
                                placeholder="mail@ornek.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Mesaj</label>
                            <textarea
                                id="contact-message"
                                required
                                rows={5}
                                value={formData.message}
                                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a62932]/50 transition-colors resize-none"
                                placeholder="Projeniz hakkında bize bilgi verin..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#a62932] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#a62932]/80 transition-colors"
                        >
                            {sent ? '✓ Gönderildi!' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
