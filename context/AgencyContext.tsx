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
    id: number | string; // Support both numeric IDs and string IDs like 'demo-alpgraphics'
    title: string;
    client: string;
    category: string;
    year: string;
    image: string;
    description: string;
    status: ProjectStatus;
    progress: number;
    dueDate?: string;

    // Workflow Linking (NEW in Phase 2)
    linkedAccountId?: number | string;      // Which account/client this project belongs to
    linkedProposalId?: number;      // Which proposal generated this project
    linkedBriefToken?: string;      // Brief form token/ID
    linkedBrandPageId?: string;     // Connected brand page ID
    brandData?: any;                // Stores the full Brand Page configuration (colors, fonts, sections)

    tasks?: ProjectTask[];
    files?: ProjectFile[];
    team?: TeamMember[];
    budget?: number;                // Kept for legacy, but should use Proposal
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
    accountId: number | string;
    type: 'Debt' | 'Payment'; // Borç | Tahsilat
    amount: number;
    description: string;
    date: string;
}

export interface Account {
    id: number | string;
    name: string; // Contact Name
    company: string; // Company Name
    email: string;
    username?: string; // Unique login identifier
    password?: string; // Client panel login password
    totalDebt: number; // Toplam Borçlanılan
    totalPaid: number; // Toplam Ödenen
    balance: number;   // Bakiye (Debt - Paid)
    transactions: AccountTransaction[];
    status: 'Active' | 'Archived';
    // Brief System Fields
    briefToken?: string; // Unique token for public brief form URL
    briefFormType?: 'logo' | 'brand-identity' | 'web-design' | 'social-media' | 'packaging' | 'general';
    briefStatus: 'none' | 'pending' | 'submitted' | 'approved';
    briefResponses?: Record<string, string | string[]>;
    briefSubmittedAt?: string;
    briefApprovedAt?: string;
}

interface AgencyContextType {
    projects: Project[];
    addProject: (project: Project) => void;
    updateProject: (id: number | string, updates: Partial<Project>) => void;
    deleteProject: (id: number | string) => void;
    deleteTask: (projectId: number | string, taskId: number) => void;

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
    addAccount: (account: Account) => Promise<{ success: boolean; error?: string; details?: string[] }>;
    updateAccount: (id: number | string, updates: Partial<Account>) => void;
    deleteAccount: (id: number | string) => void;
    addTransaction: (accountId: number | string, transaction: AccountTransaction) => void;

    // --- PROPOSALS ---
    proposals: Proposal[];
    addProposal: (proposal: Proposal) => void;
    updateProposal: (id: number, updates: Partial<Proposal>) => void;
    deleteProposal: (id: number) => void;

    // --- WORKFLOW LINKING (Phase 2) ---
    linkProjectToAccount: (projectId: number, accountId: number) => void;
    linkProjectToProposal: (projectId: number, proposalId: number) => void;
    linkProjectToBrief: (projectId: number, briefToken: string) => void;
    linkProjectToBrandPage: (projectId: number, brandPageId: string) => void;

    // --- ASSET MANAGEMENT ---
    uploadLogo: (projectId: number | string, type: 'primary' | 'secondary' | 'icon', base64: string) => void;
    deleteLogo: (projectId: number | string, type: 'primary' | 'secondary' | 'icon') => void;
    uploadFont: (projectId: number | string, font: ProjectFont) => void;
    deleteFont: (projectId: number | string, fontId: string) => void;
    setGlobalFont: (projectId: number | string, fontId?: string) => void;

    isAdminNight: boolean;
    toggleAdminTheme: () => void;

