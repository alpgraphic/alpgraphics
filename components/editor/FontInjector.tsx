"use client";

import { useEffect } from "react";
import { ProjectFont } from "@/context/AgencyContext";

interface FontInjectorProps {
    fonts: ProjectFont[];
    selectedFontId?: string;
}

export default function FontInjector({ fonts, selectedFontId }: FontInjectorProps) {
    useEffect(() => {
        // Create or update style tag for custom fonts
        let styleTag = document.getElementById('custom-fonts-style') as HTMLStyleElement;

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-fonts-style';
            document.head.appendChild(styleTag);
        }

        // Generate @font-face rules for all fonts
        const fontFaceRules = fonts.map(font => {
            return `
@font-face {
    font-family: '${font.family}';
    src: url('${font.base64Data}') format('${font.format}');
    font-display: swap;
}`;
        }).join('\n');

        // Add global CSS variable for selected font
        const selectedFont = fonts.find(f => f.id === selectedFontId);
        const globalFontRule = selectedFont
            ? `
:root {
    --project-font: '${selectedFont.family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.project-content {
    font-family: var(--project-font);
}`
            : '';

        styleTag.textContent = fontFaceRules + globalFontRule;

        return () => {
            // Cleanup on unmount
            styleTag?.remove();
        };
    }, [fonts, selectedFontId]);

    return null; // This component doesn't render anything
}
