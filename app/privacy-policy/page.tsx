import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gizlilik Politikası – alpgraphics',
    description: 'alpgraphics mobil uygulaması gizlilik politikası.',
    robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
    return (
        <main
            style={{
                maxWidth: 760,
                margin: '0 auto',
                padding: '48px 24px 80px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                lineHeight: 1.7,
                color: '#1a1a1a',
            }}
        >
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', color: '#a62932', marginBottom: 40 }}>
                alpgraphics
            </p>

            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Gizlilik Politikası</h1>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 36 }}>Son güncellenme: Şubat 2026</p>

            <p style={{ marginBottom: 20 }}>
                Bu Gizlilik Politikası, <strong>alpgraphics</strong> mobil uygulamasını kullanırken
                kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
                Uygulamayı kullanarak bu politikayı kabul etmiş sayılırsınız.
            </p>

            <Section title="1. Toplanan Veriler">
                <p>Uygulama aşağıdaki verileri toplayabilir:</p>
                <ul>
                    <li><strong>Kimlik bilgileri:</strong> Ad, soyad, şirket adı ve e-posta adresi (giriş yapıldığında).</li>
                    <li><strong>Oyun verileri:</strong> ChromaDash mini oyununda elde ettiğiniz puan (skor).</li>
                    <li><strong>Apple Game Center:</strong> Kullanıcı kimliği ve görünen ad; liderlik tablosuna puan gönderimi amacıyla kullanılır.</li>
                    <li><strong>Bildirim jetonu:</strong> Uygulama bildirimleri göndermek amacıyla Expo Push Token alınabilir. Bu jeton yalnızca bildirim iletimi için kullanılır.</li>
                    <li><strong>Cihaz içi depolama:</strong> Kimlik doğrulama bilgileri cihazınızda güvenli depolama (Expo SecureStore) ile saklanır; sunucuya gönderilmez.</li>
                </ul>
            </Section>

            <Section title="2. Verilerin Kullanımı">
                <p>Toplanan veriler yalnızca şu amaçlarla kullanılır:</p>
                <ul>
                    <li>Kullanıcının kimliğini doğrulamak ve hesabına erişim sağlamak.</li>
                    <li>Proje tekliflerini, fatura ve ödeme bilgilerini görüntülemek.</li>
                    <li>Mesajlaşma özelliğini çalıştırmak.</li>
                    <li>Oyun skorlarını liderlik tablosuna kaydetmek (Game Center ve uygulama sunucusu).</li>
                    <li>Uygulama içi bildirimler göndermek.</li>
                </ul>
            </Section>

            <Section title="3. Apple Game Center">
                <p>
                    Uygulama, Apple Game Center hizmetini kullanmaktadır. Game Center aracılığıyla elde
                    ettiğiniz skorlar ve Game Center kimliğiniz, liderlik tablosunda görüntülenmek üzere
                    Apple'ın altyapısına ve uygulama sunucusuna iletilir. Apple'ın veri işleme politikası
                    için{' '}
                    <a href="https://www.apple.com/legal/privacy/tr/" target="_blank" rel="noopener noreferrer"
                        style={{ color: '#a62932' }}>
                        Apple Gizlilik Politikası
                    </a>
                    'na başvurun.
                </p>
            </Section>

            <Section title="4. Üçüncü Taraf Servisler">
                <p>Uygulama şu üçüncü taraf hizmetleri kullanmaktadır:</p>
                <ul>
                    <li><strong>Apple Game Center</strong> – puan ve liderlik tablosu yönetimi.</li>
                    <li><strong>Expo Push Notifications</strong> – bildirim iletimi.</li>
                </ul>
                <p>Bu hizmetler kendi gizlilik politikaları kapsamında çalışmaktadır.</p>
            </Section>

            <Section title="5. Veri Güvenliği">
                <p>
                    Kullanıcı kimlik bilgileri cihazınızda şifreli (Expo SecureStore) olarak saklanır.
                    Sunucu iletişimi HTTPS üzerinden gerçekleştirilir.
                    Üçüncü şahıslarla kişisel verileriniz paylaşılmaz; ticari amaçla satılmaz.
                </p>
            </Section>

            <Section title="6. Çocukların Gizliliği">
                <p>
                    Uygulama 13 yaşın altındaki çocuklara yönelik değildir ve bu yaş grubuna ait bilerek
                    kişisel veri toplanmaz.
                </p>
            </Section>

            <Section title="7. Haklarınız">
                <p>
                    Kişisel verilerinize erişme, düzeltme veya silme talebinde bulunmak için
                    aşağıdaki iletişim adresi üzerinden bizimle iletişime geçebilirsiniz.
                </p>
            </Section>

            <Section title="8. Politika Değişiklikleri">
                <p>
                    Bu politika zaman zaman güncellenebilir. Değişiklikler bu sayfada yayımlanır.
                    Uygulamayı kullanmaya devam etmeniz, güncellenen politikayı kabul ettiğiniz anlamına gelir.
                </p>
            </Section>

            <Section title="9. İletişim">
                <p>
                    Sorularınız için:{' '}
                    <a href="mailto:alpgraphicstudio@gmail.com" style={{ color: '#a62932' }}>
                        alpgraphicstudio@gmail.com
                    </a>
                </p>
            </Section>

            <hr style={{ border: 'none', borderTop: '1px solid #e0ddd3', margin: '40px 0 24px' }} />
            <p style={{ fontSize: 13, color: '#888' }}>© 2026 alpgraphics. Tüm hakları saklıdır.</p>
        </main>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
            <div style={{ fontSize: 15, color: '#333' }}>{children}</div>
        </section>
    );
}
