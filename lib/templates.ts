import { PageBlock } from "@/context/AgencyContext";

export interface TemplateTheme {
    coverBackground: string;
    coverGradient?: string;
    coverTextColor: string;
    accentColor: string;
    pageBackground: string;
    pageTextColor: string;
}

export interface PageTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    icon: string;
    category: 'brand' | 'portfolio' | 'minimal';
    theme: TemplateTheme;
    blocks: PageBlock[];
}

// Sample placeholder images from Unsplash
const SAMPLE_IMAGES = {
    hero1: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
    hero2: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80",
    brand1: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=800&q=80",
    brand2: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    brand3: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80",
    mockup1: "https://images.unsplash.com/photo-1586717799252-bd134571c579?w=800&q=80",
    mockup2: "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800&q=80",
    mockup3: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
};

export const PAGE_TEMPLATES: PageTemplate[] = [
    // ================================================
    // 1. GLASSMORPHIC AGENCY - Futuristik cam efektli
    // ================================================
    {
        id: "glassmorphic-agency",
        name: "Glassmorphic Agency",
        description: "Futuristic frosted glass aesthetic with floating gradients",
        thumbnail: "/templates/glassmorphic.png",
        icon: "🌫️",
        category: "brand",
        theme: {
            coverBackground: "#0f172a",
            coverGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
            coverTextColor: "#ffffff",
            accentColor: "#3b82f6",
            pageBackground: "#ffffff",
            pageTextColor: "#0f172a"
        },
        blocks: [
            { id: "g1", type: "brand-cover", content: { brandName: "PRISM", tagline: "Digital Experience Studio", year: "2026" }, order: 0, style: { padding: "none", background: "#0f172a", textColor: "#ffffff" } },
            { id: "g2", type: "hero", content: { title: "We Create Digital Magic", subtitle: "Award-winning experiences for forward-thinking brands", backgroundImage: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "g3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Brand Essence", sectionDescription: "A visual language that transcends the ordinary" }, order: 2, style: { padding: "none" } },
            { id: "g4", type: "text", content: { text: "Our identity embodies the intersection of technology and art. Like light through a prism, we transform ideas into multi-dimensional experiences that captivate and inspire." }, order: 3, style: { padding: "lg" } },
            { id: "g5", type: "logo-showcase", content: { logoImage: "", logoDescription: "The Prism mark represents infinite possibilities through refracted light. It symbolizes how we break down complex challenges into beautiful solutions." }, order: 4, style: { padding: "lg" } },
            { id: "g6", type: "color-palette", content: { primaryColors: [{ name: "Deep Space", hex: "#0f172a", rgb: "15, 23, 42" }, { name: "Electric Blue", hex: "#3b82f6", rgb: "59, 130, 246" }, { name: "Frosted White", hex: "#f8fafc", rgb: "248, 250, 252" }], secondaryColors: [{ name: "Glass Border", hex: "#334155" }, { name: "Glow Purple", hex: "#8b5cf6" }, { name: "Accent Teal", hex: "#14b8a6" }, { name: "Neon Pink", hex: "#ec4899" }] }, order: 5, style: { padding: "lg" } },
            { id: "g7", type: "typography-showcase", content: { primaryFont: { name: "Space Grotesk", family: "Space Grotesk, sans-serif", weight: "700" }, secondaryFont: { name: "Inter", family: "Inter, sans-serif", weight: "400" }, fontWeights: [{ weight: "700", sample: "BOLD STATEMENTS" }, { weight: "500", sample: "Interface Elements" }, { weight: "400", sample: "Body text for readability" }] }, order: 6, style: { padding: "lg" } },
            { id: "g8", type: "split", content: { splitImage: SAMPLE_IMAGES.hero1, splitText: "**Glass Morphism Philosophy**\n\nOur design language uses translucent layers, soft edges, and vivid gradients to create depth and visual hierarchy.", imagePosition: "left" }, order: 7, style: { padding: "lg" } },
            { id: "g9", type: "gallery", content: { images: [{ src: SAMPLE_IMAGES.brand1, caption: "Gradient Systems" }, { src: SAMPLE_IMAGES.brand2, caption: "Light Effects" }, { src: SAMPLE_IMAGES.brand3, caption: "3D Elements" }], columns: 3 }, order: 8, style: { padding: "lg" } },
            { id: "g10", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Mobile App" }, { image: SAMPLE_IMAGES.mockup2, label: "Website" }, { image: SAMPLE_IMAGES.mockup3, label: "Dashboard" }] }, order: 9, style: { padding: "lg" } },
            { id: "g11", type: "stats", content: { stats: [{ value: "∞", label: "Possibilities" }, { value: "24/7", label: "Digital Presence" }, { value: "0", label: "Limits" }] }, order: 10, style: { padding: "lg", background: "#0f172a", textColor: "#ffffff" } },
            { id: "g12", type: "quote", content: { quote: "Design is not just what it looks like. Design is how it works in the space between pixels.", author: "Studio Philosophy" }, order: 11, style: { padding: "lg" } }
        ]
    },

    // ================================================
    // 2. EDITORIAL MAGAZINE - Krem kağıt, kırmızı aksan
    // ================================================
    {
        id: "editorial-magazine",
        name: "Editorial Magazine",
        description: "Classic print magazine aesthetic with refined serif typography",
        thumbnail: "/templates/editorial.png",
        icon: "📰",
        category: "brand",
        theme: {
            coverBackground: "#faf8f5",
            coverTextColor: "#1a1a1a",
            accentColor: "#dc2626",
            pageBackground: "#faf8f5",
            pageTextColor: "#1a1a1a"
        },
        blocks: [
            { id: "e1", type: "brand-cover", content: { brandName: "THE EDIT", tagline: "A Journal of Visual Culture", year: "Volume I, 2026" }, order: 0, style: { padding: "none", background: "#faf8f5", textColor: "#1a1a1a" } },
            { id: "e2", type: "text", content: { text: "Founded in 2026, THE EDIT represents a new era of visual storytelling. We believe in the power of thoughtful design, meaningful content, and the enduring value of craft." }, order: 1, style: { padding: "xl", background: "#faf8f5", textColor: "#1a1a1a" } },
            { id: "e3", type: "section-header", content: { sectionNumber: "I", sectionTitle: "Masthead", sectionDescription: "The visual foundation of our editorial identity" }, order: 2, style: { padding: "none", background: "#faf8f5", textColor: "#1a1a1a" } },
            { id: "e4", type: "logo-showcase", content: { logoImage: "", logoDescription: "Our wordmark is set in a custom-drawn serif typeface, echoing the heritage of print while embracing contemporary digital applications." }, order: 3, style: { padding: "lg" } },
            { id: "e5", type: "logo-grid", content: { logoVariants: [{ name: "Masthead", image: "", description: "Primary wordmark" }, { name: "Monogram", image: "", description: "TE mark for social" }, { name: "Stamp", image: "", description: "Editorial seal" }] }, order: 4, style: { padding: "lg" } },
            { id: "e6", type: "section-header", content: { sectionNumber: "II", sectionTitle: "Color System", sectionDescription: "A palette inspired by newsprint and editorial tradition" }, order: 5, style: { padding: "none" } },
            { id: "e7", type: "color-palette", content: { primaryColors: [{ name: "Ink Black", hex: "#1a1a1a", rgb: "26, 26, 26" }, { name: "Paper Cream", hex: "#faf8f5", rgb: "250, 248, 245" }, { name: "Editorial Red", hex: "#dc2626", rgb: "220, 38, 38" }], secondaryColors: [{ name: "Newsprint", hex: "#e5e5e5" }, { name: "Column Rule", hex: "#d4d4d4" }, { name: "Marginalia", hex: "#6b7280" }] }, order: 6, style: { padding: "lg" } },
            { id: "e8", type: "section-header", content: { sectionNumber: "III", sectionTitle: "Typography", sectionDescription: "The voice of our visual language" }, order: 7, style: { padding: "none" } },
            { id: "e9", type: "typography-showcase", content: { primaryFont: { name: "Playfair Display", family: "Playfair Display, serif", weight: "700" }, secondaryFont: { name: "Source Serif Pro", family: "Source Serif Pro, serif", weight: "400" }, fontWeights: [{ weight: "700", sample: "Headlines & Display" }, { weight: "400", sample: "Long-form editorial content that demands attention" }, { weight: "300", sample: "Captions, credits, and fine print" }] }, order: 8, style: { padding: "lg" } },
            { id: "e10", type: "split", content: { splitImage: SAMPLE_IMAGES.mockup1, splitText: "**Print Meets Digital**\n\nOur design system honors editorial tradition while adapting seamlessly to screens of all sizes.", imagePosition: "right" }, order: 9, style: { padding: "lg" } },
            { id: "e11", type: "gallery", content: { images: [{ src: SAMPLE_IMAGES.mockup2, caption: "Cover Layout" }, { src: SAMPLE_IMAGES.mockup3, caption: "Feature Spread" }], columns: 2 }, order: 10, style: { padding: "lg" } },
            { id: "e12", type: "quote", content: { quote: "Typography is the craft of endowing human language with a durable visual form.", author: "Robert Bringhurst" }, order: 11, style: { padding: "lg", background: "#dc2626", textColor: "#ffffff" } }
        ]
    },

    // ================================================
    // 3. BRUTALIST MONO - Siyah beyaz, raw estetik
    // ================================================
    {
        id: "brutalist-mono",
        name: "Brutalist Mono",
        description: "Raw, unpolished monospace-driven anti-design aesthetic",
        thumbnail: "/templates/brutalist.png",
        icon: "⬛",
        category: "brand",
        theme: {
            coverBackground: "#ffffff",
            coverTextColor: "#000000",
            accentColor: "#ff0000",
            pageBackground: "#ffffff",
            pageTextColor: "#000000"
        },
        blocks: [
            { id: "b1", type: "brand-cover", content: { brandName: "BRUT.STD", tagline: "// IDENTITY SYSTEM v1.0.3", year: "[2026]" }, order: 0, style: { padding: "none", background: "#ffffff", textColor: "#000000" } },
            { id: "b2", type: "text", content: { text: "/* BRUTALISM DEFINED */\n\nWe reject decoration. We embrace function. Every pixel serves a purpose. This is not a style—it is a philosophy." }, order: 1, style: { padding: "xl" } },
            { id: "b3", type: "section-header", content: { sectionNumber: "00", sectionTitle: "RULES", sectionDescription: "system.config.rules" }, order: 2, style: { padding: "none" } },
            { id: "b4", type: "logo-showcase", content: { logoImage: "", logoDescription: "// Logo must remain unaltered\n// No shadows, no gradients\n// Monospace only\n// Grid: 8px base unit" }, order: 3, style: { padding: "lg" } },
            { id: "b5", type: "logo-donts", content: { logoDonts: [{ image: "", label: "NO_CURVES" }, { image: "", label: "NO_SHADOWS" }, { image: "", label: "NO_GRADIENTS" }, { image: "", label: "NO_DECORATION" }] }, order: 4, style: { padding: "lg" } },
            { id: "b6", type: "section-header", content: { sectionNumber: "01", sectionTitle: "COLOR_SYSTEM", sectionDescription: "const palette = {}" }, order: 5, style: { padding: "none" } },
            { id: "b7", type: "color-palette", content: { primaryColors: [{ name: "BLACK", hex: "#000000", rgb: "0, 0, 0" }, { name: "WHITE", hex: "#ffffff", rgb: "255, 255, 255" }], secondaryColors: [{ name: "ERROR", hex: "#ff0000" }, { name: "WARNING", hex: "#ffff00" }, { name: "SUCCESS", hex: "#00ff00" }, { name: "INFO", hex: "#00ffff" }] }, order: 6, style: { padding: "lg" } },
            { id: "b8", type: "section-header", content: { sectionNumber: "02", sectionTitle: "TYPOGRAPHY", sectionDescription: "font-family: monospace" }, order: 7, style: { padding: "none" } },
            { id: "b9", type: "typography-showcase", content: { primaryFont: { name: "JetBrains Mono", family: "JetBrains Mono, monospace", weight: "800" }, secondaryFont: { name: "JetBrains Mono", family: "JetBrains Mono, monospace", weight: "400" }, fontWeights: [{ weight: "800", sample: "SYSTEM_HEADER" }, { weight: "700", sample: "section_title" }, { weight: "400", sample: "body_content_01" }, { weight: "300", sample: "meta_data" }] }, order: 8, style: { padding: "lg" } },
            { id: "b10", type: "stats", content: { stats: [{ value: "0", label: "DECORATIONS" }, { value: "100%", label: "FUNCTION" }, { value: "8px", label: "BASE_UNIT" }] }, order: 9, style: { padding: "lg", background: "#000000", textColor: "#ffffff" } },
            { id: "b11", type: "image", content: { image: SAMPLE_IMAGES.brand3, caption: "// interface_example.screenshot" }, order: 10, style: { padding: "lg" } },
            { id: "b12", type: "quote", content: { quote: "Less, but better.", author: "Dieter Rams" }, order: 11, style: { padding: "lg", background: "#ff0000", textColor: "#ffffff" } }
        ]
    },

    // ================================================
    // 4. LUXURY FASHION - Siyah altın haute couture
    // ================================================
    {
        id: "luxury-fashion",
        name: "Luxury Fashion House",
        description: "High-end fashion house with gold accents and refined elegance",
        thumbnail: "/templates/luxury.png",
        icon: "👗",
        category: "brand",
        theme: {
            coverBackground: "#0d0d0d",
            coverTextColor: "#c9a962",
            accentColor: "#c9a962",
            pageBackground: "#f5f0e8",
            pageTextColor: "#0d0d0d"
        },
        blocks: [
            { id: "l1", type: "brand-cover", content: { brandName: "MAISON", tagline: "Haute Couture • Paris", year: "MMXXVI" }, order: 0, style: { padding: "none", background: "#0d0d0d", textColor: "#c9a962" } },
            { id: "l2", type: "hero", content: { title: "Heritage of Excellence", subtitle: "Crafting timeless elegance since 1924", backgroundImage: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "l3", type: "section-header", content: { sectionNumber: "I", sectionTitle: "L'Héritage", sectionDescription: "A century of uncompromising artisanship" }, order: 2, style: { padding: "none", background: "#f5f0e8", textColor: "#0d0d0d" } },
            { id: "l4", type: "text", content: { text: "Maison represents the pinnacle of French savoir-faire. Each creation is a testament to centuries of craftsmanship, meticulously executed by master artisans in our Parisian ateliers." }, order: 3, style: { padding: "lg", background: "#f5f0e8", textColor: "#0d0d0d" } },
            { id: "l5", type: "logo-showcase", content: { logoImage: "", logoDescription: "The monogram, hand-drawn in 1924 by our founder, represents the intertwining of tradition and modernity—a symbol recognized across continents." }, order: 4, style: { padding: "lg" } },
            { id: "l6", type: "section-header", content: { sectionNumber: "II", sectionTitle: "La Palette", sectionDescription: "Colors of distinction" }, order: 5, style: { padding: "none" } },
            { id: "l7", type: "color-palette", content: { primaryColors: [{ name: "Noir Absolu", hex: "#0d0d0d", rgb: "13, 13, 13" }, { name: "Or Champagne", hex: "#c9a962", rgb: "201, 169, 98" }, { name: "Ivoire Soie", hex: "#f5f0e8", rgb: "245, 240, 232" }], secondaryColors: [{ name: "Bordeaux Velours", hex: "#722f37" }, { name: "Platine", hex: "#e5e4e2" }, { name: "Rose Or", hex: "#b76e79" }, { name: "Bleu Nuit", hex: "#1a1a2e" }] }, order: 6, style: { padding: "lg" } },
            { id: "l8", type: "split", content: { splitImage: SAMPLE_IMAGES.mockup1, splitText: "**L'Art du Détail**\n\nEvery seam, every stitch, every fold tells a story of dedication to perfection.", imagePosition: "left" }, order: 7, style: { padding: "lg" } },
            { id: "l9", type: "typography-showcase", content: { primaryFont: { name: "Didot", family: "Didot, serif", weight: "400" }, secondaryFont: { name: "Futura", family: "Futura, sans-serif", weight: "300" }, fontWeights: [{ weight: "400", sample: "Élégance Éternelle" }, { weight: "300", sample: "Refined body text" }] }, order: 8, style: { padding: "lg" } },
            { id: "l10", type: "gallery", content: { images: [{ src: SAMPLE_IMAGES.mockup1, caption: "Invitation Suite" }, { src: SAMPLE_IMAGES.mockup2, caption: "Shopping Experience" }, { src: SAMPLE_IMAGES.mockup3, caption: "VIP Packaging" }], columns: 3 }, order: 9, style: { padding: "lg" } },
            { id: "l11", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Carte de Visite" }, { image: SAMPLE_IMAGES.mockup2, label: "Papier à Lettre" }, { image: SAMPLE_IMAGES.mockup3, label: "Boîte Cadeau" }] }, order: 10, style: { padding: "lg" } },
            { id: "l12", type: "quote", content: { quote: "Elegance is not about being noticed, it is about being remembered.", author: "Giorgio Armani" }, order: 11, style: { padding: "lg", background: "#0d0d0d", textColor: "#c9a962" } }
        ]
    },

    // ================================================
    // 5. TECH STARTUP - Mor gradient SaaS
    // ================================================
    {
        id: "tech-startup",
        name: "Tech Startup",
        description: "Modern SaaS product brand with vibrant purple gradients",
        thumbnail: "/templates/tech-startup.png",
        icon: "🚀",
        category: "brand",
        theme: {
            coverBackground: "#1e1b4b",
            coverGradient: "linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)",
            coverTextColor: "#ffffff",
            accentColor: "#7c3aed",
            pageBackground: "#ffffff",
            pageTextColor: "#1e1b4b"
        },
        blocks: [
            { id: "t1", type: "brand-cover", content: { brandName: "Launchpad", tagline: "Ship faster. Scale smarter.", year: "v2.0" }, order: 0, style: { padding: "none", background: "#1e1b4b", textColor: "#ffffff" } },
            { id: "t2", type: "hero", content: { title: "The Future of Work", subtitle: "Empowering teams to build what matters", backgroundImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "t3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Mission", sectionDescription: "Why we exist" }, order: 2, style: { padding: "none" } },
            { id: "t4", type: "text", content: { text: "We're on a mission to democratize software development. Our platform empowers teams of all sizes to ship products faster, iterate with confidence, and scale without limits." }, order: 3, style: { padding: "lg" } },
            { id: "t5", type: "stats", content: { stats: [{ value: "10M+", label: "Users" }, { value: "150+", label: "Countries" }, { value: "99.9%", label: "Uptime" }] }, order: 4, style: { padding: "lg", background: "#7c3aed", textColor: "#ffffff" } },
            { id: "t6", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Logo System", sectionDescription: "Flexible, scalable, recognizable" }, order: 5, style: { padding: "none" } },
            { id: "t7", type: "logo-showcase", content: { logoImage: "", logoDescription: "Our logo combines a geometric rocket icon with a clean wordmark. The icon can stand alone for app icons and favicons." }, order: 6, style: { padding: "lg" } },
            { id: "t8", type: "logo-grid", content: { logoVariants: [{ name: "Primary", image: "", description: "Full lockup" }, { name: "Icon", image: "", description: "App icon" }, { name: "Wordmark", image: "", description: "Text only" }] }, order: 7, style: { padding: "lg" } },
            { id: "t9", type: "color-palette", content: { primaryColors: [{ name: "Electric Purple", hex: "#7c3aed", rgb: "124, 58, 237" }, { name: "Deep Navy", hex: "#1e1b4b", rgb: "30, 27, 75" }, { name: "Clean White", hex: "#ffffff", rgb: "255, 255, 255" }], secondaryColors: [{ name: "Success", hex: "#22c55e" }, { name: "Warning", hex: "#f59e0b" }, { name: "Error", hex: "#ef4444" }, { name: "Info", hex: "#3b82f6" }] }, order: 8, style: { padding: "lg" } },
            { id: "t10", type: "typography-showcase", content: { primaryFont: { name: "Plus Jakarta Sans", family: "Plus Jakarta Sans, sans-serif", weight: "700" }, secondaryFont: { name: "Inter", family: "Inter, sans-serif", weight: "400" }, fontWeights: [{ weight: "700", sample: "Product Headlines" }, { weight: "500", sample: "Interface labels" }, { weight: "400", sample: "Body text and documentation" }] }, order: 9, style: { padding: "lg" } },
            { id: "t11", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Mobile App" }, { image: SAMPLE_IMAGES.mockup2, label: "Dashboard" }, { image: SAMPLE_IMAGES.mockup3, label: "Marketing Site" }] }, order: 10, style: { padding: "lg" } },
            { id: "t12", type: "quote", content: { quote: "Move fast and build things that last.", author: "Launchpad Team" }, order: 11, style: { padding: "lg", background: "#1e1b4b", textColor: "#7c3aed" } }
        ]
    },

    // ================================================
    // 6. ARCHITECTURE STUDIO - Blueprint mavi
    // ================================================
    {
        id: "architecture-studio",
        name: "Architecture Studio",
        description: "Minimalist grid-based identity inspired by technical drawings",
        thumbnail: "/templates/architecture.png",
        icon: "🏛️",
        category: "brand",
        theme: {
            coverBackground: "#1e40af",
            coverTextColor: "#ffffff",
            accentColor: "#1e40af",
            pageBackground: "#fafafa",
            pageTextColor: "#27272a"
        },
        blocks: [
            { id: "a1", type: "brand-cover", content: { brandName: "ATELIER", tagline: "Architecture • Interior • Design", year: "Est. 2026" }, order: 0, style: { padding: "none", background: "#1e40af", textColor: "#ffffff" } },
            { id: "a2", type: "text", content: { text: "We design spaces that transform how people live, work, and interact. Our approach is rooted in precision, innovation, and a deep respect for context." }, order: 1, style: { padding: "xl", background: "#fafafa", textColor: "#27272a" } },
            { id: "a3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Philosophy", sectionDescription: "Form follows function, but beauty elevates both" }, order: 2, style: { padding: "none" } },
            { id: "a4", type: "split", content: { splitImage: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80", splitText: "**Space & Light**\n\nEvery project begins with understanding how light moves through space. We design environments that breathe.", imagePosition: "left" }, order: 3, style: { padding: "lg" } },
            { id: "a5", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Visual Identity", sectionDescription: "Precision in every detail" }, order: 4, style: { padding: "none" } },
            { id: "a6", type: "logo-showcase", content: { logoImage: "", logoDescription: "The logo is constructed on a precise 8×8 grid, reflecting our commitment to mathematical harmony in design." }, order: 5, style: { padding: "lg" } },
            { id: "a7", type: "color-palette", content: { primaryColors: [{ name: "Concrete", hex: "#4a4545", rgb: "74, 69, 69" }, { name: "Blueprint", hex: "#1e40af", rgb: "30, 64, 175" }, { name: "Paper White", hex: "#fafafa", rgb: "250, 250, 250" }], secondaryColors: [{ name: "Warm Wood", hex: "#92400e" }, { name: "Cool Steel", hex: "#94a3b8" }, { name: "Shadow", hex: "#27272a" }, { name: "Terracotta", hex: "#c2785c" }] }, order: 6, style: { padding: "lg" } },
            { id: "a8", type: "typography-showcase", content: { primaryFont: { name: "Archivo", family: "Archivo, sans-serif", weight: "700" }, secondaryFont: { name: "Archivo", family: "Archivo, sans-serif", weight: "400" }, fontWeights: [{ weight: "700", sample: "PROJECT TITLES" }, { weight: "500", sample: "Section Headers" }, { weight: "400", sample: "Technical specifications and body copy" }] }, order: 7, style: { padding: "lg" } },
            { id: "a9", type: "gallery", content: { images: [{ src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80", caption: "Urban Residence" }, { src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80", caption: "Cultural Center" }, { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", caption: "Private Villa" }], columns: 3 }, order: 8, style: { padding: "lg" } },
            { id: "a10", type: "stats", content: { stats: [{ value: "47", label: "Projects" }, { value: "12", label: "Awards" }, { value: "8", label: "Countries" }] }, order: 9, style: { padding: "lg", background: "#1e40af", textColor: "#ffffff" } },
            { id: "a11", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Business Cards" }, { image: SAMPLE_IMAGES.mockup2, label: "Project Proposal" }, { image: SAMPLE_IMAGES.mockup3, label: "Site Signage" }] }, order: 10, style: { padding: "lg" } },
            { id: "a12", type: "quote", content: { quote: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.", author: "Le Corbusier" }, order: 11, style: { padding: "lg", background: "#27272a", textColor: "#fafafa" } }
        ]
    },

    // ================================================
    // 7. ORGANIC ARTISAN - Yeşil doğal
    // ================================================
    {
        id: "organic-artisan",
        name: "Organic Artisan",
        description: "Handcrafted earthy brand identity for sustainable businesses",
        thumbnail: "/templates/organic.png",
        icon: "🌿",
        category: "brand",
        theme: {
            coverBackground: "#2d5a3d",
            coverTextColor: "#f5f1eb",
            accentColor: "#c2785c",
            pageBackground: "#f5f1eb",
            pageTextColor: "#2d5a3d"
        },
        blocks: [
            { id: "o1", type: "brand-cover", content: { brandName: "Terra", tagline: "Handcrafted with Care", year: "Since 2026" }, order: 0, style: { padding: "none", background: "#2d5a3d", textColor: "#f5f1eb" } },
            { id: "o2", type: "hero", content: { title: "From Earth, With Love", subtitle: "Sustainable goods for conscious living", backgroundImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "o3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Our Values", sectionDescription: "What guides every decision we make" }, order: 2, style: { padding: "none", background: "#f5f1eb", textColor: "#2d5a3d" } },
            { id: "o4", type: "text", content: { text: "Terra was born from a simple belief: that everyday objects should be beautiful, functional, and kind to our planet. We partner with artisans who share our commitment to sustainable practices." }, order: 3, style: { padding: "lg" } },
            { id: "o5", type: "split", content: { splitImage: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80", splitText: "**Made by Hand**\n\nEvery product is crafted by skilled artisans using traditional techniques passed down through generations.", imagePosition: "right" }, order: 4, style: { padding: "lg" } },
            { id: "o6", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Brand Identity", sectionDescription: "A visual language rooted in nature" }, order: 5, style: { padding: "none" } },
            { id: "o7", type: "logo-showcase", content: { logoImage: "", logoDescription: "Our logo features an organic leaf mark that evolves with the seasons—a living symbol of our connection to the earth." }, order: 6, style: { padding: "lg" } },
            { id: "o8", type: "color-palette", content: { primaryColors: [{ name: "Forest Moss", hex: "#2d5a3d", rgb: "45, 90, 61" }, { name: "Raw Cotton", hex: "#f5f1eb", rgb: "245, 241, 235" }, { name: "Terra Cotta", hex: "#c2785c", rgb: "194, 120, 92" }], secondaryColors: [{ name: "Dried Herb", hex: "#a3b18a" }, { name: "Warm Sand", hex: "#ddd5c7" }, { name: "Charred Wood", hex: "#3d3d3d" }, { name: "Clay", hex: "#b5651d" }] }, order: 7, style: { padding: "lg" } },
            { id: "o9", type: "typography-showcase", content: { primaryFont: { name: "Fraunces", family: "Fraunces, serif", weight: "600" }, secondaryFont: { name: "Nunito Sans", family: "Nunito Sans, sans-serif", weight: "400" }, fontWeights: [{ weight: "600", sample: "Artisan Headlines" }, { weight: "400", sample: "Natural body text for storytelling" }] }, order: 8, style: { padding: "lg" } },
            { id: "o10", type: "gallery", content: { images: [{ src: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80", caption: "Ceramics" }, { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", caption: "Textiles" }], columns: 2 }, order: 9, style: { padding: "lg" } },
            { id: "o11", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Packaging" }, { image: SAMPLE_IMAGES.mockup2, label: "Tags & Labels" }, { image: SAMPLE_IMAGES.mockup3, label: "Website" }] }, order: 10, style: { padding: "lg" } },
            { id: "o12", type: "quote", content: { quote: "The finest materials, the most honorable techniques, the deepest respect for our planet.", author: "Terra Manifesto" }, order: 11, style: { padding: "lg", background: "#c2785c", textColor: "#f5f1eb" } }
        ]
    },

    // ================================================
    // 8. DARK NOIR - Sinematik siyah
    // ================================================
    {
        id: "dark-noir",
        name: "Dark Noir",
        description: "Cinematic high-contrast identity with dramatic lighting",
        thumbnail: "/templates/dark-noir.png",
        icon: "🎬",
        category: "brand",
        theme: {
            coverBackground: "#050505",
            coverTextColor: "#f5f5f5",
            accentColor: "#dc2626",
            pageBackground: "#1a1a1a",
            pageTextColor: "#f5f5f5"
        },
        blocks: [
            { id: "n1", type: "brand-cover", content: { brandName: "SHADOW", tagline: "Visual Identity System", year: "2026" }, order: 0, style: { padding: "none", background: "#050505", textColor: "#f5f5f5" } },
            { id: "n2", type: "hero", content: { title: "Step Into Darkness", subtitle: "Where mystery meets mastery", backgroundImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "n3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Atmosphere", sectionDescription: "Mood, drama, and visual tension" }, order: 2, style: { padding: "none", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n4", type: "text", content: { text: "SHADOW is a visual identity built on contrast—light against dark, silence against sound, stillness against motion. We embrace the power of negative space and the drama of the unseen." }, order: 3, style: { padding: "lg", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n5", type: "image", content: { image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&q=80", caption: "Frame from opening sequence" }, order: 4, style: { padding: "none" } },
            { id: "n6", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Color & Light", sectionDescription: "A palette of shadows" }, order: 5, style: { padding: "none", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n7", type: "color-palette", content: { primaryColors: [{ name: "Void", hex: "#050505", rgb: "5, 5, 5" }, { name: "Smoke", hex: "#6b7280", rgb: "107, 114, 128" }, { name: "Spotlight", hex: "#f5f5f5", rgb: "245, 245, 245" }], secondaryColors: [{ name: "Neon Red", hex: "#dc2626" }, { name: "Film Grain", hex: "#a3a3a3" }, { name: "Amber Glow", hex: "#f59e0b" }, { name: "Midnight Blue", hex: "#1e3a8a" }] }, order: 6, style: { padding: "lg", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n8", type: "split", content: { splitImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&q=80", splitText: "**Chiaroscuro**\n\nWe harness the interplay of light and shadow to create images that pulse with emotional intensity.", imagePosition: "left" }, order: 7, style: { padding: "lg", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n9", type: "typography-showcase", content: { primaryFont: { name: "Bebas Neue", family: "Bebas Neue, sans-serif", weight: "400" }, secondaryFont: { name: "DM Sans", family: "DM Sans, sans-serif", weight: "400" }, fontWeights: [{ weight: "400", sample: "DRAMATIC HEADLINES" }, { weight: "400", sample: "Supporting narrative text" }] }, order: 8, style: { padding: "lg", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n10", type: "gallery", content: { images: [{ src: SAMPLE_IMAGES.brand1, caption: "Scene I" }, { src: SAMPLE_IMAGES.brand2, caption: "Scene II" }, { src: SAMPLE_IMAGES.brand3, caption: "Scene III" }], columns: 3 }, order: 9, style: { padding: "lg", background: "#1a1a1a", textColor: "#f5f5f5" } },
            { id: "n11", type: "stats", content: { stats: [{ value: "∞", label: "Stories" }, { value: "1", label: "Vision" }, { value: "0", label: "Compromise" }] }, order: 10, style: { padding: "lg", background: "#050505", textColor: "#f5f5f5" } },
            { id: "n12", type: "quote", content: { quote: "In the dark, all colors agree.", author: "Francis Bacon" }, order: 11, style: { padding: "lg", background: "#dc2626", textColor: "#ffffff" } }
        ]
    },

    // ================================================
    // 9. RETRO GRADIENT - Pembe neon 80s
    // ================================================
    {
        id: "retro-gradient",
        name: "Retro Gradient",
        description: "80s-inspired vibrant gradients and bold typography",
        thumbnail: "/templates/retro-gradient.png",
        icon: "🌈",
        category: "brand",
        theme: {
            coverBackground: "#1e1b4b",
            coverGradient: "linear-gradient(135deg, #ec4899 0%, #f97316 50%, #06b6d4 100%)",
            coverTextColor: "#ffffff",
            accentColor: "#ec4899",
            pageBackground: "#ffffff",
            pageTextColor: "#1e1b4b"
        },
        blocks: [
            { id: "r1", type: "brand-cover", content: { brandName: "NEON", tagline: "Retro Future Vibes", year: "2026" }, order: 0, style: { padding: "none", background: "#1e1b4b", textColor: "#ec4899" } },
            { id: "r2", type: "hero", content: { title: "Blast From The Future", subtitle: "Where nostalgia meets tomorrow", backgroundImage: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80" }, order: 1, style: { padding: "xl" } },
            { id: "r3", type: "section-header", content: { sectionNumber: "01", sectionTitle: "The Vibe", sectionDescription: "Bold, electric, unapologetically vibrant" }, order: 2, style: { padding: "none" } },
            { id: "r4", type: "text", content: { text: "NEON is a celebration of maximalism. We embrace bold colors, dynamic gradients, and typography that demands attention. Every element is designed to spark joy and evoke the electric energy of the 1980s." }, order: 3, style: { padding: "lg" } },
            { id: "r5", type: "stats", content: { stats: [{ value: "100%", label: "Bold" }, { value: "∞", label: "Colors" }, { value: "80s", label: "Inspired" }] }, order: 4, style: { padding: "lg", background: "#ec4899", textColor: "#ffffff" } },
            { id: "r6", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Color Explosion", sectionDescription: "A palette that screams" }, order: 5, style: { padding: "none" } },
            { id: "r7", type: "color-palette", content: { primaryColors: [{ name: "Hot Pink", hex: "#ec4899", rgb: "236, 72, 153" }, { name: "Electric Cyan", hex: "#06b6d4", rgb: "6, 182, 212" }, { name: "Sunset Orange", hex: "#f97316", rgb: "249, 115, 22" }], secondaryColors: [{ name: "Deep Purple", hex: "#7c3aed" }, { name: "Laser Lime", hex: "#84cc16" }, { name: "Midnight", hex: "#1e1b4b" }, { name: "Gold", hex: "#eab308" }] }, order: 6, style: { padding: "lg" } },
            { id: "r8", type: "split", content: { splitImage: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80", splitText: "**Gradient Magic**\n\nOur gradients transition through the spectrum, creating visual movement that captures the eye and ignites the imagination.", imagePosition: "right" }, order: 7, style: { padding: "lg" } },
            { id: "r9", type: "typography-showcase", content: { primaryFont: { name: "Satoshi", family: "Satoshi, sans-serif", weight: "900" }, secondaryFont: { name: "Satoshi", family: "Satoshi, sans-serif", weight: "400" }, fontWeights: [{ weight: "900", sample: "MAXIMUM IMPACT" }, { weight: "700", sample: "Strong statements" }, { weight: "400", sample: "Smooth flowing copy" }] }, order: 8, style: { padding: "lg" } },
            { id: "r10", type: "gallery", content: { images: [{ src: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80", caption: "Chrome Dreams" }, { src: SAMPLE_IMAGES.brand2, caption: "Neon Nights" }], columns: 2 }, order: 9, style: { padding: "lg" } },
            { id: "r11", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Cassette Sleeve" }, { image: SAMPLE_IMAGES.mockup2, label: "Poster Series" }, { image: SAMPLE_IMAGES.mockup3, label: "Merch" }] }, order: 10, style: { padding: "lg" } },
            { id: "r12", type: "quote", content: { quote: "Life's too short for boring design.", author: "NEON Manifesto" }, order: 11, style: { padding: "lg", background: "#06b6d4", textColor: "#1e1b4b" } }
        ]
    },

    // ================================================
    // 10. CORPORATE PREMIUM - Kurumsal mavi
    // ================================================
    {
        id: "corporate-premium",
        name: "Corporate Premium",
        description: "Professional enterprise-level identity system",
        thumbnail: "/templates/corporate.png",
        icon: "💼",
        category: "brand",
        theme: {
            coverBackground: "#0f4c81",
            coverTextColor: "#ffffff",
            accentColor: "#0f4c81",
            pageBackground: "#ffffff",
            pageTextColor: "#1e3a5f"
        },
        blocks: [
            { id: "c1", type: "brand-cover", content: { brandName: "ENTERPRISE", tagline: "Corporate Identity Guidelines", year: "Q1 2026" }, order: 0, style: { padding: "none", background: "#0f4c81", textColor: "#ffffff" } },
            { id: "c2", type: "section-header", content: { sectionNumber: "01", sectionTitle: "Brand Standards", sectionDescription: "Consistency builds trust" }, order: 1, style: { padding: "none" } },
            { id: "c3", type: "text", content: { text: "Enterprise is built on a foundation of trust, reliability, and innovation. Our visual identity reflects these values through clean design, consistent application, and thoughtful attention to detail." }, order: 2, style: { padding: "lg" } },
            { id: "c4", type: "logo-showcase", content: { logoImage: "", logoDescription: "The Enterprise logo symbolizes stability and forward momentum. The geometric mark represents our commitment to precision and our vision for the future." }, order: 3, style: { padding: "lg" } },
            { id: "c5", type: "logo-grid", content: { logoVariants: [{ name: "Primary", image: "", description: "Full color on white" }, { name: "Reversed", image: "", description: "White on dark backgrounds" }, { name: "Monochrome", image: "", description: "Single color applications" }] }, order: 4, style: { padding: "lg" } },
            { id: "c6", type: "logo-donts", content: { logoDonts: [{ image: "", label: "Don't distort" }, { image: "", label: "Don't recolor" }, { image: "", label: "Don't add effects" }, { image: "", label: "Don't crowd" }] }, order: 5, style: { padding: "lg" } },
            { id: "c7", type: "section-header", content: { sectionNumber: "02", sectionTitle: "Color System", sectionDescription: "Our palette communicates trust and professionalism" }, order: 6, style: { padding: "none" } },
            { id: "c8", type: "color-palette", content: { primaryColors: [{ name: "Corporate Blue", hex: "#0f4c81", rgb: "15, 76, 129" }, { name: "Trustworthy Navy", hex: "#1e3a5f", rgb: "30, 58, 95" }, { name: "Professional White", hex: "#ffffff", rgb: "255, 255, 255" }], secondaryColors: [{ name: "Success Green", hex: "#059669" }, { name: "Alert Orange", hex: "#ea580c" }, { name: "Neutral Gray", hex: "#6b7280" }, { name: "Light Background", hex: "#f3f4f6" }] }, order: 7, style: { padding: "lg" } },
            { id: "c9", type: "section-header", content: { sectionNumber: "03", sectionTitle: "Typography", sectionDescription: "Clear, professional, accessible" }, order: 8, style: { padding: "none" } },
            { id: "c10", type: "typography-showcase", content: { primaryFont: { name: "IBM Plex Sans", family: "IBM Plex Sans, sans-serif", weight: "600" }, secondaryFont: { name: "IBM Plex Sans", family: "IBM Plex Sans, sans-serif", weight: "400" }, fontWeights: [{ weight: "600", sample: "Executive Headlines" }, { weight: "500", sample: "Section headers" }, { weight: "400", sample: "Professional body copy for all communications" }] }, order: 9, style: { padding: "lg" } },
            { id: "c11", type: "stats", content: { stats: [{ value: "Fortune 500", label: "Clients" }, { value: "25+", label: "Years" }, { value: "Global", label: "Reach" }] }, order: 10, style: { padding: "lg", background: "#0f4c81", textColor: "#ffffff" } },
            { id: "c12", type: "mockup-grid", content: { mockups: [{ image: SAMPLE_IMAGES.mockup1, label: "Business Cards" }, { image: SAMPLE_IMAGES.mockup2, label: "Letterhead" }, { image: SAMPLE_IMAGES.mockup3, label: "Presentation" }] }, order: 11, style: { padding: "lg" } },
            { id: "c13", type: "quote", content: { quote: "Consistency is not just about looking the same—it's about feeling the same everywhere.", author: "Enterprise Brand Team" }, order: 12, style: { padding: "lg", background: "#1e3a5f", textColor: "#ffffff" } }
        ]
    }
];

export function getTemplateById(id: string): PageTemplate | undefined {
    return PAGE_TEMPLATES.find(t => t.id === id);
}

export function generateBlockId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTemplatesByCategory(category: PageTemplate['category']): PageTemplate[] {
    return PAGE_TEMPLATES.filter(t => t.category === category);
}
