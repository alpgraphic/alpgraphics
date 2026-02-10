"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgency, Project, Proposal } from "@/context/AgencyContext";
import ProjectDetailView from "@/components/admin/ProjectDetailView";
import CommandBar from "@/components/admin/CommandBar";
import ProposalPrintTemplate from "@/components/admin/ProposalPrintTemplate";
import SceneSettings from "@/components/admin/SceneSettings";
import SEOSettings from "@/components/admin/SEOSettings";
// AIBrandGenerator removed - replaced with Brand Pages system

export default function AdminDashboard() {
    const { projects, addProject, deleteProject, invoices, addInvoice, expenses, addExpense, removeExpense, messages, markMessageRead, accounts, addAccount, updateAccount, deleteAccount, addTransaction, proposals, addProposal, updateProposal, deleteProposal, isAdminNight, toggleAdminTheme } = useAgency();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);


    // Auth Check
    const router = useRouter(); // Helper import needed? No, need to import it
    useEffect(() => {
        const auth = localStorage.getItem('alpa_auth');
        if (!auth || auth !== 'admin') router.push('/login');
    }, [router]);


    // Modal States
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type: 'project' | 'proposal' | 'expense' | 'account' | null; id: number | string | null; title: string }>({ show: false, type: null, id: null, title: '' });

    // Form States
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectClient, setNewProjectClient] = useState('');
    const [newProjectAccountId, setNewProjectAccountId] = useState<number | string | null>(null);



    const [newInvClient, setNewInvClient] = useState('');
    const [newInvAmount, setNewInvAmount] = useState('');
    const [newInvStatus, setNewInvStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');

    // Expense Form States
    const [newExpTitle, setNewExpTitle] = useState('');
    const [newExpAmount, setNewExpAmount] = useState('');
    const [newExpCurrency, setNewExpCurrency] = useState<'TRY' | 'USD' | 'EUR'>('USD');
    const [newExpCategory, setNewExpCategory] = useState<'Software' | 'Rent' | 'Salaries' | 'Marketing' | 'Misc'>('Misc');

    // Account States
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountCompany, setNewAccountCompany] = useState('');
    const [newAccountEmail, setNewAccountEmail] = useState('');
    const [newAccountPassword, setNewAccountPassword] = useState('');
    const [newAccountBriefType, setNewAccountBriefType] = useState<'logo' | 'brand-identity' | 'web-design' | 'social-media' | 'packaging' | 'general' | 'none'>('none');

    // Brief Assignment States
    const [selectedBriefAccountId, setSelectedBriefAccountId] = useState<number | string | null>(null);
    const [selectedBriefFormType, setSelectedBriefFormType] = useState<'logo' | 'brand-identity' | 'web-design' | 'social-media' | 'packaging' | 'general'>('logo');

    // Proposal States
    const [showProposalModal, setShowProposalModal] = useState(false);

    const [printingProposal, setPrintingProposal] = useState<Proposal | null>(null);
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
    const [newProposalTitle, setNewProposalTitle] = useState('');
    const [newProposalClient, setNewProposalClient] = useState('');
    const [newProposalAmount, setNewProposalAmount] = useState('');


    // Transaction States
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | string | null>(null);
    const [transType, setTransType] = useState<'Debt' | 'Payment'>('Debt');
    const [transAmount, setTransAmount] = useState('');
    const [transDesc, setTransDesc] = useState('');

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyAccountId, setHistoryAccountId] = useState<number | string | null>(null);
    const [accountDetailTab, setAccountDetailTab] = useState<'transactions' | 'projects'>('transactions');





    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        addProject({
            id: Date.now(),
            title: newProjectTitle,
            client: newProjectClient,
            linkedAccountId: newProjectAccountId || undefined,
            category: "New Work",
            year: "2026",
            image: "/projects/p1.png",
            description: "New project initialized by admin.",
            status: 'Planning',
            progress: 0,
            tasks: [],
            files: [],
            team: []
        });
        setShowProjectModal(false);
        setNewProjectTitle('');
        setNewProjectClient('');
        setNewProjectAccountId(null);
    };

    const handleCreateBrandPage = () => {
        const newProjectId = Date.now();
        addProject({
            id: newProjectId,
            title: "New Brand Page",
            client: "",
            category: "Brand Page",
            year: "2026",
            image: "/projects/p1.png",
            description: "New brand page draft",
            status: 'Planning',
            progress: 0,
            tasks: [],
            files: [],
            team: [],
            // @ts-ignore - pageBlocks might be optional or dynamic
            pageBlocks: []
        });
        router.push(`/admin/brand-page/${newProjectId}/edit`);
    };

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        addInvoice({
            id: Math.floor(Math.random() * 1000) + 100, // Mock ID
            client: newInvClient,
            amount: newInvAmount,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: newInvStatus
        });
        setShowInvoiceModal(false);
        setNewInvClient('');
        setNewInvAmount('');
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense({
            id: Date.now(),
            title: newExpTitle,
            amount: parseFloat(newExpAmount),
            currency: newExpCurrency,
            category: newExpCategory,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        setShowExpenseModal(false);
        setNewExpTitle('');
        setNewExpAmount('');
    };



    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        // Use context action which handles API call and state update
        addAccount({
            id: Date.now(), // Temp ID, will be replaced by backend ID in context
            name: newAccountName,
            company: newAccountCompany,
            email: newAccountEmail,
            password: newAccountPassword,
            totalDebt: 0,
            totalPaid: 0,
            balance: 0,
            status: 'Active',
            briefFormType: newAccountBriefType === 'none' ? undefined : newAccountBriefType,
            briefStatus: newAccountBriefType === 'none' ? 'none' : 'pending',
            transactions: []
        });

        // Close modal and reset form
        setShowAccountModal(false);
        setNewAccountName('');
        setNewAccountCompany('');
        setNewAccountEmail('');
        setNewAccountPassword('');
        setNewAccountBriefType('none');
    };

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAccountId === null) return;

        // Assuming addTransaction is available from useAgency context
        // You would need to add `addTransaction` to the destructuring of `useAgency()`
        // e.g., `const { ..., addTransaction, ... } = useAgency();`
        // For now, this will cause a type error if not added.
        addTransaction(selectedAccountId, {
            id: Date.now(),
            accountId: selectedAccountId,
            type: transType,
            amount: parseFloat(transAmount),
            description: transDesc,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });

        setShowTransactionModal(false);
        setTransAmount('');
        setTransDesc('');
    };

    // Financial Logic (Exchange Rates Mock)
    const RATES = { USD: 34.50, EUR: 37.20 };

    const calculateTotalRevenueTRY = () => {
        return invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => {
            const val = parseInt(curr.amount.replace(/[^0-9]/g, ''));
            // Very naive check, assuming all invoices are TRY for now or formatted like ₺
            // In a real app we would parse currency symbol.
            return acc + val;
        }, 0);
    };

    const calculateTotalExpensesTRY = () => {
        return expenses.reduce((acc, curr) => {
            let val = curr.amount;
            if (curr.currency === 'USD') val *= RATES.USD;
            if (curr.currency === 'EUR') val *= RATES.EUR;
            return acc + val;
        }, 0);
    };

    const revenueVal = calculateTotalRevenueTRY();
    const expenseVal = calculateTotalExpensesTRY();
    const netProfit = revenueVal - expenseVal;

    // Stats Logic
    const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
    const unreadMessages = messages.filter(m => !m.read).length;

    const stats = [
        {
            label: "Net Profit (YTD)",
            value: "₺" + netProfit.toLocaleString(),
            change: revenueVal > expenseVal ? `+${((netProfit / revenueVal) * 100).toFixed(1)}% Margin` : "Loss",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
            color: netProfit > 0 ? 'text-green-500' : 'text-red-500'
        },
        {
            label: "Total Revenue",
            value: "₺" + revenueVal.toLocaleString(),
            change: "Gross Income",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            color: 'text-[#a62932]'
        },
        {
            label: "Active Projects",
            value: activeProjectsCount.toString(),
            change: `${projects.filter(p => p.status === 'Review').length} in Review`,
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
            color: 'text-blue-500'
        },
        {
            label: "Inbox",
            value: unreadMessages.toString(),
            change: unreadMessages > 0 ? "New Messages" : "All Caught Up",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
            color: unreadMessages > 0 ? 'text-yellow-500' : 'text-green-500'
        },
    ];

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-500 overflow-hidden relative ${isAdminNight ? 'bg-[#050505] text-[#f5f3e9]' : 'bg-[#f5f3e9] text-[#050505]'}`}>

            {/* Power User Command Bar */}
            <CommandBar onNavigate={setActiveTab} onProjectSelect={setSelectedProject} />

            {/* Detail Overlay */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDetailView
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                        isAdminNight={isAdminNight}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`w-64 border-r backdrop-blur-xl p-8 pt-16 flex flex-col hidden md:flex ${isAdminNight ? 'border-white/5 bg-[#0a0a0a]/50' : 'border-black/5 bg-white/50'}`}>
                <h1 className="text-xl font-[900] tracking-tight pl-4">alp<span className="opacity-40">os</span> <span className="text-[10px] bg-[#a62932] text-white px-1 rounded ml-1 align-top relative top-1">ADMIN</span></h1>

                {/* Spacer */}
                <div className="h-4"></div>

                <nav className="flex-1 space-y-1 mt-8">
                    {[
                        { id: 'overview', name: 'Dashboard', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" /></svg> },
                        { id: 'projects', name: 'Projects', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
                        { id: 'brand-pages', name: 'Brand Pages', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
                        { id: 'accounts', name: 'Accounts', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                        { id: 'proposals', name: 'Proposals', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                        { id: 'briefs', name: 'Client Briefs', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
                        { id: 'finance', name: 'Finance', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
                        { id: 'scene-settings', name: 'Scene', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                        { id: 'seo', name: 'SEO Settings', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
                        { id: 'dev-status', name: 'System Log', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
                        { id: 'inbox', name: 'Inbox', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-200 flex items-center gap-3 group ${activeTab === item.id
                                ? 'bg-[#a62932] text-white shadow-lg shadow-[#a62932]/30 scale-[1.02]'
                                : 'opacity-60 hover:opacity-100 hover:scale-[1.02] hover:shadow-md ' + (isAdminNight ? 'hover:bg-white/10 hover:shadow-white/5' : 'hover:bg-black/5 hover:shadow-black/5')
                                }`}
                        >
                            <span className={`transition-transform duration-200 group-hover:scale-110 ${activeTab === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.icon}</span>
                            {item.name}
                            {item.id === 'inbox' && unreadMessages > 0 && <span className="ml-auto bg-white text-[#a62932] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">{unreadMessages}</span>}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-current/5 space-y-2">
                    <button
                        onClick={toggleAdminTheme}
                        className="flex items-center gap-3 opacity-60 hover:opacity-100 cursor-pointer transition-opacity w-full text-left"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdminNight ? 'bg-white/10' : 'bg-black/5'}`}>
                            {isAdminNight ? '🌙' : '☀️'}
                        </div>
                        <div>
                            <p className="text-xs font-bold">Mode</p>
                            <p className="text-[10px] opacity-50">{isAdminNight ? 'Night' : 'Day'}</p>
                        </div>
                    </button>

                    <a
                        href="/"
                        className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity w-full text-left py-2"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdminNight ? 'bg-white/10' : 'bg-black/5'}`}>
                            🏠
                        </div>
                        <p className="text-xs font-bold">Ana Sayfa</p>
                    </a>

                    <button
                        onClick={async () => {
                            try {
                                // Clear server-side session first
                                await fetch('/api/auth/logout', { method: 'POST' });
                            } catch (e) {
                                console.error('Logout API error:', e);
                            }
                            // Then clear local storage
                            localStorage.removeItem('alpa_auth');
                            localStorage.removeItem('client_session');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity w-full text-left py-2"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdminNight ? 'bg-white/10' : 'bg-black/5'}`}>
                            🚪
                        </div>
                        <p className="text-xs font-bold">Çıkış Yap</p>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-3xl font-light tracking-tight">
                            {activeTab === 'overview' && 'Dashboard'}
                            {activeTab === 'projects' && 'Projects'}
                            {activeTab === 'accounts' && 'Client Accounts'}
                            {activeTab === 'proposals' && 'Proposals'}
                            {activeTab === 'finance' && 'Finance'}
                            {activeTab === 'inbox' && 'Inbox'}
                            {activeTab === 'dev-status' && 'System Log'}
                            {activeTab === 'brand-pages' && 'Brand Pages'}
                            {activeTab === 'briefs' && 'Client Briefs'}
                            {activeTab === 'scene-settings' && 'Scene Settings'}
                            {activeTab === 'seo' && 'SEO Ayarları'}
                        </h2>
                        <p className="opacity-40 text-xs mt-2 uppercase tracking-widest">
                            {activeTab === 'overview' && 'Business Overview'}
                            {activeTab === 'projects' && 'Manage Your Work'}
                            {activeTab === 'accounts' && 'Cari Hesap Takibi'}
                            {activeTab === 'proposals' && 'Teklif Yönetimi'}
                            {activeTab === 'finance' && 'Gelir & Gider'}
                            {activeTab === 'inbox' && 'Messages & Notifications'}
                            {activeTab === 'dev-status' && 'Development Status'}
                            {activeTab === 'brand-pages' && 'Premium Showcase System'}
                            {activeTab === 'briefs' && 'Müşteri Brief Formları'}
                            {activeTab === 'scene-settings' && 'Anasayfa 3D Sahne Yönetimi'}
                            {activeTab === 'seo' && 'Meta Başlık, Açıklama ve Sayfa Ayarları'}
                            <span className="mx-2 opacity-30">•</span>
                            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    {/* Global Actions per Tab */}
                    <div className="flex gap-3">
                        {activeTab === 'projects' && (
                            <button
                                onClick={() => setShowProjectModal(true)}
                                className="bg-[#a62932] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#a62932]/20 hover:shadow-[#a62932]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                + New Project
                            </button>
                        )}
                        {activeTab === 'accounts' && (
                            <button
                                onClick={() => setShowAccountModal(true)}
                                className="bg-[#a62932] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#a62932]/20 hover:shadow-[#a62932]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                + Add Account
                            </button>
                        )}
                        {activeTab === 'proposals' && (
                            <button
                                onClick={() => setShowProposalModal(true)}
                                className="bg-[#a62932] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#a62932]/20 hover:shadow-[#a62932]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                + New Proposal
                            </button>
                        )}
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {stats.map((stat, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={stat.label}
                                    className={`border p-6 rounded-2xl relative overflow-hidden group transition-all hover:scale-[1.02] ${isAdminNight ? 'bg-[#0a0a0a]/60 border-white/5 hover:border-white/10' : 'bg-white/80 border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/5'}`}
                                >
                                    {/* Floating Icon */}
                                    <div className={`absolute top-4 right-4 ${stat.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                                        {stat.icon}
                                    </div>

                                    <h3 className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-3">{stat.label}</h3>
                                    <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                                    <p className={`text-xs mt-3 ${stat.color} flex items-center gap-1 font-medium`}>
                                        {stat.change}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                                Active Work <span className="w-full h-px bg-current/5 ml-4"></span>
                            </h3>
                            <div className="grid gap-4">
                                {projects.filter(p => p.status === 'In Progress' || p.status === 'Review').length === 0 ? (
                                    <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                        <div className="text-5xl mb-4">🚀</div>
                                        <h4 className="text-lg font-bold mb-2">Aktif İş Yok</h4>
                                        <p className="text-sm opacity-50 max-w-xs mx-auto">Şu anda devam eden veya incelemede bekleyen proje bulunmuyor.</p>
                                        <button
                                            onClick={() => setActiveTab('projects')}
                                            className="mt-6 px-6 py-2 text-xs font-bold uppercase tracking-widest bg-[#a62932] text-white rounded-lg hover:bg-[#a62932]/80 transition-colors"
                                        >
                                            Projelere Git
                                        </button>
                                    </div>
                                ) : (
                                    projects.filter(p => p.status === 'In Progress' || p.status === 'Review').map((project, i) => (
                                        <div key={project.id}>
                                            <ProjectCard project={project} index={i} isAdminNight={isAdminNight} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* Operations Hub (Projects) */}
                {activeTab === 'projects' && (
                    <div className="space-y-12">
                        {/* Kanban Board */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Kanban Board</h3>
                                <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest opacity-40">
                                    <button className="hover:opacity-100 transition-opacity">To Do</button>
                                    <button className="hover:opacity-100 transition-opacity">In Progress</button>
                                    <button className="hover:opacity-100 transition-opacity">Review</button>
                                    <button className="hover:opacity-100 transition-opacity">Done</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {projects.map(project => (
                                    <motion.div
                                        key={project.id}
                                        layoutId={`project-${project.id}`}
                                        className={`group relative aspect-[16/9] rounded-lg overflow-hidden border transition-all ${isAdminNight ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/5 bg-white'}`}
                                    >
                                        {/* Background Image */}
                                        <img
                                            src={project.image}
                                            alt={project.title}
                                            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                        {/* Fallback gradient if no image */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#a62932]/20 to-[#1a1a1a]/80 -z-10" />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 p-5 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent">

                                            {/* Top Actions */}
                                            <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0 duration-300">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md ${project.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white'}`}>
                                                    {project.status}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm({ show: true, type: 'project', id: project.id, title: project.title });
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            {/* Bottom Info */}
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 text-white">
                                                    {project.client}
                                                </p>
                                                <h3 className="text-xl font-bold leading-none mb-3 text-white">
                                                    {project.title}
                                                </h3>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedProject(project)}
                                                        className="flex-1 py-2 rounded bg-[#a62932] text-white text-[10px] font-bold uppercase hover:bg-[#a62932]/80 transition-colors shadow-lg shadow-red-900/20"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Accounts / Cari Hesap View */}
                {activeTab === 'accounts' && (
                    <div className="space-y-6">
                        <div className={`rounded-xl border overflow-hidden ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                            <table className="w-full text-left">
                                <thead className={`text-[10px] uppercase font-bold tracking-widest ${isAdminNight ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}>
                                    <tr>
                                        <th className="p-6">Client / Company</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Total Debt</th>
                                        <th className="p-6 text-right">Total Paid</th>
                                        <th className="p-6 text-right">Balance</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((account, i) => (
                                        <tr key={account.id} className={`border-b last:border-0 hover:bg-current/5 transition-colors ${isAdminNight ? 'border-white/5' : 'border-black/5'}`}>
                                            <td className="p-6">
                                                <h4 className="font-bold">{account.name}</h4>
                                                <p className="text-xs opacity-40">{account.company}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${account.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right font-mono text-sm opacity-60">
                                                ₺{account.totalDebt.toLocaleString()}
                                            </td>
                                            <td className="p-6 text-right font-mono text-sm text-green-500">
                                                ₺{account.totalPaid.toLocaleString()}
                                            </td>
                                            <td className="p-6 text-right font-mono font-bold text-lg">
                                                <span className={account.balance > 0 ? 'text-red-500' : 'text-gray-500'}>
                                                    ₺{account.balance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setHistoryAccountId(account.id);
                                                        setShowHistoryModal(true);
                                                    }}
                                                    className="px-3 py-1 rounded border border-current/20 text-xs font-bold hover:bg-current/10 transition-colors"
                                                >
                                                    History
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAccountId(account.id);
                                                        setTransType('Debt'); // Default
                                                        setShowTransactionModal(true);
                                                    }}
                                                    className="px-3 py-1 rounded bg-[#a62932] text-white text-xs font-bold hover:bg-[#a62932]/80 transition-colors"
                                                >
                                                    + Transaction
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ show: true, type: 'account', id: account.id, title: account.name })}
                                                    className="px-3 py-1 rounded border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {accounts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center opacity-40 text-sm">
                                                No accounts found. Start by adding a new client.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Finance View */}
                {activeTab === 'finance' && (
                    <div className="space-y-8">
                        {/* Header & Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* Ticker Tape */}
                            <div className="flex gap-6 overflow-hidden whitespace-nowrap opacity-50 text-xs font-mono">
                                <span className="text-green-500">USD/TRY: 34.50 (+0.2%)</span>
                                <span className="text-green-500">EUR/TRY: 37.20 (+0.1%)</span>
                                <span>NASDAQ: 18,400</span>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowExpenseModal(true)}
                                    className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${isAdminNight ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                                >
                                    + Add Expense
                                </button>
                                <button
                                    onClick={() => setShowInvoiceModal(true)}
                                    className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest bg-[#a62932] text-white shadow-lg shadow-[#a62932]/20 transition-all hover:scale-105 active:scale-95 hover:bg-[#a62932]/90"
                                >
                                    + New Invoice
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* P&L Summary */}
                            <div className={`border p-8 rounded-xl ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Profit & Loss</h3>
                                    <span className="text-xs opacity-30 font-mono">YTD 2026</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Total Income</span>
                                        <span className="text-green-500 font-bold">₺{revenueVal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Total Expenses</span>
                                        <span className="text-red-500 font-bold">-₺{expenseVal.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-current/10 my-2"></div>
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>Net Profit</span>
                                        <span className={netProfit > 0 ? 'text-green-500' : 'text-red-500'}>₺{netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expenses List */}
                            <div className={`border p-8 rounded-xl ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Recent Expenses</h3>
                                    <button className="text-[10px] opacity-40 hover:opacity-100 uppercase font-bold">View All</button>
                                </div>
                                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {expenses.length === 0 ? (
                                        <div className="text-center py-8 opacity-50">
                                            <div className="text-3xl mb-2">💸</div>
                                            <p className="text-sm">Henüz gider kaydı yok</p>
                                        </div>
                                    ) : (
                                        expenses.map(exp => (
                                            <div key={exp.id} className="flex justify-between items-center group py-2 border-b border-white/5 last:border-0">
                                                <div>
                                                    <p className="font-bold text-sm">{exp.title}</p>
                                                    <p className="text-[10px] opacity-40">{exp.category} • {exp.date}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono text-sm">{exp.amount} {exp.currency}</span>
                                                    <button onClick={() => setDeleteConfirm({ show: true, type: 'expense', id: exp.id, title: exp.title })} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs hover:bg-red-500/10 p-1 rounded transition-all">✕</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoices (Existing) */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Invoices</h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-500 rounded">Paid: {invoices.filter(i => i.status === 'Paid').length}</span>
                                    <span className="text-[10px] px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded">Pending: {invoices.filter(i => i.status === 'Pending').length}</span>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {invoices.length === 0 ? (
                                    <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                        <div className="text-4xl mb-3">🧾</div>
                                        <h4 className="font-bold mb-1">Henüz Fatura Yok</h4>
                                        <p className="text-sm opacity-50">Yeni fatura oluşturmak için yukarıdaki butonu kullanın</p>
                                    </div>
                                ) : (
                                    invoices.map(invoice => (
                                        <div key={invoice.id} className={`p-6 rounded-xl border flex items-center justify-between transition-colors hover:border-[#a62932]/30 ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${invoice.status === 'Paid' ? 'bg-green-500/10 text-green-500' : invoice.status === 'Overdue' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    {invoice.status === 'Paid' ? '✓' : invoice.status === 'Overdue' ? '!' : '⟳'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{invoice.client}</h4>
                                                    <p className="text-xs opacity-40">INV-{invoice.id} • {invoice.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{invoice.amount}</p>
                                                <p className="text-[10px] opacity-40">{invoice.date}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Team View REMOVED per user request */}

                {/* Proposals View */}
                {activeTab === 'proposals' && (
                    <div className="grid gap-6">
                        {proposals.length === 0 && <p className="opacity-40 text-center py-20">No proposals found.</p>}
                        {proposals.map(proposal => (
                            <div key={proposal.id} className={`p-6 rounded-xl border group transition-all ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{proposal.title}</h3>
                                            <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-widest font-bold ${proposal.status === 'Sent' ? 'bg-blue-500/10 text-blue-500' :
                                                proposal.status === 'Accepted' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-current/5 opacity-50'
                                                }`}>
                                                {proposal.status}
                                            </span>
                                        </div>
                                        <p className="opacity-60 text-sm mb-4">{proposal.clientName} • Valid until {proposal.validUntil}</p>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => setEditingProposal(proposal)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isAdminNight ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setPrintingProposal(proposal)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isAdminNight ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                Print
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ show: true, type: 'proposal', id: proposal.id, title: proposal.title })}
                                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">₺{proposal.totalAmount.toLocaleString()}</p>
                                    <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Total Value</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inbox View */}
                {
                    activeTab === 'inbox' && (
                        <div className="grid gap-4">
                            {messages.length === 0 && (
                                <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                    <div className="text-6xl mb-4">📬</div>
                                    <h4 className="text-xl font-bold mb-2">Mesaj Kutusu Boş</h4>
                                    <p className="text-sm opacity-50 max-w-sm mx-auto mb-6">
                                        Henüz mesaj almadınız. Müşteriler brief gönderdiğinde veya sistem bildirimleri olduğunda burada görünecek.
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => setActiveTab('briefs')}
                                            className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-current/20 rounded-lg hover:bg-current/5 transition-colors"
                                        >
                                            Brieflere Git
                                        </button>
                                    </div>
                                </div>
                            )}
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => markMessageRead(msg.id)}
                                    className={`p-6 rounded-xl border cursor-pointer transition-all ${!msg.read ? (isAdminNight ? 'border-[#a62932]/50 bg-[#a62932]/10' : 'border-[#a62932]/50 bg-[#a62932]/5') : (isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5 opacity-60' : 'bg-white/60 border-black/5 opacity-60')}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {!msg.read && <div className="w-2 h-2 rounded-full bg-[#a62932]"></div>}
                                            <h4 className="font-bold">{msg.from}</h4>
                                            <span className="text-[10px] opacity-40 border border-current px-2 rounded-full uppercase tracking-wider">{msg.type}</span>
                                        </div>
                                        <span className="text-xs opacity-40">{msg.date}</span>
                                    </div>
                                    <h5 className="font-bold text-sm mb-1">{msg.subject}</h5>
                                    <p className="text-sm opacity-60 line-clamp-2">{msg.content}</p>
                                </motion.div>
                            ))}
                        </div>
                    )
                }

                {/* Brand Pages View */}
                {activeTab === 'brand-pages' && (
                    <div>
                        {/* Header */}
                        <div className="mb-12 flex items-end justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Brand Pages</h3>
                                <p className="text-sm opacity-60">Create premium brand showcase pages</p>
                            </div>
                            <button
                                onClick={handleCreateBrandPage}
                                className="px-6 py-3 bg-[#a62932] text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#c4323d] transition-colors"
                            >
                                + Create Brand Page
                            </button>
                        </div>

                        {/* Brand Pages List */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {/* Show all Brand Page projects */}
                            {projects
                                .filter(p => p.category === 'Brand Page')
                                .map(project => (
                                    <div key={project.id} className="group border border-current/10 rounded-xl overflow-hidden hover:border-current/30 transition-colors">
                                        <div className="aspect-[16/10] bg-gradient-to-br from-[#F5F3E9] to-[#E8E6DC] flex items-center justify-center">
                                            {project.brandData?.logos?.light ? (
                                                <img src={project.brandData.logos.light} alt={project.title} className="max-h-12 object-contain" />
                                            ) : (
                                                <div className="text-6xl">🎨</div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-lg font-bold">{project.title}</h4>
                                                {project.isPagePublished && (
                                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                                                        Published
                                                    </span>
                                                )}
                                                {!project.isPagePublished && (
                                                    <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm opacity-60 mb-4">{project.description}</p>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`/admin/brand-page/${project.id}/edit`}
                                                    className="flex-1 px-4 py-2 text-center text-sm font-bold border border-current/20 rounded-lg hover:bg-current/5 transition-colors"
                                                >
                                                    Edit
                                                </a>
                                                {project.isPagePublished && (
                                                    <a
                                                        href={`/projects/${project.id}`}
                                                        target="_blank"
                                                        className="flex-1 px-4 py-2 text-center text-sm font-bold border border-current/20 rounded-lg hover:bg-current/5 transition-colors"
                                                    >
                                                        View ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Create New Card */}
                            <button
                                onClick={handleCreateBrandPage}
                                className="group border-2 border-dashed border-current/20 rounded-xl p-12 flex flex-col items-center justify-center hover:border-current/40 hover:bg-current/5 transition-colors cursor-pointer w-full"
                            >
                                <div className="text-4xl mb-4 opacity-40 group-hover:opacity-60 transition-opacity">+</div>
                                <p className="text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                                    Create New Brand Page
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Client Briefs View */}
                {activeTab === 'briefs' && (
                    <div>
                        {/* Brief Templates Section */}
                        <div className="mb-12">
                            <h3 className="text-xl font-bold mb-6">Form Şablonları</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[
                                    { id: 'logo', name: 'Logo Brief', icon: '✒️' },
                                    { id: 'brand-identity', name: 'Kurumsal Kimlik', icon: '🎨' },
                                    { id: 'web-design', name: 'Web Tasarım', icon: '🌐' },
                                    { id: 'social-media', name: 'Sosyal Medya', icon: '📱' },
                                    { id: 'packaging', name: 'Ambalaj', icon: '📦' },
                                    { id: 'general', name: 'Genel Brief', icon: '📋' },
                                ].map(template => (
                                    <div
                                        key={template.id}
                                        className={`p-6 rounded-xl border text-center cursor-pointer transition-all hover:scale-[1.02] ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10 hover:border-white/30' : 'bg-white/60 border-black/5 hover:border-black/20 hover:shadow-lg'}`}
                                    >
                                        <div className="text-3xl mb-2">{template.icon}</div>
                                        <p className="text-xs font-bold">{template.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Send Brief Section */}
                        <div className="mb-12">
                            <h3 className="text-xl font-bold mb-6">Form Ata</h3>
                            <div className={`p-8 rounded-xl border ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Client Selection */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Müşteri Seç</label>

                                        <select
                                            value={selectedBriefAccountId || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const acc = accounts.find(a => String(a.id) === val);
                                                setSelectedBriefAccountId(acc ? acc.id : null);
                                            }}
                                            className={`w-full px-4 py-3 rounded-lg border text-sm ${isAdminNight ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}
                                        >
                                            <option value="">Müşteri seçin...</option>
                                            {/* RELAXED FILTER: Show all accounts so user can assign brief to anyone even if they have one */}
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.company} - {acc.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] opacity-40 mt-1">Tüm müşteriler listeleniyor</p>
                                    </div>

                                    {/* Form Type Selection */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Form Tipi</label>
                                        <select
                                            value={selectedBriefFormType}
                                            onChange={e => setSelectedBriefFormType(e.target.value as typeof selectedBriefFormType)}
                                            className={`w-full px-4 py-3 rounded-lg border text-sm ${isAdminNight ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}
                                        >
                                            <option value="logo">✒️ Logo Brief</option>
                                            <option value="brand-identity">🎨 Kurumsal Kimlik</option>
                                            <option value="web-design">🌐 Web Tasarım</option>
                                            <option value="social-media">📱 Sosyal Medya</option>
                                            <option value="packaging">📦 Ambalaj</option>
                                            <option value="general">📋 Genel Brief</option>
                                        </select>
                                    </div>

                                    {/* Send Button */}
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                if (selectedBriefAccountId) {
                                                    updateAccount(selectedBriefAccountId, {
                                                        briefFormType: selectedBriefFormType,
                                                        briefStatus: 'pending'
                                                    });
                                                    setSelectedBriefAccountId(null);
                                                    alert('Form başarıyla atandı!');
                                                } else {
                                                    alert('Lütfen bir müşteri seçin');
                                                }
                                            }}
                                            disabled={!selectedBriefAccountId}
                                            className={`w-full px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${selectedBriefAccountId
                                                ? 'bg-[#a62932] text-white hover:bg-[#c4323d]'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Form Ata
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Briefs */}
                        <div>
                            <h3 className="text-xl font-bold mb-6">Bekleyen Briefler</h3>
                            {accounts.filter(acc => acc.briefStatus === 'submitted').length > 0 ? (
                                <div className="space-y-4">
                                    {accounts.filter(acc => acc.briefStatus === 'submitted').map(acc => (
                                        <div
                                            key={acc.id}
                                            className={`p-6 rounded-xl border ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-3xl">
                                                        {acc.briefFormType === 'logo' && '✒️'}
                                                        {acc.briefFormType === 'brand-identity' && '🎨'}
                                                        {acc.briefFormType === 'web-design' && '🌐'}
                                                        {acc.briefFormType === 'social-media' && '📱'}
                                                        {acc.briefFormType === 'packaging' && '📦'}
                                                        {acc.briefFormType === 'general' && '📋'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold">{acc.company}</h4>
                                                        <p className="text-sm opacity-60">{acc.name} • {acc.email}</p>
                                                        <p className="text-xs opacity-40 mt-1">
                                                            Gönderim: {acc.briefSubmittedAt ? new Date(acc.briefSubmittedAt).toLocaleDateString('tr-TR') : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            // Show brief responses in alert (for demo)
                                                            const responses = acc.briefResponses;
                                                            if (responses) {
                                                                alert('Brief Cevapları:\n\n' + Object.entries(responses).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${isAdminNight ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                                                    >
                                                        Görüntüle
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            updateAccount(acc.id, {
                                                                briefStatus: 'approved',
                                                                briefApprovedAt: new Date().toISOString()
                                                            });
                                                        }}
                                                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-green-500 text-white hover:bg-green-600"
                                                    >
                                                        Onayla
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`rounded-xl border overflow-hidden ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5'}`}>
                                    <div className="p-12 text-center opacity-40">
                                        <p className="text-4xl mb-4">📋</p>
                                        <p className="text-sm">Henüz bekleyen brief yok</p>
                                        <p className="text-xs mt-2">Müşteriler brief gönderdiğinde burada görünecek</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Scene Settings View */}
                {activeTab === 'scene-settings' && (
                    <SceneSettings isAdminNight={isAdminNight} />
                )}

                {/* SEO Settings View */}
                {activeTab === 'seo' && (
                    <SEOSettings isAdminNight={isAdminNight} />
                )}

            </main>

            {/* Modals */}
            <AnimatePresence>


                {
                    showInvoiceModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowInvoiceModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`rounded-2xl w-full max-w-md overflow-hidden ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white shadow-2xl'}`}
                            >
                                {/* Modal Header */}
                                <div className={`px-8 py-6 border-b flex justify-between items-center ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/[0.02]'}`}>
                                    <div>
                                        <h3 className="text-lg font-bold">Create Invoice</h3>
                                        <p className="text-xs opacity-40 mt-0.5">Issue a new invoice to a client</p>
                                    </div>
                                    <button
                                        onClick={() => setShowInvoiceModal(false)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isAdminNight ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                    >
                                        <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <form onSubmit={handleCreateInvoice} className="p-8 space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-2">Client Name</label>
                                        <input placeholder="e.g. Nordic Exploration" value={newInvClient} onChange={e => setNewInvClient(e.target.value)} required className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a62932]/50 transition-all ${isAdminNight ? 'border-white/10' : 'border-black/10'}`} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-2">Amount</label>
                                        <input placeholder="₺45,000" value={newInvAmount} onChange={e => setNewInvAmount(e.target.value)} required className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a62932]/50 transition-all ${isAdminNight ? 'border-white/10' : 'border-black/10'}`} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-2">Status</label>
                                        <select value={newInvStatus} onChange={e => setNewInvStatus(e.target.value as any)} className={`w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a62932]/50 transition-all ${isAdminNight ? 'border-white/10' : 'border-black/10'}`}>
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">Overdue</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full bg-[#a62932] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-[#a62932]/20 hover:shadow-[#a62932]/40 hover:scale-[1.01] active:scale-[0.99] transition-all">Issue Invoice</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showExpenseModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowExpenseModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-sm ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <h3 className="text-xl font-bold mb-6">Add Expense</h3>
                                <form onSubmit={handleAddExpense} className="space-y-4">
                                    <input placeholder="Expense Title" value={newExpTitle} onChange={e => setNewExpTitle(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <input placeholder="Amount" type="number" value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <div className="flex gap-4">
                                        <select value={newExpCurrency} onChange={e => setNewExpCurrency(e.target.value as any)} className="w-1/2 bg-transparent border-b border-current/20 py-2 focus:outline-none">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="TRY">TRY</option>
                                        </select>
                                        <select value={newExpCategory} onChange={e => setNewExpCategory(e.target.value as any)} className="w-1/2 bg-transparent border-b border-current/20 py-2 focus:outline-none">
                                            <option value="Software">Software</option>
                                            <option value="Rent">Rent</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Salaries">Salaries</option>
                                            <option value="Misc">Misc</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full bg-red-800 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl mt-4">Log Expense</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {/* Delete Confirmation Modal */}
                {deleteConfirm.show && (() => {
                    // Check if account has related projects
                    const hasRelatedProjects = deleteConfirm.type === 'account' && deleteConfirm.id
                        ? projects.some(p => {
                            const account = accounts.find(a => a.id === deleteConfirm.id);
                            return account && (p.client === account.name || p.client === account.company);
                        })
                        : false;

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setDeleteConfirm({ show: false, type: null, id: null, title: '' })}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-sm text-center ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <div className="text-5xl mb-4">{hasRelatedProjects ? '📦' : '⚠️'}</div>
                                <h3 className="text-xl font-bold mb-2">
                                    {deleteConfirm.type === 'project' ? 'Projeyi Sil' :
                                        deleteConfirm.type === 'proposal' ? 'Teklifi Sil' :
                                            deleteConfirm.type === 'expense' ? 'Gideri Sil' :
                                                deleteConfirm.type === 'account' ? (hasRelatedProjects ? 'Müşteriyi Arşivle' : 'Müşteriyi Sil') : 'Sil'}
                                </h3>
                                <p className="text-sm opacity-60 mb-6">
                                    {hasRelatedProjects ? (
                                        <>
                                            <span className="font-bold">&quot;{deleteConfirm.title}&quot;</span> müşterisine bağlı projeler mevcut. Bu müşteri silinemez, ancak <span className="text-amber-500 font-semibold">arşive taşınabilir</span>.
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold">&quot;{deleteConfirm.title}&quot;</span>
                                            {deleteConfirm.type === 'project' ? ' projesini' :
                                                deleteConfirm.type === 'proposal' ? ' teklifini' :
                                                    deleteConfirm.type === 'expense' ? ' giderini' :
                                                        deleteConfirm.type === 'account' ? ' müşterisini' : ''} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                        </>
                                    )}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirm({ show: false, type: null, id: null, title: '' })}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isAdminNight ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                                    >
                                        İptal
                                    </button>
                                    {hasRelatedProjects ? (
                                        <button
                                            onClick={() => {
                                                if (deleteConfirm.id) {
                                                    updateAccount(deleteConfirm.id, { status: 'Archived' });
                                                }
                                                setDeleteConfirm({ show: false, type: null, id: null, title: '' });
                                            }}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                        >
                                            Arşivle
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (deleteConfirm.id) {
                                                    if (deleteConfirm.type === 'project') {
                                                        deleteProject(Number(deleteConfirm.id));
                                                    } else if (deleteConfirm.type === 'proposal') {
                                                        deleteProposal(Number(deleteConfirm.id));
                                                    } else if (deleteConfirm.type === 'expense') {
                                                        removeExpense(Number(deleteConfirm.id));
                                                    } else if (deleteConfirm.type === 'account') {
                                                        deleteAccount(deleteConfirm.id);
                                                    }
                                                }
                                                setDeleteConfirm({ show: false, type: null, id: null, title: '' });
                                            }}
                                            className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}

                {
                    showProjectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowProjectModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-sm ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <h3 className="text-xl font-bold mb-6">New Project</h3>
                                <form onSubmit={handleCreateProject} className="space-y-4">
                                    <input placeholder="Project Title" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <select
                                        className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none opacity-80"
                                        value={newProjectAccountId || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewProjectAccountId(val || null);
                                            if (val) {
                                                const acc = accounts.find(a => String(a.id) === val);
                                                if (acc) setNewProjectClient(acc.company || acc.name);
                                            } else {
                                                setNewProjectClient('');
                                            }
                                        }}
                                    >
                                        <option value="" className="text-black">No Linked Account (Manual Client)</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id} className="text-black">
                                                {acc.company} ({acc.name})
                                            </option>
                                        ))}
                                    </select>
                                    <input placeholder="Client Name" value={newProjectClient} onChange={e => setNewProjectClient(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <button type="submit" className="w-full bg-[#a62932] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl mt-4">Initialize Project</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }



                {
                    showTransactionModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowTransactionModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-sm ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <h3 className="text-xl font-bold mb-6">Add Transaction</h3>
                                <form onSubmit={handleAddTransaction} className="space-y-4">
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setTransType('Debt')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${transType === 'Debt' ? 'bg-red-500 text-white' : 'bg-current/10 opacity-50'}`}
                                        >
                                            Borç (Debt)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransType('Payment')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${transType === 'Payment' ? 'bg-green-500 text-white' : 'bg-current/10 opacity-50'}`}
                                        >
                                            Tahsilat (Payment)
                                        </button>
                                    </div>
                                    <input placeholder="Amount (e.g. 5000)" type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <input placeholder="Description (e.g. Logo Design Advance)" value={transDesc} onChange={e => setTransDesc(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <button type="submit" className="w-full bg-[#a62932] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl mt-4">Save Transaction</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showHistoryModal && historyAccountId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowHistoryModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">Account Details</h3>
                                    <button onClick={() => setShowHistoryModal(false)} className="opacity-50 hover:opacity-100">✕</button>
                                </div>

                                {/* TABS */}
                                <div className="flex gap-4 mb-6 border-b border-current/10 pb-4">
                                    <button
                                        onClick={() => setAccountDetailTab('transactions')}
                                        className={`text-sm font-bold uppercase tracking-widest ${accountDetailTab === 'transactions' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        Transactions
                                    </button>
                                    <button
                                        onClick={() => setAccountDetailTab('projects')}
                                        className={`text-sm font-bold uppercase tracking-widest ${accountDetailTab === 'projects' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        Projects ({projects.filter(p => String(p.linkedAccountId) === String(historyAccountId)).length})
                                    </button>
                                </div>

                                {/* CONTENT */}
                                <div className="space-y-4">
                                    {accountDetailTab === 'transactions' ? (
                                        // TRANSACTIONS LIST
                                        (accounts.find(a => a.id === historyAccountId)?.transactions || []).length === 0 ? (
                                            <div className="text-center opacity-40 py-8">No transactions found.</div>
                                        ) : (
                                            (accounts.find(a => a.id === historyAccountId)?.transactions || [])
                                                .slice().reverse()
                                                .map((t, i) => (
                                                    <div key={i} className={`flex justify-between items-center p-4 rounded-lg border ${isAdminNight ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                                                        <div>
                                                            <p className="font-bold text-sm">{t.description}</p>
                                                            <p className="text-[10px] opacity-40">{t.date}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-mono text-sm font-bold ${t.type === 'Debt' ? 'text-red-500' : 'text-green-500'}`}>
                                                                {t.type === 'Debt' ? '+' : '-'}₺{t.amount.toLocaleString()}
                                                            </p>
                                                            <p className="text-[10px] opacity-40 uppercase">{t.type === 'Debt' ? 'Borç' : 'Tahsilat'}</p>
                                                        </div>
                                                    </div>
                                                ))
                                        )
                                    ) : (
                                        // PROJECTS LIST
                                        projects.filter(p => String(p.linkedAccountId) === String(historyAccountId)).length === 0 ? (
                                            <div className="text-center opacity-40 py-8">No linked projects found.</div>
                                        ) : (
                                            projects.filter(p => String(p.linkedAccountId) === String(historyAccountId)).map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProject(p);
                                                        setShowHistoryModal(false);
                                                    }}
                                                    className={`group cursor-pointer flex justify-between items-center p-4 rounded-lg border transition-all hover:scale-[1.02] ${isAdminNight ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-black/5 bg-black/5 hover:bg-black/10'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }}></div>
                                                        <div>
                                                            <p className="font-bold text-sm">{p.title}</p>
                                                            <p className="text-[10px] opacity-40">{p.year} • {p.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                                                            p.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                                                                'bg-current/10 opacity-50'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {/* PROPOSAL MODAL */}
                {
                    showProposalModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowProposalModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-lg ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <h3 className="text-xl font-bold mb-6">Create New Proposal</h3>
                                {/* Simple Form for now */}
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    addProposal({
                                        id: Date.now(),
                                        title: newProposalTitle,
                                        clientName: newProposalClient,
                                        date: new Date().toLocaleDateString('en-CA'),
                                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
                                        items: [], // Start empty
                                        totalAmount: parseFloat(newProposalAmount) || 0,
                                        status: 'Draft',
                                        currency: 'TRY'
                                    });
                                    setShowProposalModal(false);
                                    setNewProposalTitle('');
                                    setNewProposalClient('');
                                    setNewProposalAmount('');
                                }} className="space-y-4">
                                    <input placeholder="Proposal Title (e.g. Mobile App Design)" value={newProposalTitle} onChange={e => setNewProposalTitle(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />
                                    <div className="flex gap-2">
                                        <select value={newProposalClient} onChange={e => setNewProposalClient(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none">
                                            <option value="" disabled className="text-black">Select Client (Account)</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.company || acc.name} className="text-black">{acc.company ? `${acc.company} (${acc.name})` : acc.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => setShowAccountModal(true)} className="px-3 py-1 bg-[#a62932] text-white rounded text-xs font-bold">+</button>
                                    </div>
                                    <input placeholder="Estimated Total Amount (TRY)" type="number" value={newProposalAmount} onChange={e => setNewProposalAmount(e.target.value)} required className="w-full bg-transparent border-b border-current/20 py-2 focus:outline-none" />

                                    <button type="submit" className="w-full bg-[#a62932] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl mt-4">Create Draft</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showAccountModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setShowAccountModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`p-8 rounded-2xl w-full max-w-md ${isAdminNight ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                            >
                                <h3 className="text-xl font-bold mb-6">Yeni Müşteri Hesabı</h3>
                                <form onSubmit={handleAddAccount} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Yetkili Adı</label>
                                        <input
                                            placeholder="örn: Ahmet Yılmaz"
                                            value={newAccountName}
                                            onChange={e => setNewAccountName(e.target.value)}
                                            required
                                            className={`w-full px-4 py-3 rounded-lg border ${isAdminNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:border-[#a62932] focus:outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Şirket Adı</label>
                                        <input
                                            placeholder="örn: Tech Start A.Ş."
                                            value={newAccountCompany}
                                            onChange={e => setNewAccountCompany(e.target.value)}
                                            required
                                            className={`w-full px-4 py-3 rounded-lg border ${isAdminNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:border-[#a62932] focus:outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">E-posta (Giriş için)</label>
                                        <input
                                            type="email"
                                            placeholder="örn: info@firma.com"
                                            value={newAccountEmail}
                                            onChange={e => setNewAccountEmail(e.target.value)}
                                            required
                                            className={`w-full px-4 py-3 rounded-lg border ${isAdminNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:border-[#a62932] focus:outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Şifre (Min 8 karakter + 1 rakam)</label>
                                        <input
                                            type="text"
                                            placeholder="örn: sifre123"
                                            value={newAccountPassword}
                                            onChange={e => setNewAccountPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            pattern=".*[0-9].*"
                                            title="En az 8 karakter ve 1 rakam içermelidir"
                                            className={`w-full px-4 py-3 rounded-lg border ${isAdminNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:border-[#a62932] focus:outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-1">Brief Formu (Opsiyonel)</label>
                                        <select
                                            value={newAccountBriefType}
                                            onChange={e => setNewAccountBriefType(e.target.value as typeof newAccountBriefType)}
                                            className={`w-full px-4 py-3 rounded-lg border ${isAdminNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:border-[#a62932] focus:outline-none`}
                                        >
                                            <option value="none">Henüz form atama</option>
                                            <option value="logo">✒️ Logo Brief</option>
                                            <option value="brand-identity">🎨 Kurumsal Kimlik</option>
                                            <option value="web-design">🌐 Web Tasarım</option>
                                            <option value="social-media">📱 Sosyal Medya</option>
                                            <option value="packaging">📦 Ambalaj</option>
                                            <option value="general">📋 Genel Brief</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full bg-[#a62932] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl mt-4 hover:bg-[#c4323d] transition-colors">Hesap Oluştur</button>
                                </form>
                            </motion.div>
                        </div>
                    )
                }


                {/* PROPOSAL EDITOR MODAL */}
                {/* SPLIT-SCREEN LIVE PROPOSAL STUDIO (WYSIWYG) */}
                {editingProposal && (
                    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:flex-row h-screen w-screen overflow-hidden">

                        {/* LEFT COLUMN: EDITOR PANEL (40%) */}
                        <div className={`w-full md:w-[400px] lg:w-[450px] shadow-2xl flex flex-col h-full border-r ${isAdminNight ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Live Editor
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => window.print()} className="bg-white/10 p-2 rounded hover:bg-white/20" title="Print Now">🖨️</button>
                                    <button onClick={() => {
                                        updateProposal(editingProposal.id, editingProposal);
                                        setEditingProposal(null);
                                    }} className="text-sm font-bold opacity-50 hover:opacity-100">CLOSE</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* BRANDING SECTION */}
                                <div className="space-y-4 border-b border-white/10 pb-6">
                                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Branding & Labels</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Company Name (Logo)</label>
                                            <input
                                                value={editingProposal.logoText || 'AGENCY.OS'}
                                                onChange={e => setEditingProposal({ ...editingProposal, logoText: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Slogan (Subtext)</label>
                                            <input
                                                value={editingProposal.logoSubtext || 'Creative Digital Solutions'}
                                                onChange={e => setEditingProposal({ ...editingProposal, logoSubtext: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Prepared For Label</label>
                                            <input
                                                value={editingProposal.preparedForLabel || 'Prepared For'}
                                                onChange={e => setEditingProposal({ ...editingProposal, preparedForLabel: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Project Label</label>
                                            <input
                                                value={editingProposal.projectLabel || 'Project'}
                                                onChange={e => setEditingProposal({ ...editingProposal, projectLabel: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* METADATA SECTION */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Proposal Details</h4>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Proposal Title</label>
                                        <input
                                            value={editingProposal.title}
                                            onChange={e => setEditingProposal({ ...editingProposal, title: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Client Name</label>
                                            <input
                                                value={editingProposal.clientName}
                                                onChange={e => setEditingProposal({ ...editingProposal, clientName: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Valid Until</label>
                                            <input
                                                type="date"
                                                value={editingProposal.validUntil}
                                                onChange={e => setEditingProposal({ ...editingProposal, validUntil: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Attention Note</label>
                                        <input
                                            value={editingProposal.attnText || 'Attn: Project Manager'}
                                            onChange={e => setEditingProposal({ ...editingProposal, attnText: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Currency Symbol</label>
                                            <input
                                                value={editingProposal.currencySymbol || '₺'}
                                                onChange={e => setEditingProposal({ ...editingProposal, currencySymbol: e.target.value })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] opacity-50 block mb-1">Tax Rate (%)</label>
                                            <input
                                                type="number"
                                                value={editingProposal.taxRate !== undefined ? editingProposal.taxRate : 20}
                                                onChange={e => setEditingProposal({ ...editingProposal, taxRate: parseFloat(e.target.value) })}
                                                className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS SECTION */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Line Items</h4>
                                        <button
                                            onClick={() => setEditingProposal({
                                                ...editingProposal,
                                                items: [...(editingProposal.items || []), { id: Date.now(), description: "New Service Item", quantity: 1, unitPrice: 0, total: 0 }]
                                            })}
                                            className="text-[10px] bg-[#a62932] text-white px-3 py-1 rounded-full font-bold hover:scale-105 transition-transform"
                                        >
                                            + ADD ITEM
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {(editingProposal.items || []).map((item, index) => (
                                            <div key={index} className={`p-4 rounded-xl border group ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                                                <div className="flex justify-between mb-2">
                                                    <input
                                                        value={item.description}
                                                        onChange={e => {
                                                            const newItems = [...(editingProposal.items || [])];
                                                            newItems[index].description = e.target.value;
                                                            setEditingProposal({ ...editingProposal, items: newItems });
                                                        }}
                                                        className="bg-transparent font-medium w-full focus:outline-none"
                                                        placeholder="Item Description"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newItems = (editingProposal.items || []).filter((_, i) => i !== index);
                                                            const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
                                                            setEditingProposal({ ...editingProposal, items: newItems, totalAmount: newTotal });
                                                        }}
                                                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-500 transition-all"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <div className="flex-1">
                                                        <label className="text-[8px] uppercase opacity-50 block">Qty</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => {
                                                                const newItems = [...(editingProposal.items || [])];
                                                                const qty = parseFloat(e.target.value) || 0;
                                                                newItems[index].quantity = qty;
                                                                newItems[index].total = qty * newItems[index].unitPrice;
                                                                // Calc Total
                                                                const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
                                                                setEditingProposal({ ...editingProposal, items: newItems, totalAmount: newTotal });
                                                            }}
                                                            className="w-full bg-transparent border-b border-current/10 py-1 text-sm focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[8px] uppercase opacity-50 block">Unit Price</label>
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={e => {
                                                                const newItems = [...(editingProposal.items || [])];
                                                                const price = parseFloat(e.target.value) || 0;
                                                                newItems[index].unitPrice = price;
                                                                newItems[index].total = newItems[index].quantity * price;
                                                                // Calc Total
                                                                const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
                                                                setEditingProposal({ ...editingProposal, items: newItems, totalAmount: newTotal });
                                                            }}
                                                            className="w-full bg-transparent border-b border-current/10 py-1 text-sm focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="text-right">
                                                        <label className="text-[8px] uppercase opacity-50 block">Total</label>
                                                        <span className="font-bold text-sm">₺{item.total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* FOOTER SECTION */}
                                <div className="space-y-4 border-t border-white/10 pt-6">
                                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Footer & Signing</h4>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Signatory Name</label>
                                        <input
                                            value={editingProposal.footerName || 'Selin Alpa'}
                                            onChange={e => setEditingProposal({ ...editingProposal, footerName: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Signatory Title</label>
                                        <input
                                            value={editingProposal.footerTitle || 'Authorized Signature'}
                                            onChange={e => setEditingProposal({ ...editingProposal, footerTitle: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Closing Note</label>
                                        <input
                                            value={editingProposal.footerNote || 'Thank you for your business.'}
                                            onChange={e => setEditingProposal({ ...editingProposal, footerNote: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] opacity-50 block mb-1">Website</label>
                                        <input
                                            value={editingProposal.website || 'www.agencyos.com'}
                                            onChange={e => setEditingProposal({ ...editingProposal, website: e.target.value })}
                                            className="w-full bg-transparent border-b border-current/20 py-2 font-medium focus:outline-none focus:border-[#a62932] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SAVE BUTTON - Sticky Bottom */}
                            <div className={`p-4 border-t shrink-0 ${isAdminNight ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'}`}>
                                <button
                                    onClick={() => {
                                        updateProposal(editingProposal.id, editingProposal);
                                        setEditingProposal(null);
                                    }}
                                    className="w-full bg-[#a62932] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                >
                                    Save & Close Studio
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: REAL-TIME PREVIEW (60%) */}
                        <div className="flex-1 bg-[#525659] p-8 md:p-12 overflow-y-auto flex justify-center items-start shadow-inner">
                            {/* A4 PAPER PREVIEW */}
                            <motion.div
                                layoutId="paper-preview"
                                className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[20mm] relative shadow-2xl origin-top transition-transform duration-300"
                                style={{ transformOrigin: 'top center' }}
                            >
                                {/* DOCUMENT CONTENT (Same as Print Preview but sourced from editingProposal) */}
                                <div className="flex justify-between items-start mb-16">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tighter mb-2">{editingProposal.logoText || 'AGENCY.OS'}</h1>
                                        <p className="text-xs opacity-50 uppercase tracking-widest">{editingProposal.logoSubtext || 'Creative Digital Solutions'}</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-3xl font-light mb-1">PROPOSAL</h2>
                                        <p className="opacity-50 text-sm">#{editingProposal.id}</p>
                                        <p className="text-sm font-bold mt-2">{editingProposal.date}</p>
                                    </div>
                                </div>

                                <div className="border-t border-b border-black/10 py-8 mb-12 flex justify-between">
                                    <div className="w-1/2">
                                        <h5 className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-2">{editingProposal.preparedForLabel || 'Prepared For'}</h5>
                                        <h3 className="text-xl font-bold break-words pr-4">{editingProposal.clientName || 'Client Name'}</h3>
                                        <p className="text-sm opacity-60">{editingProposal.attnText || 'Attn: Project Manager'}</p>
                                    </div>
                                    <div className="w-1/2 text-right">
                                        <h5 className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-2">{editingProposal.projectLabel || 'Project'}</h5>
                                        <h3 className="text-xl font-bold break-words pl-4">{editingProposal.title || 'Project Title'}</h3>
                                        <p className="text-sm opacity-60">Valid until {editingProposal.validUntil}</p>
                                    </div>
                                </div>

                                <div className="mb-12">
                                    <h4 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-4 mb-4">Services & Deliverables</h4>
                                    {editingProposal.items && editingProposal.items.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] uppercase opacity-50">
                                                    <th className="py-2">Description</th>
                                                    <th className="py-2 text-right">Qty</th>
                                                    <th className="py-2 text-right">Price</th>
                                                    <th className="py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editingProposal.items.map(item => (
                                                    <tr key={item.id} className="border-b border-black/5">
                                                        <td className="py-4 font-medium">{item.description}</td>
                                                        <td className="py-4 text-right opacity-60">{item.quantity}</td>
                                                        <td className="py-4 text-right opacity-60">{(editingProposal.currencySymbol || '₺')}{item.unitPrice.toLocaleString()}</td>
                                                        <td className="py-4 text-right font-bold">{(editingProposal.currencySymbol || '₺')}{item.total.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="py-8 text-center bg-gray-50 rounded-lg">
                                            <p className="opacity-50 italic">Start adding items from the panel to see them here.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mb-20">
                                    <div className="w-1/3">
                                        <div className="flex justify-between py-2 border-b border-black/10">
                                            <span className="opacity-50">Subtotal</span>
                                            <span className="font-bold">{(editingProposal.currencySymbol || '₺')}{editingProposal.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-black/10">
                                            <span className="opacity-50">Tax ({(editingProposal.taxRate !== undefined ? editingProposal.taxRate : 20)}%)</span>
                                            <span className="font-bold">{(editingProposal.currencySymbol || '₺')}{(editingProposal.totalAmount * ((editingProposal.taxRate !== undefined ? editingProposal.taxRate : 20) / 100)).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-4 text-xl">
                                            <span className="font-black">TOTAL</span>
                                            <span className="font-black text-[#a62932]">{(editingProposal.currencySymbol || '₺')}{(editingProposal.totalAmount * (1 + ((editingProposal.taxRate !== undefined ? editingProposal.taxRate : 20) / 100))).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] border-t-2 border-black pt-8 flex justify-between items-end">
                                    <div>
                                        <h4 className="font-bold mb-4">{editingProposal.footerName || 'Selin Alpa'}</h4>
                                        <div className="h-12 border-b border-dashed border-black w-48 mb-2"></div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">{editingProposal.footerTitle || 'Authorized Signature'}</p>
                                    </div>
                                    <div className="text-right opacity-50 text-xs">
                                        <p>{editingProposal.footerNote || 'Thank you for your business.'}</p>
                                        <p>{editingProposal.website || 'www.agencyos.com'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )
                }


                {/* DEV STATUS TAB (SYSTEM LOG) */}
                {
                    activeTab === 'dev-status' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            {/* Completed Section */}
                            <section>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    System Status: v1.0 (MVP)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        {
                                            title: "⚔️ Core Architecture",
                                            items: [
                                                "Next.js 14 App Router Foundation",
                                                "AgencyContext (Global State Management)",
                                                "Dark/Light Mode Theme Engine",
                                                "Responsive Layout Infrastructure",
                                                "LocalStorage Persistence (Zero-Config)"
                                            ]
                                        },
                                        {
                                            title: "3D Interactive Experience",
                                            items: [
                                                "React Three Fiber (R3F) Scene",
                                                "Physically Accurate Ice Refraction",
                                                "Dynamic Mouse & Scroll Interaction",
                                                "Performance Optimization (DPR/FBO)",
                                                "Environment & Lighting Systems"
                                            ]
                                        },
                                        {
                                            title: "Admin Dashboard & CRM",
                                            items: [
                                                "Project Management (CRUD & Status)",
                                                "Client Accounts (Cari Hesap System)",
                                                "Transaction Logic (Debts/Credits)",
                                                "Financial Overview & Charts",
                                                "Team Roster Management"
                                            ]
                                        },
                                        {
                                            title: "Live Proposal Studio ✨",
                                            items: [
                                                "Split-Screen WYSIWYG Editor",
                                                "Real-Time A4 Document Preview",
                                                "Full Brand Customization (Logo/Footer)",
                                                "Dynamic Pricing & Tax Calculations",
                                                "PDF Print / Export Engine"
                                            ]
                                        },
                                        {
                                            title: "Client Portal",
                                            items: [
                                                "Secure Client Access Route",
                                                "Project Timeline & Milestones",
                                                "File Approval System (Accept/Reject)",
                                                "Feedback & Revision Request Flow",
                                                "Financial Transparency View"
                                            ]
                                        },
                                        {
                                            title: "System Utilities",
                                            items: [
                                                "Role-Based Access Control (RBAC)",
                                                "Hydration Error Suppression",
                                                "Auto-Redirect Authentication Guard",
                                                "Currency Formatting & Locale Logic",
                                                "Dev Status / System Log Tracker"
                                            ]
                                        }
                                    ].map((module, i) => (
                                        <div key={i} className={`p-6 rounded-xl border ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-white border-black/5'}`}>
                                            <h4 className="font-bold mb-4 text-sm uppercase tracking-widest opacity-80">{module.title}</h4>
                                            <ul className="space-y-3">
                                                {module.items.map((item, j) => (
                                                    <li key={j} className="text-xs opacity-60 flex items-start gap-2">
                                                        <span className="text-green-500 font-bold mt-0.5">✓</span>
                                                        <span className="leading-tight">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Missing / Roadmap Section */}
                            <section>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 opacity-50">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    Pending / Roadmap
                                </h3>
                                <div className={`p-8 rounded-xl border border-dashed ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold mb-4 flex items-center gap-2">Infrastructure (Critical)</h4>
                                            <ul className="space-y-3 text-sm opacity-70">
                                                <li className="flex gap-3">
                                                    <span className="text-red-500 font-bold">!</span>
                                                    <span><strong className="block text-current">Real Database (Supabase/Postgres)</strong> Currently using LocalStorage. Data is local to this browser only.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-red-500 font-bold">!</span>
                                                    <span><strong className="block text-current">Cloud Storage (AWS S3)</strong> File uploads are simulated. Need real blob storage for assets.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-yellow-500 font-bold">•</span>
                                                    <span><strong className="block text-current">Authentication Provider (Clerk/Auth0)</strong> Current login is hardcoded (admin/2024). Needs secure hashing.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-yellow-500 font-bold">•</span>
                                                    <span><strong className="block text-current">Email Infra (Resend/SendGrid)</strong> Contact Form and Invoices do not actually send emails.</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-4 flex items-center gap-2">Features (Nice to Have)</h4>
                                            <ul className="space-y-3 text-sm opacity-70">
                                                <li className="flex gap-3">
                                                    <span className="text-blue-500 font-bold">+</span>
                                                    <span><strong className="block text-current">Real-Time Chat</strong> WebSocket integration for direct Client-Admin messaging.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-blue-500 font-bold">+</span>
                                                    <span><strong className="block text-current">Advanced Analytics</strong> Google Analytics / Vercel Web Vitals integration.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="text-blue-500 font-bold">+</span>
                                                    <span><strong className="block text-current">Mobile Native App</strong> React Native port for push notifications on iOS.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}

function ProjectCard({ project, index, isAdminNight }: { project: any, index: number, isAdminNight: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            className={`border p-6 rounded-xl flex items-center justify-between group transition-colors ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5 hover:bg-[#0a0a0a]/40' : 'bg-white/40 border-black/5 hover:bg-white/80'}`}
        >
            <div className="flex items-center gap-6">
                <div className="w-10 h-10 rounded-lg bg-[#a62932]/10 flex items-center justify-center text-[#a62932] font-bold text-lg">
                    {project.title.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-lg group-hover:text-[#a62932] transition-colors">{project.title}</h4>
                    <p className="text-xs opacity-40">{project.client}</p>
                </div>
            </div>

            <div className="flex items-center gap-12">
                <div className="w-32 hidden md:block">
                    <div className="flex justify-between text-[10px] opacity-40 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-current/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#a62932]" style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>

                <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : project.status === 'Review' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-current/5 text-current/50'}`}>
                        {project.status}
                    </span>
                    <p className="text-[10px] opacity-30 mt-1 text-right">{project.dueDate || 'No Date'}</p>
                </div>
            </div>
        </motion.div>
    )
}
