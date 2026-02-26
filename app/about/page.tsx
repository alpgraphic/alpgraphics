import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hakkımızda — AlpGraphics",
    description: "AlpGraphics, yaratıcı tasarım ve dijital çözümler sunan bir ajans. Marka kimliği, web geliştirme ve dijital strateji alanlarında profesyonel hizmet veriyoruz.",
    openGraph: {
        title: "Hakkımızda — AlpGraphics",
        description: "Yaratıcı tasarım ve dijital çözümler.",
        type: "website",
    },
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Hero */}
            <section className="relative py-32 px-6 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#a62932]/10 to-transparent" />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        Alp<span className="text-[#a62932]">Graphics</span>
                    </h1>
                    <p className="text-lg md:text-xl opacity-60 leading-relaxed">
                        Yaratıcı tasarım, dijital strateji ve marka kimliği alanlarında
                        profesyonel çözümler sunuyoruz.
                    </p>
                </div>
            </section>

            {/* Values */}
            <section className="max-w-5xl mx-auto px-6 py-20">
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-12 text-center">
                    Neler Yapıyoruz
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: "🎨", title: "Marka Kimliği", desc: "Logo, renk paleti ve tipografi ile markanızı benzersiz kılıyoruz." },
                        { icon: "💻", title: "Web Geliştirme", desc: "Modern ve performanslı web siteleri ve uygulamalar geliştiriyoruz." },
                        { icon: "📱", title: "Dijital Strateji", desc: "Sosyal medya, SEO ve dijital pazarlama stratejileri oluşturuyoruz." },
                    ].map(item => (
                        <div key={item.title} className="border border-white/5 rounded-2xl p-8 hover:border-[#a62932]/30 transition-colors bg-white/[0.02]">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                            <p className="text-sm opacity-50 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="text-center py-20 px-6">
                <h2 className="text-3xl font-bold mb-4">Birlikte Çalışalım</h2>
                <p className="text-sm opacity-50 mb-8 max-w-md mx-auto">
                    Projenizi hayata geçirmek için bizimle iletişime geçin.
                </p>
                <a
                    href="/contact"
                    className="inline-block px-8 py-4 bg-[#a62932] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#a62932]/80 transition-colors"
                >
                    İletişime Geç
                </a>
            </section>
        </main>
    );
}
