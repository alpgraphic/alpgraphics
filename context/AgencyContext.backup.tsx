"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ProjectStatus = 'Completed' | 'In Progress' | 'Review' | 'Planning' | 'Archived';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';

export interface TeamMember {
    id: number;
    name: string;
    role: string;
    avatar: string;
    status: 'online' | 'busy' | 'offline';
    skills?: string[];
    availability?: number; // 0-100%
}

export interface Lead {
    id: number;
    name: string;
    company: string;
    email: string;
    value: string; // e.g. "₺50,000"
    status: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
    date: string;
    notes?: string;
}

export interface ProjectTask {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: number; // Links to TeamMember
    dueDate?: string;
    estimatedHours?: number;
    loggedHours?: number;
}

export interface ProjectFile {
    name: string;
    type: string;
    size: string;
    date: string;
    status: 'Approved' | 'Pending' | 'Changes Requested';
}

export interface ProjectGalleryItem {
    id: number;
    imageData: string; // Base64 encoded image
    caption?: string;
    order: number;
    isFeatured?: boolean; // Hero image
}

export type BlockType =
    // Basic blocks
    | 'hero' | 'text' | 'image' | 'gallery' | 'quote' | 'split' | 'stats' | 'video' | 'cta' | 'spacer'
    // Brand guidelines blocks
    | 'brand-cover' | 'logo-showcase' | 'logo-grid' | 'logo-donts' | 'color-palette' | 'typography-showcase' | 'mockup-grid' | 'section-header';

export interface ColorSwatch {
    name: string;
    hex: string;
    rgb?: string;
    cmyk?: string;
    pantone?: string;
}

export interface LogoVariant {
    name: string;
    image: string;
    description?: string;
}

export interface FontStyle {
    name: string;
    family: string;
    weight: string;
    style?: string;
    sample?: string;
}

// Project Asset Management
export interface ProjectFont {
    id: string;
    name: string;
    family: string;
    base64Data: string;
    format: 'woff2' | 'woff' | 'ttf' | 'otf';
}

export interface ProjectAssets {
    logos: {
        primary?: string;
        secondary?: string;
        icon?: string;
    };
    fonts: ProjectFont[];
    selectedFontId?: string;
}

export interface PageBlock {
    id: string;
    type: BlockType;
    content: {
        // Hero
        title?: string;
        subtitle?: string;
        backgroundImage?: string;
        // Text
        text?: string;
        // Image
        image?: string;
        caption?: string;
        // Gallery
        images?: { src: string; caption?: string; }[];
        columns?: 2 | 3 | 4;
        // Quote
        quote?: string;
        author?: string;
        // Split
        splitImage?: string;
        splitText?: string;
        imagePosition?: 'left' | 'right';
        // Stats
        stats?: { value: string; label: string; }[];
        // Video
        videoUrl?: string;
        // CTA
        buttonText?: string;
        buttonUrl?: string;
        // Brand Cover
        brandName?: string;
        tagline?: string;
        logo?: string;
        year?: string;
        // Section Header
        sectionNumber?: string;
        sectionTitle?: string;
        sectionDescription?: string;
        // Logo Showcase
        logoImage?: string;
        logoDescription?: string;
        // Logo Grid
        logoVariants?: LogoVariant[];
        // Logo Don'ts
        logoDonts?: { image: string; label: string; }[];
        // Color Palette
        primaryColors?: ColorSwatch[];
        secondaryColors?: ColorSwatch[];
        // Typography Showcase
        primaryFont?: FontStyle;
        secondaryFont?: FontStyle;
        fontWeights?: { weight: string; sample: string; }[];
        // Mockup Grid
        mockups?: { image: string; label: string; }[];
    };
    order: number;
    style?: {
        background?: string;
        textColor?: string;
        padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
        fullWidth?: boolean;
    };
}

export interface Project {
    id: number;
    title: string;
    client: string;
    category: string;
    year: string;
    image: string;
    description: string;
    status: ProjectStatus;
    progress: number;
    dueDate?: string;
    tasks?: ProjectTask[];
    files?: ProjectFile[];
    team?: TeamMember[];
    budget?: number;
    currency?: 'USD' | 'EUR' | 'TRY';
    url?: string;
    // Gallery (legacy)
    gallery?: ProjectGalleryItem[];
    role?: string;
    services?: string[];
    testimonial?: { quote: string; author: string; };
    // Page Builder
    pageBlocks?: PageBlock[];
    isPagePublished?: boolean;
    // Brand Guide
    brandGuide?: import('@/lib/brandGuideTypes').BrandGuideData;
    // Asset Management
    projectAssets?: ProjectAssets;
}

