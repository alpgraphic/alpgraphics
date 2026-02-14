"use client";

import { useEffect } from "react";
import EditorialLuxury from "./templates/EditorialLuxury";
import MinimalClean from "./templates/MinimalClean";
import TechModern from "./templates/TechModern";
import OrganicNatural from "./templates/OrganicNatural";
import BoldPlayful from "./templates/BoldPlayful";
import SocialMediaPresentation from "./templates/SocialMediaPresentation";
import { BrandPage } from "@/lib/brandPageTypes";

interface LivePreviewProps {
    brandPage: BrandPage;
}

const templateComponents = {
    'editorial-luxury': EditorialLuxury,
    'minimal-clean': MinimalClean,
    'tech-modern': TechModern,
    'organic-natural': OrganicNatural,
    'bold-playful': BoldPlayful,
    'social-media': SocialMediaPresentation,
};

export default function LivePreview({ brandPage }: LivePreviewProps) {
    const TemplateComponent = templateComponents[brandPage.template] || EditorialLuxury;

    // Sanitize font name/URL to prevent CSS injection
    const sanitizeCSSValue = (value: string): string => {
        // Remove characters that could break out of CSS context
        return value.replace(/['"\\;{}()]/g, '').trim();
    };

    const isValidFontUrl = (url: string): boolean => {
        // Only allow data: URIs (base64), blob: URIs, and same-origin URLs
        if (url.startsWith('data:') || url.startsWith('blob:')) return true;
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.origin === window.location.origin;
        } catch {
            return false;
        }
    };

    // Inject custom fonts into CSS
    useEffect(() => {
        const styleId = 'brand-page-custom-fonts';
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        let fontFaces = '';

        // Heading font
        if (brandPage.fonts?.heading?.file && brandPage.fonts?.heading?.name) {
            const fontUrl = brandPage.fonts.heading.file;
            const fontName = sanitizeCSSValue(brandPage.fonts.heading.name);
            if (isValidFontUrl(fontUrl) && fontName) {
                fontFaces += `
                    @font-face {
                        font-family: '${fontName}';
                        src: url('${fontUrl}');
                        font-display: swap;
                    }
                `;
            }
        }

        // Body font
        if (brandPage.fonts?.body?.file && brandPage.fonts?.body?.name) {
            const fontUrl = brandPage.fonts.body.file;
            const fontName = sanitizeCSSValue(brandPage.fonts.body.name);
            if (isValidFontUrl(fontUrl) && fontName) {
                fontFaces += `
                    @font-face {
                        font-family: '${fontName}';
                        src: url('${fontUrl}');
                        font-display: swap;
                    }
                `;
            }
        }

        styleEl.textContent = fontFaces;

        return () => {
            // Cleanup on unmount
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, [brandPage.fonts?.heading?.file, brandPage.fonts?.heading?.name, brandPage.fonts?.body?.file, brandPage.fonts?.body?.name]);

    // Background color based on template
    const bgColors: Record<string, string> = {
        'editorial-luxury': 'bg-[#f5f3e9]',
        'minimal-clean': 'bg-white',
        'tech-modern': 'bg-[#0a0a0a]',
        'organic-natural': 'bg-[#f5f2ed]',
        'bold-playful': 'bg-white',
        'social-media': 'bg-[#fafaf8]',
    };

    return (
        <div className={`h-screen overflow-y-auto ${bgColors[brandPage.template] || 'bg-[#f5f3e9]'}`}>
            {/* Preview Frame */}
            <div className="min-h-screen">
                <TemplateComponent brandPage={brandPage} />
            </div>

            {/* Preview Indicator */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="px-4 py-2 bg-black/80 text-white text-xs font-mono rounded-full backdrop-blur-sm">
                    👁️ Live Preview
                </div>
            </div>
        </div>
    );
}
