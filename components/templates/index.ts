// Template Index - Export all brand guideline templates

import MinimalSwiss from './MinimalSwiss';
import DarkPremium from './DarkPremium';
import TechModern from './TechModern';
import BauhausGeometric from './BauhausGeometric';
import CorporateBlue from './CorporateBlue';
import EditorialClassic from './EditorialClassic';
import OrganicNatural from './OrganicNatural';
import FashionLuxe from './FashionLuxe';
import PlayfulCreative from './PlayfulCreative';
import BrutalistRaw from './BrutalistRaw';
import AvantGarde from './AvantGarde';

import { BrandGuideData } from '@/lib/brandGuideTypes';

interface TemplateProps {
    data: BrandGuideData;
    isEditing: boolean;
    onUpdate: (field: string, value: any) => void;
    onImageUpload: (fieldOrFile: string | File, field?: string) => void;
}

// Template component map
export const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<TemplateProps>> = {
    'minimal-swiss': MinimalSwiss,
    'dark-premium': DarkPremium,
    'tech-modern': TechModern,
    'bauhaus-geometric': BauhausGeometric,
    'corporate-blue': CorporateBlue,
    'editorial-classic': EditorialClassic,
    'organic-natural': OrganicNatural,
    'fashion-luxe': FashionLuxe,
    'playful-creative': PlayfulCreative,
    'brutalist-raw': BrutalistRaw,
    'avant-garde': AvantGarde,
};

// Get template component by ID
export function getTemplateComponent(templateId: string): React.ComponentType<TemplateProps> | null {
    return TEMPLATE_COMPONENTS[templateId] || null;
}

// Export all templates
export {
    MinimalSwiss,
    DarkPremium,
    TechModern,
    BauhausGeometric,
    CorporateBlue,
    EditorialClassic,
    OrganicNatural,
    FashionLuxe,
    PlayfulCreative,
    BrutalistRaw,
    AvantGarde,
};