export interface Invoice {
    id: number;
    client: string;
    amount: string; // e.g. "₺45,000" or "$15,000"
    date: string;
    status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Expense {
    id: number;
    title: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    category: 'Software' | 'Rent' | 'Salaries' | 'Marketing' | 'Misc';
    date: string;
}

export interface Message {
    id: number;
    from: string;
    subject: string;
    content: string;
    date: string;
    read: boolean;
    type: 'request' | 'system';
}

// --- NEW FINANCIAL TYPES (Cari Hesap) ---
export interface AccountTransaction {
    id: number;
    accountId: number;
    type: 'Debt' | 'Payment'; // Borç | Tahsilat
    amount: number;
    description: string;
    date: string;
}

export interface Account {
    id: number;
    name: string; // Contact Name
    company: string; // Company Name
    email: string;
    password: string; // Client panel login password
    totalDebt: number; // Toplam Borçlanılan
    totalPaid: number; // Toplam Ödenen
    balance: number;   // Bakiye (Debt - Paid)
    transactions: AccountTransaction[];
    status: 'Active' | 'Archived';
    // Brief System Fields
    briefFormType?: 'logo' | 'brand-identity' | 'web-design' | 'social-media' | 'packaging' | 'general';
    briefStatus: 'none' | 'pending' | 'submitted' | 'approved';
    briefResponses?: Record<string, string | string[]>;
    briefSubmittedAt?: string;
    briefApprovedAt?: string;
}

interface AgencyContextType {
    projects: Project[];
    addProject: (project: Project) => void;
    updateProject: (id: number, updates: Partial<Project>) => void;
    deleteProject: (id: number) => void;

    invoices: Invoice[];
    addInvoice: (invoice: Invoice) => void;

    expenses: Expense[];
    addExpense: (expense: Expense) => void;
    removeExpense: (id: number) => void;

    messages: Message[];
    addMessage: (msg: Message) => void;
    markMessageRead: (id: number) => void;

    teamMembers: TeamMember[];
    addTeamMember: (member: TeamMember) => void;
    removeTeamMember: (id: number) => void;

    // --- ACCOUNTS (Cari Hesap) ---
    accounts: Account[];
    addAccount: (account: Account) => void;
    updateAccount: (id: number, updates: Partial<Account>) => void;
    deleteAccount: (id: number) => void;
    addTransaction: (accountId: number, transaction: AccountTransaction) => void;

    // --- PROPOSALS ---
    proposals: Proposal[];
    addProposal: (proposal: Proposal) => void;
    updateProposal: (id: number, updates: Partial<Proposal>) => void;
    deleteProposal: (id: number) => void;

    // --- ASSET MANAGEMENT ---
    uploadLogo: (projectId: number, type: 'primary' | 'secondary' | 'icon', base64: string) => void;
    deleteLogo: (projectId: number, type: 'primary' | 'secondary' | 'icon') => void;
    uploadFont: (projectId: number, font: ProjectFont) => void;
    deleteFont: (projectId: number, fontId: string) => void;
    setGlobalFont: (projectId: number, fontId?: string) => void;

