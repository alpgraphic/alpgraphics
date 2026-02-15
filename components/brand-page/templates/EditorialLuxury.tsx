"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import HeroSection from "../sections/HeroSection";
import StorySection from "../sections/StorySection";
import LogoShowcaseSection from "../sections/LogoShowcaseSection";
import ColorSection from "../sections/ColorSection";
import TypographySection from "../sections/TypographySection";
import MockupsSection from "../sections/MockupsSection";
import FooterSection from "../sections/FooterSection";

interface EditorialLuxuryProps {
    brandPage: BrandPage;
}

export default function EditorialLuxury({ brandPage }: EditorialLuxuryProps) {
    const {
        brandName,
        tagline,
        story,
        logos,
        fonts,
        colors,
        mockups,
        sections,
        aiDecisions
    } = brandPage;

    // Helper to check if section is enabled
    const isEnabled = (sectionType: string) => {
        const section = sections.find(s => s.type === sectionType);
        return section?.enabled !== false;
    };

    // Select appropriate logo based on hero background
    const heroLogo = (aiDecisions?.heroBackground?.startsWith('#') && aiDecisions.heroBackground.length === 7)
        ? (parseInt(aiDecisions.heroBackground.slice(1), 16) > 0x888888 ? logos.dark : logos.light)
        : (logos.dark || logos.light);

    return (
        <div className="min-h-screen w-full">
            {/* Hero Section - Always visible */}
            {isEnabled('hero') && (
                <HeroSection
                    logoUrl={heroLogo || logos.dark || logos.light || ''}
                    categoryLabel={brandPage.heroConfig?.categoryLabel || "Brand Identity"}
                    categoryLabelColor={brandPage.heroConfig?.categoryLabelColor}
                    copyrightText={brandPage.heroConfig?.copyrightText || `© ${brandName}`}
                    year={brandPage.heroConfig?.year || new Date().getFullYear().toString()}
                    background={aiDecisions?.heroBackground || 'linear-gradient(135deg, #F5F3E9 0%, #E8E6DC 100%)'}
                    logoSize={brandPage.heroConfig?.logoSize || 400}
                    heroTextColor={brandPage.heroConfig?.heroTextColor}
                />
            )}

            {/* Story Section */}
            {isEnabled('story') && story && (
                <StorySection
                    story={story}
                    featuredImage={brandPage.storyFeaturedImage || mockups[0]?.url}
                />
            )}

            {/* Logo Showcase */}
            {isEnabled('logo') && (
                <LogoShowcaseSection
                    logos={logos}
                    sizeConfig={brandPage.sizeConfig}
                    title={brandPage.textOverrides?.logoShowcaseTitle}
                    subtitle={brandPage.textOverrides?.logoShowcaseSubtitle}
                />
            )}

            {/* Typography */}
            {isEnabled('typography') && (
                <TypographySection
                    headingFont={{
                        name: fonts.heading?.name || "Inter",
                        file: fonts.heading?.file,
                        weights: fonts.heading?.weights || [400, 700, 900]
                    }}
                    bodyFont={{
                        name: fonts.body?.name || "Inter",
                        file: fonts.body?.file,
                        weights: fonts.body?.weights || [400, 600]
                    }}
                    sizeConfig={brandPage.sizeConfig}
                    title={brandPage.textOverrides?.typographyTitle}
                    subtitle={brandPage.textOverrides?.typographySubtitle}
                />
            )}

            {/* Mockups */}
            {isEnabled('mockups') && mockups && mockups.length > 0 && (
                <MockupsSection
                    mockups={mockups}
                    title={brandPage.textOverrides?.mockupsTitle}
                    subtitle={brandPage.textOverrides?.mockupsSubtitle}
                />
            )}

            {/* Colors */}
            {isEnabled('colors') && (
                <ColorSection
                    colors={brandPage.colors.colors || []}
                    title={brandPage.textOverrides?.colorTitle}
                    subtitle={brandPage.textOverrides?.colorSubtitle}
                />
            )}

            {/* Footer */}
            {isEnabled('footer') && (
                <FooterSection
                    brandName={brandName}
                    contactEmail={brandPage.textOverrides?.footerEmail || `hello@${brandName.toLowerCase().replace(/\s/g, '')}.com`}
                    title={brandPage.textOverrides?.footerTitle}
                    subtitle={brandPage.textOverrides?.footerSubtitle}
                    copyrightText={brandPage.textOverrides?.footerCopyright}
                />
            )}
        </div>
    );
}
