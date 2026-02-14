// Brand Page System Types

export interface LogoVariants {
    light?: string;  // Logo for light backgrounds
    dark?: string;   // Logo for dark backgrounds
    iconLight?: string;
    iconDark?: string;
    grid?: string;     // Construction grid (optional)
    anatomy?: string;  // Anatomy/measurements (optional)
}

export interface CustomFont {
    name: string;
    file: string;  // Font file path
    weights: number[];  // [400, 700, 900]
    type: 'heading' | 'body';
}

export interface ColorPalette {
    primary: string;    // HEX
    secondary: string;
    accent?: string;
    colors?: Array<{
        name: string;
        hex: string;
        rgb?: string;
        cmyk?: string;
        pantone?: string;
    }>;
}

export interface MockupImage {
    url: string;
    category: 'digital_web' | 'digital_mobile' | 'digital_social' | 'print_card' | 'print_brochure' | 'physical_packaging' | 'physical_signage' | 'other';
    categoryLabel: string;
}

export interface SectionConfig {
    id: string;
    type: 'hero' | 'story' | 'logo' | 'colors' | 'typography' | 'mockups' | 'footer';
    enabled: boolean;
    order: number;
    data?: Record<string, any>;
}

export interface BrandPage {
    id: string;
    linkedAccountId?: number; // Links to Account from AgencyContext
    brandName: string;
    tagline?: string;
    story?: string;
    storyFeaturedImage?: string;  // Featured image for Brand Story section
    logos: LogoVariants;
    fonts: {
        heading?: CustomFont;
        body?: CustomFont;
    };
    colors: ColorPalette;
    mockups: MockupImage[];
    sections: SectionConfig[];
    template: 'editorial-luxury' | 'minimal-clean' | 'tech-modern' | 'organic-natural' | 'bold-playful' | 'social-media';
    heroConfig?: {
        categoryLabel?: string;  // "Brand Identity", "Logo Guidelines", etc.
        categoryLabelColor?: string;  // Custom color for category label
        copyrightText?: string;
        year?: string;
        logoSize?: number;  // 200-600px
    };
    textOverrides?: {
        // Logo Showcase Section
        logoShowcaseTitle?: string;
        logoShowcaseSubtitle?: string;
        // Color Section
        colorTitle?: string;
        colorSubtitle?: string;
        // Typography Section
        typographyTitle?: string;
        typographySubtitle?: string;
        // Mockups Section
        mockupsTitle?: string;
        mockupsSubtitle?: string;
        // Footer Section
        footerTitle?: string;
        footerSubtitle?: string;
        footerEmail?: string;
        footerCopyright?: string;
    };
    sizeConfig?: {
        // Logo sizes in Logo Showcase
        logoLightSize?: number;  // 100-400px
        logoDarkSize?: number;
        iconLightSize?: number;
        iconDarkSize?: number;
        // Font sizes
        headingFontSize?: number;  // 40-120px
        bodyFontSize?: number;  // 14-32px
    };
    // Social Media Presentation specific fields
    socialMediaStrategy?: {
        goals?: Array<{ title: string; description: string; icon?: string }>;
        contentPillars?: Array<{ title: string; description: string; color?: string; icon?: string; image?: string }>;
        platformStrategy?: Array<{ platform: string; tone: string; frequency: string; contentTypes: string[]; icon?: string }>;
        hashtagStrategy?: {
            branded?: string[];
            industry?: string[];
            campaign?: string[];
        };
        calendarData?: Array<{
            day: string;
            platform: string;
            contentType: string;
            description: string;
            time?: string;
            color?: string;
        }>;
        kpiMetrics?: Array<{ metric: string; target: string; icon?: string }>;
        targetAudience?: Array<{ persona: string; age: string; interests: string[]; platforms: string[] }>;
        brandVoice?: {
            tone?: string[];
            doList?: string[];
            dontList?: string[];
        };
        mockupGridCols?: number;
    };

    aiDecisions?: {
        heroBackground: string;
        logoSize: string;
        contrastIssues: string[];
    };
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt: string;
}

export interface BrandPageFormData {
    brandName: string;
    tagline: string;
    story: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
}
