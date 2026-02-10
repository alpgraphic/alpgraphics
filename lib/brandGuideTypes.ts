// Brand Guidelines Data Types
// Common data structure used by all 10 templates

export interface ColorDef {
    name: string;
    hex: string;
    rgb?: string;
    cmyk?: string;
    pantone?: string;
}

export interface FontDef {
    name: string;
    family: string;
    weights: string[];
    sampleText?: string;
}

export interface MockupDef {
    type: 'business-card' | 'letterhead' | 'envelope' | 'social' | 'billboard' | 'packaging' | 'website' | 'app' | 'signage' | 'merchandise';
    image?: string;
    label: string;
}

export interface LogoVariant {
    name: string;
    image?: string;
    description: string;
}

export interface LogoDont {
    image?: string;
    description: string;
}

export interface BrandGuideData {
    // Template
    templateId: string;

    // Linked Project (for client integration)
    linkedProjectId?: number;
    isPublished?: boolean;

    // Cover
    brandName: string;
    tagline: string;
    coverLogo?: string;
    year: string;

    // Mission/Story
    missionTitle: string;
    missionText: string;

    // Logo Primary
    primaryLogo?: string;
    logoDescription: string;

    // Logo Variants (managed from sidebar)
    verticalLogo?: string;
    iconLogo?: string;
    logoVariants: LogoVariant[];

    // Logo Rules
    logoDonts: LogoDont[];
    minimumSize: string;
    clearSpace: string;

    // Colors
    primaryColors: ColorDef[];
    secondaryColors: ColorDef[];

    // Typography
    headingFont: FontDef;
    bodyFont: FontDef;

    // Visual Style
    brandImages: string[];
    imageStyle: string;

    // Mockups
    mockups: MockupDef[];

    // Contact/Footer
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    socialLinks?: { platform: string; url: string }[];

    // Section Colors (for full customization)
    sectionColors?: {
        coverBg?: string;
        coverText?: string;
        sectionBg1?: string;
        sectionText1?: string;
        sectionBg2?: string;
        sectionText2?: string;
        accentBg?: string;
        accentText?: string;
        footerBg?: string;
        footerText?: string;
    };

    // Hidden Sections (for section removal)
    hiddenSections?: string[];

    // Table of Contents (editable)
    tableOfContents?: { num: string; title: string }[];

    // Values (editable)
    values?: { title: string; description: string; icon?: string }[];

    // Target Audience (editable)
    targetAudience?: { name: string; description: string }[];

    // Tone of Voice (editable)
    toneOfVoice?: {
        doList?: string[];
        dontList?: string[];
    };

    // Type Sizes (editable)
    typeSizes?: { size: string; name: string; weight: string }[];

    // Color Ratios (editable)
    colorRatios?: { percentage: number; label: string; color: string }[];

    // Icon Specs (editable)
    iconSpecs?: { title: string; value: string }[];

    // Social Media Sizes (editable)
    socialMediaSizes?: { platform: string; size: string; ratio: string }[];

    // Accessibility Rules (editable)
    accessibilityRules?: { title: string; description: string }[];

    // Patterns (uploadable)
    patterns?: string[];

    // Photography Rules (editable)
    photoRules?: string[];
}

