"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAgency } from "@/context/AgencyContext";
import EditPanel from "@/components/brand-page/EditPanel";
import LivePreview from "@/components/brand-page/LivePreview";
import { BrandPage, SectionConfig } from "@/lib/brandPageTypes";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Default empty state to replace deleted demo data
// We cast to any first to allow partial structure that might need migration
const DEFAULT_BRAND_PAGE: Partial<BrandPage> = {
    brandName: "New Brand",
    tagline: "",
    // description is not in BrandPage type, removing
    logos: {},
    fonts: {},
    colors: { primary: "#000000", secondary: "#ffffff" },
    mockups: [],
    sections: [],
    sizeConfig: {
        logoLightSize: 200,
        logoDarkSize: 200,
        iconLightSize: 200,
        iconDarkSize: 200,
        headingFontSize: 72,
        bodyFontSize: 18
    }
};


export default function BrandPageEdit() {
    const params = useParams();
    const router = useRouter();
    const { projects, updateProject } = useAgency();
    const { showToast } = useToast();

    // Initialize brand page from ID - load from context or fallback to demo
    const initialBrandPage = useMemo(() => {
        const urlId = params.id as string;
        // Support both string IDs (like 'demo-alpgraphics') and numeric IDs
        const projectId = isNaN(parseInt(urlId)) ? urlId : parseInt(urlId);
        const project = projects.find(p => String(p.id) === String(projectId));

        // Priority 1: Full Brand Data Persistence
        if (project && project.brandData) {
            return {
                ...project.brandData,
                id: project.id.toString(), // Ensure ID stays in sync with Project ID
            } as BrandPage;
        }

        // Priority 2: Legacy/Partial Page Blocks
        if (project && project.pageBlocks && project.pageBlocks.length > 0) {
            // Map project to BrandPage format (using spread to maintain compatibility)
            return {
                ...DEFAULT_BRAND_PAGE,
                id: project.id.toString(),
                brandName: project.title,
                // Keep other demo data as defaults
                sections: (project.pageBlocks || []) as any[] as SectionConfig[]
            } as BrandPage;
        }

        // Otherwise use demo data but override with project info
        // Fix: Use params.id as fallback ID to prevent 'demo-alpgraphics' persistence race condition
        const safeId = (project?.id.toString()) || urlId;

        return {
            ...DEFAULT_BRAND_PAGE,
            id: safeId,
            brandName: project ? project.title : "New Brand Page"
        } as BrandPage;
    }, [params.id, projects]);

    const [brandPage, setBrandPage] = useState<BrandPage>(initialBrandPage);

    // Fix: Sync state when projects are loaded from API to prevent stale empty data
    useEffect(() => {
        setBrandPage(initialBrandPage);
    }, [initialBrandPage]);

    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = (updates: Partial<BrandPage>) => {
        setBrandPage(prev => ({
            ...prev,
            ...updates,
            updatedAt: new Date().toISOString()
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const rawId = params.id as string;
            const projectId = isNaN(parseInt(rawId)) ? rawId : parseInt(rawId);

            // Validate required fields
            if (!brandPage.brandName || brandPage.brandName.trim() === '') {
                showToast('Please enter a brand name', 'error');
                setIsSaving(false);
                return;
            }

            if (!brandPage.linkedAccountId) {
                showToast('Please select a client', 'warning');
            }

            // Save brand page data to project via context
            updateProject(projectId as any, {
                brandData: brandPage, // Persist full config
                pageBlocks: (brandPage.sections || []) as any,
                title: brandPage.brandName
            });

            setTimeout(() => {
                setIsSaving(false);
                showToast('Draft saved successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Failed to save brand page:', error);
            setIsSaving(false);
            showToast('Failed to save. Please try again.', 'error');
        }
    };

    const handlePublish = async () => {
        // Validate before publishing
        if (!brandPage.brandName || brandPage.brandName.trim() === '') {
            showToast('Please enter a brand name before publishing', 'error');
            return;
        }

        if (!brandPage.linkedAccountId) {
            showToast('Please select a client before publishing', 'error');
            return;
        }

        if (!brandPage.logos?.light && !brandPage.logos?.dark) {
            showToast('Please upload at least one logo before publishing', 'warning');
        }

        setIsSaving(true);
        showToast('Publishing brand page...', 'info');

        const updatedPage = {
            ...brandPage,
            status: 'published' as const,
            updatedAt: new Date().toISOString()
        };
        setBrandPage(updatedPage);

        try {
            const rawId = params.id as string;
            const projectId = isNaN(parseInt(rawId)) ? rawId : parseInt(rawId);

            // Publish: save to context with published status
            const publishData = {
                brandData: updatedPage, // Persist full config
                pageBlocks: (updatedPage.sections || []) as any,
                isPagePublished: true,
                category: 'Brand Page', // CRITICAL: Set category
                status: 'Completed' as any,
                title: updatedPage.brandName
            };

            updateProject(projectId as any, publishData);

            showToast('✅ Brand page published successfully! Check the Work section to see it live.', 'success');
            setIsSaving(false);

            // Don't auto-redirect, let user stay on page
        } catch (error) {
            console.error('Failed to publish brand page:', error);
            showToast('Failed to publish. Please try again.', 'error');
            setIsSaving(false);
        }
    };

    return (
        <div className="h-screen flex">
            {/* Edit Panel - Left (30%) */}
            <div className="w-[400px] border-r border-black/10">
                <EditPanel
                    brandPage={brandPage}
                    onUpdate={handleUpdate}
                    onSave={handleSave}
                    onPublish={handlePublish}
                />
            </div>

            {/* Live Preview - Right (70%) */}
            <div className="flex-1">
                <LivePreview brandPage={brandPage} />
            </div>
        </div>
    );
}
