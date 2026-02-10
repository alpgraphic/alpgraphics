// Brief Form System Types

export type BriefFormType =
    | 'logo'
    | 'brand-identity'
    | 'web-design'
    | 'social-media'
    | 'packaging'
    | 'general';

export interface BriefQuestion {
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file';
    options?: string[];
    required: boolean;
    placeholder?: string;
}

export interface BriefTemplate {
    id: BriefFormType;
    name: string;
    nameEn: string;
    description: string;
    icon: string;
    questions: BriefQuestion[];
}

export interface ClientBrief {
    id: string;
    token: string; // Unique public token for form URL
    accountId: number; // Linked to Account
    accountName: string;
    accountCompany: string;
    formType: BriefFormType;
    status: 'pending' | 'submitted' | 'reviewed';
    responses: Record<string, string | string[]>;
    createdAt: string;
    submittedAt?: string;
    reviewedAt?: string;
}

// Brief Templates with Questions
export const briefTemplates: BriefTemplate[] = [
    {
        id: 'logo',
        name: 'Logo Brief',
        nameEn: 'Logo Design Brief',
        description: 'Essential questions for logo design projects',
        icon: '✒️',
        questions: [
            { id: 'company_name', question: 'Şirket/Marka Adı', type: 'text', required: true, placeholder: 'örn: Alpgraphics' },
            { id: 'industry', question: 'Sektör/Faaliyet Alanı', type: 'text', required: true, placeholder: 'örn: Dijital Tasarım Ajansı' },
            { id: 'target_audience', question: 'Hedef Kitleniz Kimdir?', type: 'textarea', required: true, placeholder: 'Yaş grubu, cinsiyet, ilgi alanları...' },
            { id: 'competitors', question: 'Rakipleriniz Kimler?', type: 'textarea', required: false, placeholder: 'Benzer sektördeki rakip markalar' },
            { id: 'style_preference', question: 'Logo Tarzı Tercihi', type: 'multiselect', required: true, options: ['Minimal', 'Modern', 'Klasik', 'Eğlenceli', 'Profesyonel', 'Lüks', 'Organik'] },
            { id: 'color_preference', question: 'Renk Tercihi', type: 'textarea', required: false, placeholder: 'Tercih ettiğiniz veya kaçınmak istediğiniz renkler' },
            { id: 'inspiration', question: 'İlham Aldığınız Logolar', type: 'textarea', required: false, placeholder: 'Beğendiğiniz logo örnekleri veya linkler' },
            { id: 'usage', question: 'Logo Nerede Kullanılacak?', type: 'multiselect', required: true, options: ['Web Sitesi', 'Sosyal Medya', 'Kartvizit', 'Tabela', 'Ambalaj', 'Araç Giydirme', 'Diğer'] },
            { id: 'additional', question: 'Eklemek İstediğiniz Notlar', type: 'textarea', required: false, placeholder: 'Varsa ek bilgiler veya özel istekler' },
        ]
    },
    {
        id: 'brand-identity',
        name: 'Kurumsal Kimlik',
        nameEn: 'Brand Identity Brief',
        description: 'Comprehensive brand identity questionnaire',
        icon: '🎨',
        questions: [
            { id: 'company_name', question: 'Şirket/Marka Adı', type: 'text', required: true, placeholder: 'örn: Alpgraphics' },
            { id: 'company_story', question: 'Markanızın Hikayesi', type: 'textarea', required: true, placeholder: 'Nasıl kuruldunuz, vizyonunuz nedir?' },
            { id: 'mission_vision', question: 'Misyon ve Vizyon', type: 'textarea', required: true, placeholder: 'Şirketinizin misyonu ve geleceğe dair vizyonu' },
            { id: 'brand_values', question: 'Marka Değerleri', type: 'textarea', required: true, placeholder: 'Markanızı tanımlayan 3-5 değer' },
            { id: 'target_audience', question: 'Hedef Kitleniz', type: 'textarea', required: true, placeholder: 'Demografik bilgiler, davranışlar, ihtiyaçlar' },
            { id: 'competitors', question: 'Rakip Analizi', type: 'textarea', required: true, placeholder: 'Rakipleriniz ve onlardan farkınız' },
            { id: 'personality', question: 'Marka Kişiliği', type: 'multiselect', required: true, options: ['Profesyonel', 'Samimi', 'Yenilikçi', 'Güvenilir', 'Cesur', 'Zarif', 'Eğlenceli', 'Minimal'] },
            { id: 'deliverables', question: 'İhtiyaç Duyulan Materyaller', type: 'multiselect', required: true, options: ['Logo', 'Renk Paleti', 'Tipografi', 'Kartvizit', 'Antetli Kağıt', 'Zarf', 'Sosyal Medya Kitleri', 'Brand Book'] },
            { id: 'inspiration', question: 'İlham Kaynakları', type: 'textarea', required: false, placeholder: 'Beğendiğiniz marka örnekleri' },
            { id: 'timeline', question: 'Proje Zaman Çizelgesi', type: 'text', required: false, placeholder: 'örn: 2 hafta içinde tamamlanmalı' },
        ]
    },
    {
        id: 'web-design',
        name: 'Web Tasarım',
        nameEn: 'Web Design Brief',
        description: 'Web design and development project brief',
        icon: '🌐',
        questions: [
            { id: 'project_type', question: 'Proje Türü', type: 'select', required: true, options: ['Yeni Web Sitesi', 'Yeniden Tasarım', 'Landing Page', 'E-ticaret', 'Web Uygulaması'] },
            { id: 'company_name', question: 'Şirket/Marka Adı', type: 'text', required: true, placeholder: 'örn: Alpgraphics' },
            { id: 'current_site', question: 'Mevcut Web Siteniz Var mı?', type: 'text', required: false, placeholder: 'www.example.com' },
            { id: 'goals', question: 'Web Sitesi Hedefleri', type: 'textarea', required: true, placeholder: 'Ne amaçla kullanılacak? Potansiyel müşteri, satış, bilgi?' },
            { id: 'pages', question: 'İhtiyaç Duyulan Sayfalar', type: 'textarea', required: true, placeholder: 'örn: Ana Sayfa, Hakkımızda, Hizmetler, İletişim, Blog' },
            { id: 'features', question: 'Özel Özellikler', type: 'multiselect', required: false, options: ['İletişim Formu', 'Blog', 'E-ticaret', 'Üyelik Sistemi', 'Çoklu Dil', 'Animasyonlar', 'Admin Paneli'] },
            { id: 'inspiration', question: 'Beğendiğiniz Web Siteleri', type: 'textarea', required: false, placeholder: 'Örnek siteler ve neyi beğendiğiniz' },
            { id: 'content', question: 'İçerik Durumu', type: 'select', required: true, options: ['Hazır içerik var', 'İçerik yazılması gerekiyor', 'Kısmen hazır'] },
            { id: 'timeline', question: 'Proje Zaman Çizelgesi', type: 'text', required: false, placeholder: 'örn: 1 ay içinde yayına alınmalı' },
        ]
    },
    {
        id: 'social-media',
        name: 'Sosyal Medya',
        nameEn: 'Social Media Brief',
        description: 'Social media design and management brief',
        icon: '📱',
        questions: [
            { id: 'company_name', question: 'Şirket/Marka Adı', type: 'text', required: true, placeholder: 'örn: Alpgraphics' },
            { id: 'platforms', question: 'Hangi Platformlar?', type: 'multiselect', required: true, options: ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest'] },
            { id: 'current_presence', question: 'Mevcut Sosyal Medya Hesapları', type: 'textarea', required: false, placeholder: 'Varsa mevcut hesap linkleri' },
            { id: 'goals', question: 'Sosyal Medya Hedefleri', type: 'textarea', required: true, placeholder: 'Takipçi artışı, etkileşim, satış, marka bilinirliği?' },
            { id: 'content_type', question: 'İçerik Türleri', type: 'multiselect', required: true, options: ['Post Tasarımları', 'Story Tasarımları', 'Reels/Video', 'Carousel', 'Highlight Covers', 'Profil Kit'] },
            { id: 'frequency', question: 'Paylaşım Sıklığı', type: 'select', required: true, options: ['Günlük', 'Haftada 3-4', 'Haftada 1-2', 'Aylık'] },
            { id: 'tone', question: 'İletişim Tonu', type: 'multiselect', required: true, options: ['Profesyonel', 'Samimi', 'Eğlenceli', 'Bilgilendirici', 'İlham Verici', 'Satış Odaklı'] },
            { id: 'inspiration', question: 'İlham Aldığınız Hesaplar', type: 'textarea', required: false, placeholder: 'Beğendiğiniz sosyal medya hesapları' },
        ]
    },
    {
        id: 'packaging',
        name: 'Ambalaj Tasarımı',
        nameEn: 'Packaging Design Brief',
        description: 'Product packaging design questionnaire',
        icon: '📦',
        questions: [
            { id: 'product_name', question: 'Ürün Adı', type: 'text', required: true, placeholder: 'örn: Organik Zeytinyağı' },
            { id: 'product_type', question: 'Ürün Açıklaması', type: 'textarea', required: true, placeholder: 'Ürün nedir, ne işe yarar?' },
            { id: 'package_type', question: 'Ambalaj Türü', type: 'multiselect', required: true, options: ['Kutu', 'Şişe', 'Poşet', 'Kavanoz', 'Tüp', 'Diğer'] },
            { id: 'dimensions', question: 'Ambalaj Boyutları', type: 'text', required: false, placeholder: 'örn: 10x15x5 cm' },
            { id: 'target_market', question: 'Hedef Pazar', type: 'textarea', required: true, placeholder: 'Ürün kime satılacak?' },
            { id: 'price_segment', question: 'Fiyat Segmenti', type: 'select', required: true, options: ['Ekonomik', 'Orta Segment', 'Premium', 'Lüks'] },
            { id: 'style', question: 'Tasarım Tarzı', type: 'multiselect', required: true, options: ['Minimal', 'Renkli', 'Organik', 'Modern', 'Klasik', 'Lüks', 'Eğlenceli'] },
            { id: 'competitors', question: 'Rakip Ürünler', type: 'textarea', required: false, placeholder: 'Benzer ürünler ve farkınız' },
            { id: 'inspiration', question: 'İlham Kaynakları', type: 'textarea', required: false, placeholder: 'Beğendiğiniz ambalaj örnekleri' },
        ]
    },
    {
        id: 'general',
        name: 'Genel Brief',
        nameEn: 'General Project Brief',
        description: 'General purpose project questionnaire',
        icon: '📋',
        questions: [
            { id: 'project_name', question: 'Proje Adı', type: 'text', required: true, placeholder: 'Projenize bir isim verin' },
            { id: 'company_name', question: 'Şirket/Marka Adı', type: 'text', required: true, placeholder: 'örn: Alpgraphics' },
            { id: 'project_description', question: 'Proje Açıklaması', type: 'textarea', required: true, placeholder: 'Projenizi detaylı olarak anlatın' },
            { id: 'goals', question: 'Proje Hedefleri', type: 'textarea', required: true, placeholder: 'Bu projeyle neyi başarmak istiyorsunuz?' },
            { id: 'target_audience', question: 'Hedef Kitle', type: 'textarea', required: true, placeholder: 'Projenin hitap edeceği kitle' },
            { id: 'deliverables', question: 'Beklenen Çıktılar', type: 'textarea', required: true, placeholder: 'Teslim edilmesi gereken materyaller' },
            { id: 'timeline', question: 'Zaman Çizelgesi', type: 'text', required: false, placeholder: 'Proje ne zaman tamamlanmalı?' },
            { id: 'budget', question: 'Bütçe Aralığı', type: 'select', required: false, options: ['Belirtmek istemiyorum', '5.000-15.000 TL', '15.000-30.000 TL', '30.000-50.000 TL', '50.000+ TL'] },
            { id: 'inspiration', question: 'İlham Kaynakları', type: 'textarea', required: false, placeholder: 'Beğendiğiniz örnekler veya referanslar' },
            { id: 'additional', question: 'Ek Notlar', type: 'textarea', required: false, placeholder: 'Eklemek istediğiniz başka bilgiler' },
        ]
    }
];

// Helper function to generate unique token (cryptographically secure)
export function generateBriefToken(): string {
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('hex');
}

// Helper to get template by type
export function getBriefTemplate(type: BriefFormType): BriefTemplate | undefined {
    return briefTemplates.find(t => t.id === type);
}