// Default empty brand guide data
export const emptyBrandGuide: BrandGuideData = {
    templateId: 'minimal-swiss',
    brandName: 'Marka Adı',
    tagline: 'Marka Sloganı',
    year: new Date().getFullYear().toString(),
    missionTitle: 'Misyonumuz',
    missionText: 'Markanızın hikayesini ve misyonunu buraya yazın.',
    logoDescription: 'Logonuzun tasarım felsefesini ve anlamını açıklayın.',
    logoVariants: [
        { name: 'Yatay Logo', description: 'Yatay kullanımlar için' },
        { name: 'Dikey Logo', description: 'Dikey kullanımlar için' },
        { name: 'İkon', description: 'App ikonları ve favicon için' },
    ],
    logoDonts: [
        { description: 'Logoyu esnetmeyin' },
        { description: 'Renkleri değiştirmeyin' },
        { description: 'Gölge eklemeyin' },
        { description: 'Döndürmeyin' },
    ],
    minimumSize: '20mm',
    clearSpace: 'Logo yüksekliğinin %25\'i',
    primaryColors: [
        { name: 'Primary', hex: '#000000', rgb: '0, 0, 0' },
        { name: 'Secondary', hex: '#ffffff', rgb: '255, 255, 255' },
    ],
    secondaryColors: [
        { name: 'Accent', hex: '#a62932', rgb: '166, 41, 50' },
    ],
    headingFont: {
        name: 'Montserrat',
        family: 'Montserrat, sans-serif',
        weights: ['700', '900'],
    },
    bodyFont: {
        name: 'Inter',
        family: 'Inter, sans-serif',
        weights: ['400', '500'],
    },
    brandImages: [],
    imageStyle: 'Markanızın görsel dilini tanımlayın.',
    mockups: [
        { type: 'business-card', label: 'Kartvizit' },
        { type: 'letterhead', label: 'Antetli Kağıt' },
        { type: 'social', label: 'Sosyal Medya' },
    ],
    // Editable fields with defaults
    values: [
        { title: 'Yenilikçilik', description: 'Her zaman yeni çözümler arıyoruz' },
        { title: 'Güvenilirlik', description: 'Sözümüzü tutar, işimizin arkasında dururuz' },
        { title: 'Sürdürülebilirlik', description: 'Gelecek nesiller için sorumluluk alıyoruz' },
        { title: 'Mükemmellik', description: 'En iyi sonuç için çaba gösteririz' },
    ],
    targetAudience: [
        { name: 'Profesyoneller', description: '25-45 yaş arası, şehirde yaşayan, teknoloji ile barışık bireyler.' },
        { name: 'Girişimciler', description: 'Yeni iş fırsatları arayan, risk alabilen dinamik kişiler.' },
        { name: 'Yaratıcılar', description: 'Sanat ve tasarıma ilgi duyan, özgün düşünen kesim.' },
    ],
    toneOfVoice: {
        doList: ['Samimi ama profesyonel', 'Bilgili ama ukala değil', 'Özgüvenli ama mütevazı', 'Modern ama zamansız'],
        dontList: ['Aşırı resmi veya robotik', 'Jargon dolu veya karmaşık', 'Agresif satışçı', 'Negatif veya şikayetçi'],
    },
    tableOfContents: [
        { num: '01', title: 'Marka Hikayesi' },
        { num: '02', title: 'Misyon & Vizyon' },
        { num: '03', title: 'Marka Değerleri' },
        { num: '04', title: 'Hedef Kitle' },
        { num: '05', title: 'Marka Sesi' },
        { num: '06', title: 'Logo' },
        { num: '07', title: 'Logo Varyasyonları' },
        { num: '08', title: 'Logo Yapısı' },
        { num: '09', title: 'Logo Kullanım Kuralları' },
        { num: '10', title: 'Renk Paleti' },
        { num: '11', title: 'Tipografi' },
        { num: '12', title: 'Fotoğraf Stili' },
        { num: '13', title: 'İkon Sistemi' },
        { num: '14', title: 'Pattern & Doku' },
        { num: '15', title: 'Sosyal Medya' },
        { num: '16', title: 'Kırtasiye' },
        { num: '17', title: 'Dijital Uygulamalar' },
        { num: '18', title: 'Erişilebilirlik' },
    ],
    photoRules: ['Doğal ışık kullanın', 'Sıcak tonları tercih edin', 'İnsanları doğal anlarında gösterin'],
    socialMediaSizes: [
        { platform: 'Instagram', size: '1080×1080', ratio: '1:1' },
        { platform: 'LinkedIn', size: '1200×627', ratio: '1.91:1' },
        { platform: 'Twitter/X', size: '1600×900', ratio: '16:9' },
    ],
};

// Template definitions
export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    icon: string;
}

export const BRAND_TEMPLATES: TemplateDefinition[] = [
    { id: 'minimal-swiss', name: 'Minimal Swiss', description: 'Helvetica, grid-based, siyah-beyaz, çok boşluk', thumbnail: '/templates/minimal-swiss.png', icon: '⬜' },
    { id: 'dark-premium', name: 'Dark Premium', description: 'Koyu arka plan, altın detaylar, lüks his', thumbnail: '/templates/dark-premium.png', icon: '🖤' },
    { id: 'editorial-classic', name: 'Editorial Classic', description: 'Dergi stili, serif fontlar, çizgiler', thumbnail: '/templates/editorial.png', icon: '📰' },
    { id: 'tech-modern', name: 'Tech Modern', description: 'Gradient, rounded corners, canlı renkler', thumbnail: '/templates/tech.png', icon: '🚀' },
    { id: 'organic-natural', name: 'Organic Natural', description: 'Yumuşak renkler, doğal his', thumbnail: '/templates/organic.png', icon: '🌿' },
    { id: 'bauhaus-geometric', name: 'Bauhaus Geometric', description: 'Geometrik şekiller, primary colors, bold', thumbnail: '/templates/bauhaus.png', icon: '🔷' },
    { id: 'corporate-blue', name: 'Corporate Blue', description: 'Klasik kurumsal, güvenilir, profesyonel', thumbnail: '/templates/corporate.png', icon: '💼' },
    { id: 'fashion-luxe', name: 'Fashion Luxe', description: 'Siyah-beyaz, ince çizgiler, zarif', thumbnail: '/templates/fashion.png', icon: '👗' },
    { id: 'playful-creative', name: 'Playful Creative', description: 'Renkli, dinamik layout, eğlenceli', thumbnail: '/templates/playful.png', icon: '🎨' },
    { id: 'brutalist-raw', name: 'Brutalist Raw', description: 'Monospace, sert kenarlar, anti-design', thumbnail: '/templates/brutalist.png', icon: '⬛' },
    { id: 'avant-garde', name: 'Avant-Garde', description: 'Ultra-minimalist, çarpıcı, sıra dışı', thumbnail: '/templates/avant.png', icon: '◆' },
];