    isAdminNight: boolean;
    toggleAdminTheme: () => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export interface ProposalItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Proposal {
    id: number;
    title: string;
    clientName: string;
    date: string;
    validUntil: string;
    items: ProposalItem[];
    totalAmount: number;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
    currency: 'TRY' | 'USD' | 'EUR';
    // Customization Fields
    currencySymbol?: string; // e.g. "₺", "$", "€"
    taxRate?: number; // e.g. 20
    logoText?: string;
    logoSubtext?: string;
    attnText?: string; // e.g. "Attn: Project Manager"
    preparedForLabel?: string;
    projectLabel?: string;
    footerName?: string;
    footerTitle?: string;
    footerNote?: string;
    website?: string;
}

const INITIAL_PROPOSALS: Proposal[] = [
    {
        id: 1,
        title: "Website Redesign Proposal",
        clientName: "Acme Corp",
        date: "2026-01-10",
        validUntil: "2026-02-10",
        items: [
            { id: 1, description: "UX/UI Design", quantity: 1, unitPrice: 15000, total: 15000 },
            { id: 2, description: "Frontend Development", quantity: 1, unitPrice: 25000, total: 25000 }
        ],
        totalAmount: 40000,
        status: 'Sent',
        currency: 'TRY'
    }
];

// --- MOCK DATA ---

const INITIAL_PROJECTS: Project[] = [
    {
        id: 1,
        title: "Icebreaker Identity",
        client: "Nordic Expl.",
        category: "Branding",
        year: "2025",
        image: "/projects/p1.png",
        description: "A complete brand overhaul for a Nordic exploration company.",
        status: 'Completed',
        progress: 100,
        tasks: [
            { id: 1, title: "Brand Discovery Workshop", status: 'Done', priority: 'High', assigneeId: 1 },
            { id: 2, title: "Logo Concepts Round 1", status: 'Done', priority: 'High', assigneeId: 2 },
            { id: 3, title: "Final Asset Delivery", status: 'Done', priority: 'Medium', assigneeId: 2 }
        ],
        files: [
            { name: "Brand_Guidelines_V2.pdf", type: "PDF", size: "12MB", date: "Jan 10", status: "Pending" },
            { name: "Logo_Pack.zip", type: "ZIP", size: "45MB", date: "Jan 12", status: "Approved" }
        ],
        team: [],
        url: "https://example.com/icebreaker"
    },
    {
        id: 3,
        title: "Neon Dreams",
        client: "Streetwear Co.",
        category: "Art Direction",
        year: "2024",
        image: "/projects/p3.png",
        description: "Editorial campaign for a streetwear brand.",
        status: 'In Progress',
        progress: 65,
        dueDate: 'Mar 12, 2026',
        tasks: [
            { id: 101, title: "Moodboard Approval", status: 'Done', priority: 'High', assigneeId: 1 },
            { id: 102, title: "Photoshoot", status: 'Done', priority: 'High', assigneeId: 1 },
            { id: 103, title: "Post-Production", status: 'In Progress', priority: 'High', assigneeId: 2, estimatedHours: 40, loggedHours: 12 },
            { id: 104, title: "Social Media Assets", status: 'To Do', priority: 'Medium', assigneeId: 3 }
        ],
        files: [],
        team: [],
        url: "https://example.com/neondreams"
    },
    {
        id: 4,
        title: "Alpa OS V1",
        client: "Internal",
        category: "Development",
        year: "2026",
        image: "/projects/alpa-os.png",
        description: "Internal agency operating system for project, finance, and team management.",
        status: 'Review',
        progress: 90,
        dueDate: 'Jan 20, 2026',
        tasks: [
            { id: 201, title: "Core Architecture", status: 'Done', priority: 'High', assigneeId: 1 },
            { id: 202, title: "Admin Dashboard", status: 'Done', priority: 'High', assigneeId: 2 },
            { id: 203, title: "Client Portal", status: 'Done', priority: 'High', assigneeId: 3 },
            { id: 204, title: "System Log Module", status: 'Review', priority: 'Medium', assigneeId: 1 },
            { id: 205, title: "Final QA & Polish", status: 'In Progress', priority: 'High', assigneeId: 2 }
        ],
        files: [],
        team: [],
        budget: 50000,
        currency: 'TRY'
    }
];

const INITIAL_INVOICES: Invoice[] = [
    { id: 101, client: "Nordic Expl.", amount: "₺45,000", date: "Jan 10, 2026", status: "Pending" },
    { id: 102, client: "Void Arch.", amount: "₺120,000", date: "Jan 05, 2026", status: "Paid" },
    { id: 103, client: "Streetwear Co.", amount: "₺15,000", date: "Dec 28, 2025", status: "Overdue" },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 1, title: "Office Rent", amount: 2500, currency: "USD", category: "Rent", date: "Jan 01, 2026" },
    { id: 2, title: "Adobe CC Team", amount: 4500, currency: "TRY", category: "Software", date: "Jan 05, 2026" },
    { id: 3, title: "Server Costs (Vercel)", amount: 200, currency: "USD", category: "Software", date: "Jan 10, 2026" },
];

const INITIAL_MESSAGES: Message[] = [
    { id: 1, from: "System", subject: "Server Capacity Warning", content: "Storage at 85%", date: "2h ago", read: false, type: 'system' },
    { id: 2, from: "Nordic Expl.", subject: "Revision Request", content: "Can we adjust the logo kerning?", date: "5h ago", read: false, type: 'request' },
];

const INITIAL_TEAM: TeamMember[] = [
    { id: 1, name: 'Selin Alpa', role: 'Founder & CD', status: 'online', avatar: '', skills: ['Strategy', 'Design'], availability: 40 },
    { id: 2, name: 'Elif Yılmaz', role: 'Lead Designer', status: 'busy', avatar: '', skills: ['UI/UX', 'Motion'], availability: 10 },
    { id: 3, name: 'Can Demir', role: 'Full Stack Dev', status: 'offline', avatar: '', skills: ['React', 'Node.js'], availability: 100 },
    { id: 4, name: 'Zeynep Kaya', role: 'Project Manager', status: 'online', avatar: '', skills: ['Agile', 'Scrum'], availability: 80 },
];

// MOCK ACCOUNTS
const INITIAL_ACCOUNTS: Account[] = [
    {
        id: 1,
        name: "Ahmet Yılmaz",
        company: "Tech Start A.Ş.",
        email: "ahmet@techstart.tr",
        password: "techstart2026",
        totalDebt: 150000,
        totalPaid: 50000,
        balance: 100000,
        status: 'Active',
        briefFormType: 'web-design',
        briefStatus: 'pending',
        transactions: [
            { id: 1001, accountId: 1, type: 'Debt', amount: 150000, date: 'Jan 01, 2026', description: 'Web Site Design (Contract)' },
            { id: 1002, accountId: 1, type: 'Payment', amount: 50000, date: 'Jan 15, 2026', description: 'Advance Payment' }
        ]
    },
    {
        id: 2,
        name: "Sarah Connor",
        company: "Cyberdyne",
        email: "sarah@cyberdyne.net",
        password: "cyberdyne2026",
        totalDebt: 500000,
        totalPaid: 500000,
        balance: 0,
        status: 'Active',
        briefFormType: 'brand-identity',
        briefStatus: 'approved',
        transactions: [
            { id: 2001, accountId: 2, type: 'Debt', amount: 500000, date: 'Dec 01, 2025', description: 'Security Audit' },
            { id: 2002, accountId: 2, type: 'Payment', amount: 500000, date: 'Jan 01, 2026', description: 'Full Payment' }
        ]
    }
];

export function AgencyProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
    const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
    const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);

    // Theme State
    const [isAdminNight, setIsAdminNight] = useState(true);

    // Hydration Fix
    // Unified Persistence (Hydration & Saving)
    const [mounted, setMounted] = useState(false);

    // Initial Load
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('agency_data_v3');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.projects) setProjects(data.projects);
                if (data.invoices) setInvoices(data.invoices);
                if (data.expenses) setExpenses(data.expenses);
                if (data.messages) setMessages(data.messages);
                if (data.teamMembers) setTeamMembers(data.teamMembers);
                if (data.accounts) setAccounts(data.accounts);
                if (data.proposals) setProposals(data.proposals);
            } catch (e) { console.error("Failed to load data", e); }
        }
    }, []);

    // Auto-Save
    useEffect(() => {
        if (mounted) {
            const dataToSave = {
                projects,
                invoices,
                expenses,
                messages,
                teamMembers,
                accounts,
                proposals
            };
            localStorage.setItem('agency_data_v3', JSON.stringify(dataToSave));
        }
    }, [projects, invoices, expenses, messages, teamMembers, accounts, proposals, mounted]);

    // Actions
    const addProject = (project: Project) => setProjects(prev => [...prev, project]);
    const updateProject = (id: number, updates: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const deleteProject = (id: number) => setProjects(prev => prev.filter(p => p.id !== id));

    const addInvoice = (inv: Invoice) => setInvoices(prev => [inv, ...prev]);

    const addExpense = (exp: Expense) => setExpenses(prev => [exp, ...prev]);
    const removeExpense = (id: number) => setExpenses(prev => prev.filter(e => e.id !== id));

    const addMessage = (msg: Message) => setMessages(prev => [msg, ...prev]);
    const markMessageRead = (id: number) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));

    const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
    const removeTeamMember = (id: number) => setTeamMembers(prev => prev.filter(m => m.id !== id));

    // --- ACCOUNT ACTIONS ---
    const addAccount = (account: Account) => setAccounts(prev => [...prev, account]);

    const updateAccount = (id: number, updates: Partial<Account>) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    const deleteAccount = (id: number) => setAccounts(prev => prev.filter(a => a.id !== id));

    const addTransaction = (accountId: number, transaction: AccountTransaction) => {
        setAccounts(prev => prev.map(account => {
            if (account.id !== accountId) return account;

            // Update Balance Logic
            const newTransactions = [...account.transactions, transaction];
            const newTotalDebt = transaction.type === 'Debt' ? account.totalDebt + transaction.amount : account.totalDebt;
            const newTotalPaid = transaction.type === 'Payment' ? account.totalPaid + transaction.amount : account.totalPaid;

            return {
                ...account,
                transactions: newTransactions,
                totalDebt: newTotalDebt,
                totalPaid: newTotalPaid,
                balance: newTotalDebt - newTotalPaid
            };
        }));
    };

    // --- PROPOSAL ACTIONS ---
    const addProposal = (proposal: Proposal) => setProposals(prev => [...prev, proposal]);
    const updateProposal = (id: number, updates: Partial<Proposal>) => setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const deleteProposal = (id: number) => setProposals(prev => prev.filter(p => p.id !== id));

    // --- ASSET MANAGEMENT ACTIONS ---
    const uploadLogo = (projectId: number, type: 'primary' | 'secondary' | 'icon', base64: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            const currentAssets = p.projectAssets || { logos: {}, fonts: [] };
            return {
                ...p,
                projectAssets: {
                    ...currentAssets,
                    logos: {
                        ...currentAssets.logos,
                        [type]: base64
                    }
                }
            };
        }));
    };

    const deleteLogo = (projectId: number, type: 'primary' | 'secondary' | 'icon') => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            const currentAssets = p.projectAssets || { logos: {}, fonts: [] };
            const { [type]: _, ...restLogos } = currentAssets.logos;

            return {
                ...p,
                projectAssets: {
                    ...currentAssets,
                    logos: restLogos
                }
            };
        }));
    };

    const uploadFont = (projectId: number, font: ProjectFont) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            const currentAssets = p.projectAssets || { logos: {}, fonts: [] };
            return {
                ...p,
                projectAssets: {
                    ...currentAssets,
                    fonts: [...currentAssets.fonts, font]
                }
            };
        }));
    };

    const deleteFont = (projectId: number, fontId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            const currentAssets = p.projectAssets || { logos: {}, fonts: [] };
            return {
                ...p,
                projectAssets: {
                    ...currentAssets,
                    fonts: currentAssets.fonts.filter(f => f.id !== fontId),
                    // Clear selected font if it's being deleted
                    selectedFontId: currentAssets.selectedFontId === fontId ? undefined : currentAssets.selectedFontId
                }
            };
        }));
    };

    const setGlobalFont = (projectId: number, fontId?: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            const currentAssets = p.projectAssets || { logos: {}, fonts: [] };
            return {
                ...p,
                projectAssets: {
                    ...currentAssets,
                    selectedFontId: fontId
                }
            };
        }));
    };

    const toggleAdminTheme = () => setIsAdminNight(!isAdminNight);

    return (
        <AgencyContext.Provider value={{
            projects, addProject, updateProject, deleteProject,
            invoices, addInvoice,
            expenses, addExpense, removeExpense,
            messages, addMessage, markMessageRead,
            teamMembers, addTeamMember, removeTeamMember,
            accounts, addAccount, updateAccount, deleteAccount, addTransaction,
            proposals, addProposal, updateProposal, deleteProposal,
            uploadLogo, deleteLogo, uploadFont, deleteFont, setGlobalFont,
            isAdminNight, toggleAdminTheme
        }}>
            {children}
        </AgencyContext.Provider>
    );
}

export function useAgency() {
    const context = useContext(AgencyContext);
    if (context === undefined) throw new Error('useAgency must be used within an AgencyProvider');
    return context;
}
