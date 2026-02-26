import { Project } from "@/context/AgencyContext";

// Shared props interface for all dashboard tab components
export interface DashboardTabProps {
    isAdminNight: boolean;
    searchQuery: string;
    setDeleteConfirm: (v: { show: boolean; type: 'project' | 'proposal' | 'expense' | 'account' | null; id: number | string | null; title: string }) => void;
}

export interface OverviewTabProps extends DashboardTabProps {
    stats: { label: string; value: string | number; change: string; color: string; icon: React.ReactNode }[];
    projects: Project[];
    setActiveTab: (tab: string) => void;
}

export interface ProjectsTabProps extends DashboardTabProps {
    projects: Project[];
    setSelectedProject: (p: Project) => void;
    setShowMilestonesFor: (v: { projectId: string; projectTitle: string } | null) => void;
    loadMilestones: (projectId: string) => void;
    onStatusChange?: (projectId: number | string, newStatus: string) => void;
}

export interface AccountsTabProps extends DashboardTabProps {
    accounts: any[];
    setEditCredAccountId: (id: string) => void;
    setEditCredUsername: (v: string) => void;
    setEditCredPassword: (v: string) => void;
    setHistoryAccountId: (id: number | string) => void;
    setShowHistoryModal: (v: boolean) => void;
    setSelectedAccountId: (id: number | string) => void;
    setTransType: (v: 'Debt' | 'Payment') => void;
    setShowTransactionModal: (v: boolean) => void;
}

export interface FinanceTabProps extends DashboardTabProps {
    exchangeRates: { USD: number; EUR: number; GBP: number };
    ratesLastUpdated: string | null;
    revenueVal: number;
    expenseVal: number;
    netProfit: number;
    expenses: any[];
    setShowExpenseModal: (v: boolean) => void;
}

export interface ProposalsTabProps extends DashboardTabProps {
    proposals: any[];
    setEditingProposal: (p: any) => void;
    setPrintingProposal: (p: any) => void;
}