    // Error notification
    lastError: string | null;
    clearError: () => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export interface ProposalItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    directTotal?: boolean; // Birim fiyat yerine toplam direkt girildi mi
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
    logoUrl?: string; // URL or base64 for uploaded logo image
    primaryColor?: string; // e.g. "#a62932"
    attnText?: string; // e.g. "Attn: Project Manager"
    preparedForLabel?: string;
    projectLabel?: string;
    footerName?: string;
    footerTitle?: string;
    footerNote?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string; // Additional terms/notes at end
    showKdv?: boolean; // KDV satırı gösterilsin mi (default: true)
    useDirectTotal?: boolean; // Tüm kalemlere tek toplam fiyat girilsin mi
}

const INITIAL_PROPOSALS: Proposal[] = [];

// --- MOCK DATA ---

// --- MOCK DATA REMOVED ---
const INITIAL_PROJECTS: Project[] = [];
const INITIAL_INVOICES: Invoice[] = [];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_MESSAGES: Message[] = [];
const INITIAL_TEAM: TeamMember[] = [];
const INITIAL_ACCOUNTS: Account[] = [];

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

    // Error notification state
    const [lastError, setLastError] = useState<string | null>(null);
    const clearError = () => setLastError(null);

    // Hydration Fix
    // Unified Persistence (Hydration & Saving)
    const [mounted, setMounted] = useState(false);

    // Initial Load
    useEffect(() => {
        setMounted(true);
        let saved = localStorage.getItem('agency_data_v4');

        // Migration: If v4 is missing but v3 exists, migrate it
        if (!saved) {
            const v3Data = localStorage.getItem('agency_data_v3');
            if (v3Data) {
                console.log("Migrating agency_data_v3 to v4...");
                localStorage.setItem('agency_data_v4', v3Data);
                saved = v3Data;
            }
        }

        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.projects) {
                    // Always include demo project
                    const demoProject = INITIAL_PROJECTS.find(p => p.id === 'demo-alpgraphics');
                    const hasDemo = data.projects.some((p: any) => p.id === 'demo-alpgraphics');
                    if (demoProject && !hasDemo) {
                        setProjects([demoProject, ...data.projects]);
                    } else {
                        setProjects(data.projects);
                    }
                }
                if (data.invoices) setInvoices(data.invoices);
                if (data.expenses) setExpenses(data.expenses);
                if (data.messages) setMessages(data.messages);
                if (data.teamMembers) setTeamMembers(data.teamMembers);
                if (data.accounts) setAccounts(data.accounts);
                if (data.proposals) setProposals(data.proposals);
            } catch (e) { console.error("Failed to load data", e); }
        }
    }, []);

    // --- SESSION EXPIRY HANDLER ---
    const handleSessionExpired = () => {
        console.warn('Session expired — redirecting to login');
        localStorage.removeItem('alpa_auth');
        localStorage.removeItem('client_session');
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login';
        }
    };

    // --- PROJECTS (API INTEGRATED) ---
    // Fetch projects on load
    useEffect(() => {
        if (!mounted) return;

        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                if (res.status === 401) {
                    handleSessionExpired();
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    if (data.projects) {
                        setProjects(prevLocal => {
                            // Build a lookup of local projects by ID for fast access
                            const localMap = new Map(prevLocal.map(p => [String(p.id), p]));

                            // Merge API projects with local data:
                            // API projects take priority, BUT preserve local-only fields
                            // (brandData, pageBlocks etc.) that API may exclude via projection
                            const mergedApiProjects = data.projects.map((apiProject: any) => {
                                const localProject = localMap.get(String(apiProject.id));
                                if (localProject) {
                                    // Preserve local brandData/pageBlocks if API doesn't have them
                                    return {
                                        ...localProject,  // local data as base
                                        ...apiProject,     // API data overrides
                                        // But keep local brandData if API excluded it
                                        brandData: apiProject.brandData || localProject.brandData,
                                        pageBlocks: apiProject.pageBlocks || localProject.pageBlocks,
                                    };
                                }
                                return apiProject;
                            });

                            // Add local-only projects (drafts not yet in DB)
                            const apiIds = new Set(data.projects.map((p: any) => String(p.id)));
                            const uniqueLocal = prevLocal.filter(p => !apiIds.has(String(p.id)));

                            // Re-include demo project if it was missing
                            const demoProject = INITIAL_PROJECTS.find(p => p.id === 'demo-alpgraphics');
                            const hasDemo = mergedApiProjects.some((p: any) => p.id === 'demo-alpgraphics') ||
                                uniqueLocal.some((p: any) => p.id === 'demo-alpgraphics');

                            const merged = [...mergedApiProjects, ...uniqueLocal];
                            if (demoProject && !hasDemo) merged.unshift(demoProject);

                            return merged;
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };

        fetchProjects();
    }, [mounted]);

    // --- PROPOSALS (API INTEGRATED) ---
    useEffect(() => {
        if (!mounted) return;

        const fetchProposals = async () => {
            try {
                const res = await fetch('/api/proposals');
                if (res.ok) {
                    const data = await res.json();
                    if (data.proposals) {
                        setProposals(data.proposals);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch proposals:", error);
            }
        };

        fetchProposals();
    }, [mounted]);

    // Legacy LocalStorage Auto-Save (Only for non-database items like Messages/Invoices if needed)
    // Removed for Projects to prevent sync issues

    // Project Actions with API Persistence
    const addProject = async (project: Project) => {

        // Optimistic Update
        const updatedProjects = [...projects, project];
        setProjects(updatedProjects);

        // CRITICAL: Save to localStorage immediately
        try {
            const currentData = localStorage.getItem('agency_data_v4');
            const data = currentData ? JSON.parse(currentData) : {};
            data.projects = updatedProjects;
            localStorage.setItem('agency_data_v4', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }

        // Then sync to API
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project) // Pass full project object including ID
            });

            if (!response.ok) {
                console.error('API create failed:', response.status);
            }
        } catch (error) {
            console.error("❌ Failed to create project:", error);
            setLastError("Proje kaydedilemedi!");
        }
    };

    const updateProject = async (id: number | string, updates: Partial<Project>) => {
        // Find the project first (support both string and number IDs)
        const existingProject = projects.find(p => String(p.id) === String(id));

        if (!existingProject) {
            console.error('Project not found in state:', id);
            return;
        }

        // Optimistic Update (compare as strings for mixed ID types)
        const updatedProjects = projects.map(p => String(p.id) === String(id) ? { ...p, ...updates } : p);
        setProjects(updatedProjects);

        // CRITICAL: Save to localStorage immediately
        try {
            const currentData = localStorage.getItem('agency_data_v4');
            const data = currentData ? JSON.parse(currentData) : {};
            data.projects = updatedProjects;
            localStorage.setItem('agency_data_v4', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }

        // Then sync to API
        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                console.error('API update failed:', response.status);
            }
        } catch (error) {
            console.error('Failed to update project API:', error);
        }
    };

    const deleteProject = async (id: number | string) => {
        // Optimistic Update
        setProjects(prev => prev.filter(p => String(p.id) !== String(id)));

        try {
            await fetch(`/api/projects/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error("Failed to delete project:", error);
            setLastError("Proje silinemedi!");
        }
    };

    const deleteTask = (projectId: number | string, taskId: number) => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) === String(projectId)) {
                return {
                    ...p,
                    tasks: (p.tasks || []).filter(t => t.id !== taskId)
                };
            }
            return p;
        }));
    };

    const addInvoice = (inv: Invoice) => setInvoices(prev => [inv, ...prev]);

    const addExpense = (exp: Expense) => setExpenses(prev => [exp, ...prev]);
    const removeExpense = (id: number) => setExpenses(prev => prev.filter(e => e.id !== id));

    const addMessage = (msg: Message) => setMessages(prev => [msg, ...prev]);
    const markMessageRead = (id: number) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));

    const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
    const removeTeamMember = (id: number) => setTeamMembers(prev => prev.filter(m => m.id !== id));

    // --- ACCOUNT ACTIONS (API INTEGRATED) ---
    // Fetch accounts on load
    useEffect(() => {
        if (!mounted) return;

        const fetchAccounts = async () => {
            try {
                const res = await fetch('/api/accounts');
                if (res.status === 401) {
                    handleSessionExpired();
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    if (data.accounts && data.accounts.length > 0) {
                        setAccounts(data.accounts);
                        // Persist to localStorage so accounts survive API failures
                        try {
                            const currentData = localStorage.getItem('agency_data_v4');
                            const stored = currentData ? JSON.parse(currentData) : {};
                            stored.accounts = data.accounts;
                            localStorage.setItem('agency_data_v4', JSON.stringify(stored));
                        } catch (e) {
                            console.error('Failed to cache accounts:', e);
                        }
                    }
                } else {
                    // API failed (non-401) — keep localStorage accounts if loaded
                    console.warn('Accounts API returned', res.status, '— using cached data');
                }
            } catch (error) {
                console.error("Failed to fetch accounts:", error);
                // Network error — localStorage accounts already loaded in initial useEffect
            }
        };

        fetchAccounts();
    }, [mounted]);

    const addAccount = async (account: Account): Promise<{ success: boolean; error?: string; details?: string[] }> => {
        // Optimistic UI update
        const tempId = Date.now();
        const optimisticAccount = { ...account, id: tempId };
        setAccounts(prev => [...prev, optimisticAccount]);

        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: account.name,
                    company: account.company,
                    email: account.email || undefined,
                    username: account.username,
                    password: account.password || undefined,
                    briefFormType: account.briefFormType || 'none'
                }),
            });

            const data = await res.json();

            if (data.success && data.account) {
                // Replace optimistic account with real one from DB
                setAccounts(prev => prev.map(acc => acc.id === tempId ? { ...acc, ...data.account, id: data.account.id } : acc));
                return { success: true };
            } else {
                // Revert on error
                setAccounts(prev => prev.filter(acc => acc.id !== tempId));
                return { success: false, error: data.error || 'Hesap oluşturulamadı', details: data.details };
            }
        } catch (error) {
            console.error("Failed to create account:", error);
            setAccounts(prev => prev.filter(acc => acc.id !== tempId));
            return { success: false, error: 'Bağlantı hatası' };
        }
    };

    const updateAccount = async (id: number | string, updates: Partial<Account>) => {
        // Optimistic UI update
        setAccounts(prev => {
            const newAccounts = prev.map(a => a.id === id ? { ...a, ...updates } : a);

            // Sync to localStorage
            try {
                const currentData = localStorage.getItem('agency_data_v4');
                const data = currentData ? JSON.parse(currentData) : {};
                data.accounts = newAccounts;
                localStorage.setItem('agency_data_v4', JSON.stringify(data));
            } catch (e) {
                console.error('Local storage save error:', e);
            }
            return newAccounts;
        });

        // Backend Sync
        try {
            // Only sync if it look like a MongoDB ID (string)
            if (typeof id === 'string' && /^[0-9a-f]{24}$/.test(id)) {
                await fetch('/api/accounts', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, ...updates })
                });
            }
        } catch (error) {
            console.error('Update account API error:', error);
        }
    };

    const deleteAccount = async (id: number | string) => {
        // Optimistic UI update
        const previousAccounts = [...accounts];
        setAccounts(prev => prev.filter(a => a.id !== id));

        try {
            // Check if it's a temp ID (number) or MongoDB ID (string)
            // If it's a number (mock data), just return
            if (typeof id === 'number' && id < 100000) return;

            const res = await fetch(`/api/accounts?id=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                // Revert on error
                setAccounts(previousAccounts);
                setLastError('Hesap silinemedi');
            }
        } catch (error) {
            console.error("Failed to delete account:", error);
            setAccounts(previousAccounts);
        }
    };

    const addTransaction = async (accountId: number | string, transaction: AccountTransaction) => {
        // Save previous state for revert
        const previousAccounts = [...accounts];

        // Optimistic UI Update
        const tempId = Date.now();
        setAccounts(prev => prev.map(account => {
            if (account.id !== accountId) return account;

            const newTransactions = [...account.transactions, { ...transaction, id: tempId }];
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

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...transaction,
                    accountId
                })
            });

            if (!res.ok) {
                // Revert state on API error
                console.error("Failed to save transaction, reverting...");
                setAccounts(previousAccounts);
                setLastError('İşlem kaydedilemedi. Lütfen tekrar deneyin.');
            }

        } catch (error) {
            console.error("Transaction API error", error);
            // Revert state on network error
            setAccounts(previousAccounts);
            setLastError('Sunucuya bağlanılamadı. İşlem geri alındı.');
        }
    };

    // --- PROPOSAL ACTIONS (API INTEGRATED) ---
    const addProposal = async (proposal: Proposal) => {
        // Optimistic Update
        setProposals(prev => [...prev, proposal]);

        try {
            const res = await fetch('/api/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposal)
            });
            if (!res.ok) {
                console.error('Failed to save proposal to API');
            }
        } catch (error) {
            console.error('Proposal API error:', error);
        }
    };

    const updateProposal = async (id: number, updates: Partial<Proposal>) => {
        // Optimistic Update
        setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

        try {
            const res = await fetch('/api/proposals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });
            if (!res.ok) {
                console.error('Failed to update proposal');
            }
        } catch (error) {
            console.error('Proposal update error:', error);
        }
    };

    const deleteProposal = async (id: number) => {
        // Optimistic Update
        setProposals(prev => prev.filter(p => p.id !== id));

        try {
            const res = await fetch(`/api/proposals?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                console.error('Failed to delete proposal');
            }
        } catch (error) {
            console.error('Proposal delete error:', error);
        }
    };

    // --- ASSET MANAGEMENT ACTIONS ---
    const uploadLogo = (projectId: number | string, type: 'primary' | 'secondary' | 'icon', base64: string) => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) !== String(projectId)) return p;

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

    const deleteLogo = (projectId: number | string, type: 'primary' | 'secondary' | 'icon') => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) !== String(projectId)) return p;

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

    const uploadFont = (projectId: number | string, font: ProjectFont) => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) !== String(projectId)) return p;

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

    const deleteFont = (projectId: number | string, fontId: string) => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) !== String(projectId)) return p;

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

    const setGlobalFont = (projectId: number | string, fontId?: string) => {
        setProjects(prev => prev.map(p => {
            if (String(p.id) !== String(projectId)) return p;

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

    // --- WORKFLOW LINKING FUNCTIONS (Phase 2) ---
    const linkProjectToAccount = (projectId: number, accountId: number | string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, linkedAccountId: accountId } : p
        ));
    };

    const linkProjectToProposal = (projectId: number, proposalId: number) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, linkedProposalId: proposalId } : p
        ));
    };

    const linkProjectToBrief = (projectId: number, briefToken: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, linkedBriefToken: briefToken } : p
        ));
    };

    const linkProjectToBrandPage = (projectId: number, brandPageId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, linkedBrandPageId: brandPageId } : p
        ));
    };

    const toggleAdminTheme = () => setIsAdminNight(!isAdminNight);

    return (
        <AgencyContext.Provider value={{
            projects, addProject, updateProject, deleteProject, deleteTask,
            invoices, addInvoice,
            expenses, addExpense, removeExpense,
            messages, addMessage, markMessageRead,
            teamMembers, addTeamMember, removeTeamMember,
            accounts, addAccount, updateAccount, deleteAccount, addTransaction,
            proposals, addProposal, updateProposal, deleteProposal,
            linkProjectToAccount, linkProjectToProposal, linkProjectToBrief, linkProjectToBrandPage,
            uploadLogo, deleteLogo, uploadFont, deleteFont, setGlobalFont,
            isAdminNight, toggleAdminTheme,
            lastError, clearError
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
