'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminPath, getDefaultAdminPathForUser } from '@/lib/roleAccess';
import { isCeo, isFoeOrCeo } from '@/lib/roleChecks';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import ForcePasswordChangeModal from '@/components/auth/ForcePasswordChangeModal';
import FoeWorkloadSidebar, { type CounselorWorkload, type WorkloadPeriod } from '@/components/leads/FoeWorkloadSidebar';
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Home,
  TrendingUp,
  Building,
  Calendar,
  Bell,
  Search,
  User,
  ChevronDown,
  Target,
  DollarSign,
  Globe,
  Briefcase,
  UserCheck,
  CreditCard,
  MessageSquare,
  FileCheck,
  UserPlus,
  RefreshCw,
  Shield,
  Database,
  Mail,
  Award,
  Clock,
  Plane,
  Layers,
  MapPin,
  Activity,
  CheckCircle,
  TrendingDown,
  Upload,
  Send,
  ListChecks,
  Route,
  Zap
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  permissions?: string[];
  badge?: number;
  // Hides the item unless the current user is CEO, regardless of permission
  // grants — for pages meant to stay CEO-exclusive even if someone else is
  // later given the permissions this group otherwise checks (e.g. leads.view).
  ceoOnly?: boolean;
}

interface GlobalSearchResult {
  id: string | number;
  title: string;
  subtitle?: string | null;
  type: string;
  href: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Closed by default: on lg+ screens the sidebar is always visible regardless
  // of this state (see the `lg:translate-x-0` override below), so this only
  // ever controls the mobile/tablet overlay - starting it `true` meant every
  // admin page loaded with a full-screen sidebar + backdrop blocking the
  // actual content below the lg breakpoint.
  const [sidebarOpen, setSidebarOpen] = useState(false);
const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [foeSidebarOpen, setFoeSidebarOpen] = useState(false);
  const [foeWorkloadPeriod, setFoeWorkloadPeriod] = useState<WorkloadPeriod>('all');
  const [counselorWorkload, setCounselorWorkload] = useState<{ counselors: CounselorWorkload[]; unassignedLeads: number }>({ counselors: [], unassignedLeads: 0 });

  useEffect(() => {
    if (isLoading || !user || canAccessAdminPath(user, pathname)) return;
    router.replace(getDefaultAdminPathForUser(user));
  }, [isLoading, pathname, router, user]);

  // "My Assignments" sidebar badge — total calls/tasks/appointments assigned
  // to this user that are still pending. Polled on an interval rather than
  // just on mount, since assignments can arrive at any point in the session.
  const canSeeOpsAssignments = hasPermission('operations.view') || hasPermission('operations.manage') || hasPermission('operations.assign_activities');
  useEffect(() => {
    if (!canSeeOpsAssignments) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ops-assignments?scope=mine&status=pending&limit=500');
        if (!res.ok) return;
        const result = await res.json();
        if (!cancelled) setPendingAssignmentsCount(Number(result.count) || 0);
      } catch {
        // Silent — a badge count is a nice-to-have, not worth surfacing an error for.
      }
    };
    load();
    const interval = setInterval(load, 120_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [canSeeOpsAssignments]);

  // FOE/CEO "Counselor Workload" sidebar — real-time assigned-lead counts per
  // counselor. Polled like the assignments badge above, since counts change
  // as leads get assigned/transferred throughout the day.
  const canSeeFoeWorkload = isFoeOrCeo(user);
  useEffect(() => {
    if (!canSeeFoeWorkload) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/counselor-workload?period=${foeWorkloadPeriod}`);
        if (!res.ok) return;
        const result = await res.json();
        if (!cancelled) {
          setCounselorWorkload({
            counselors: Array.isArray(result.counselors) ? result.counselors : [],
            unassignedLeads: Number(result.unassignedLeads) || 0,
          });
        }
      } catch {
        // Silent — same reasoning as the assignments badge above.
      }
    };
    load();
    const interval = setInterval(load, 120_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [canSeeFoeWorkload, foeWorkloadPeriod]);


  const navigationGroups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Dashboard', href: getDefaultAdminPathForUser(user), icon: Home },
        { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, permission: 'analytics.view' },
      ]
    },
    {
      title: 'Lead Management',
      items: [
        { name: 'Leads', href: '/admin/leads', icon: Users, permission: 'leads.view' },
        { name: 'Bulk Lead Upload', href: '/admin/leads/bulk-upload', icon: Upload, permission: 'leads.bulk_upload' },
        { name: 'Clients', href: '/admin/clients', icon: UserCheck, permission: 'clients.view' },
        { name: 'Follow-ups', href: '/admin/follow-ups', icon: Bell, permission: 'leads.view' },
        { name: 'Appointments', href: '/admin/appointments', icon: Calendar, permission: 'appointments.manage' },
        { name: 'Calendar', href: '/admin/calendar', icon: Calendar, permission: 'appointments.view' },
        { name: 'Agreements', href: '/admin/agreements', icon: FileCheck, permission: 'agreements.view' },
        { name: 'Sample Agreement', href: '/admin/sample-agreement', icon: FileText, permission: 'agreements.view' },
        { name: 'Documents', href: '/admin/documents', icon: FileText, permission: 'documents.view' },
        { name: 'Payments', href: '/admin/payments', icon: CreditCard, permissions: ['sales.view', 'admin.access'] },
        { name: 'Invoices', href: '/admin/invoices', icon: FileText, permissions: ['sales.view', 'admin.access'] },
        { name: 'Discount Management', href: '/admin/discount-approvals', icon: DollarSign, permissions: ['sales.update', 'admin.access'] },
        { name: 'Balance Payments', href: '/admin/balance-payments', icon: DollarSign },
        { name: 'Compliance Approvals', href: '/admin/compliance-approvals', icon: Shield, permissions: ['leads.view', 'admin.access'] },
        { name: 'Lead Pool', href: '/admin/lead-pool', icon: Users, permissions: ['leads.view', 'transfers.manage'] },
        { name: 'Lead Assignment', href: '/admin/lead-assignment-availability', icon: UserPlus, permissions: ['sales.view', 'sales.update', 'admin.access'] },
        { name: 'Assignment Rules', href: '/admin/leads/assignment-rules', icon: Route, permission: 'transfers.manage' },
        { name: 'Targets', href: '/admin/targets', icon: Target, permissions: ['transfers.manage', 'sales.view'] },
        { name: 'Lead Transfers', href: '/admin/lead-transfers', icon: RefreshCw, permission: 'transfers.manage' },
        { name: 'B2B', href: '/admin/b2b', icon: Briefcase, permission: 'b2b.manage' },
        { name: 'Immigration Tools', href: '/admin/immigration-tools', icon: Plane, permission: 'leads.view' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { name: 'Reports Panel', href: '/admin/reports/panel', icon: BarChart3, permission: 'reports.view' },
        { name: 'Lead Reports', href: '/admin/reports/lead-status', icon: Users, permission: 'reports.view' },
        { name: 'Lead Source Analytics', href: '/admin/reports/lead-source-analytics', icon: TrendingUp, permission: 'reports.view' },
        { name: 'Lead Performance', href: '/admin/reports/lead-performance', icon: Award, permission: 'reports.view' },
        { name: 'Conversion Funnel', href: '/admin/reports/lead-conversion-funnel', icon: Target, permission: 'reports.view' },
        { name: 'Sales Performance', href: '/admin/reports/sales-performance', icon: DollarSign, permissions: ['reports.view', 'finance.view', 'sales.view'] },
        { name: 'Lead Aging', href: '/admin/reports/lead-aging', icon: Clock, permission: 'reports.view' },
        { name: 'Operations Report', href: '/admin/ops-report', icon: Activity, permission: 'reports.view' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Ops Dashboard', href: '/admin/ops-dashboard', icon: BarChart3, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Operations Hub', href: '/admin/operations-management', icon: Layers, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Operations Manager Console', href: '/admin/operations-console', icon: Shield, permissions: ['operations.case_transfer', 'operations.case_status_manage', 'operations.access_control'] },
        { name: 'Team Allocation', href: '/admin/operations-team-allocation', icon: Users, permission: 'operations.team_allocation' },
        { name: 'Visit Visa', href: '/admin/ops-clients/visit-visa', icon: Plane, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Canada Skilled', href: '/admin/ops-clients/skill-canada', icon: Award, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Australia Skilled', href: '/admin/ops-clients/skill-australia', icon: Globe, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Job Search', href: '/admin/ops-clients/job-search', icon: Briefcase, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Work Permit', href: '/admin/ops-clients/work-permit', icon: FileCheck, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Germany Job Seeker', href: '/admin/ops-clients/germany-jobseeker', icon: MapPin, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Ops Follow-ups', href: '/admin/ops-follow-ups', icon: Bell, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Conversations', href: '/admin/ops-conversations', icon: MessageSquare, permissions: ['operations.view', 'operations.manage'] },
        { name: 'Assign Call/Task/Appointment', href: '/admin/ops-assign', icon: Send, permissions: ['operations.view', 'operations.manage', 'operations.assign_activities'] },
        { name: 'My Assignments', href: '/admin/ops-my-assignments', icon: ListChecks, permissions: ['operations.view', 'operations.manage', 'operations.assign_activities'], badge: pendingAssignmentsCount || undefined },
      ]
    },
    {
      title: 'Finance',
      items: [
        { name: 'Finance Module', href: '/admin/finance', icon: BarChart3, permissions: ['finance.view', 'finance.manage'] },
        { name: 'Payment Verification', href: '/admin/finance/payment-verification', icon: CheckCircle, permissions: ['finance.view', 'finance.manage', 'payments.view', 'admin.access'] },
        { name: 'Recovery Report', href: '/admin/recovery-report', icon: TrendingDown, permissions: ['finance.view', 'finance.manage', 'payments.view', 'admin.access'] },
        { name: 'Accounts', href: '/admin/accounts', icon: CreditCard, permissions: ['finance.view', 'finance.manage'] },
        { name: 'Sales Report', href: '/admin/accounts/sales-report', icon: BarChart3, permissions: ['finance.view', 'finance.manage', 'sales.view'] },
        { name: 'Chart of Accounts', href: '/admin/accounts/chart-of-accounts', icon: FileText, permissions: ['finance.view', 'finance.manage'] },
        { name: 'Expenses', href: '/admin/accounts/expenses', icon: DollarSign, permissions: ['finance.view', 'finance.manage'] },
        { name: 'P&L Report', href: '/admin/accounts/pnl', icon: TrendingUp, permissions: ['finance.view', 'finance.manage'] },
        { name: 'Payments', href: '/admin/payments', icon: DollarSign, permissions: ['finance.view', 'finance.manage', 'payments.view'] },
        { name: 'Invoices', href: '/admin/invoices', icon: FileText, permissions: ['finance.view', 'finance.manage', 'invoices.view'] },
      ]
    },
    {
      title: 'HR Module',
      items: [
        { name: 'HR Dashboard', href: '/admin/hr', icon: BarChart3, permissions: ['hr.dashboard', 'hr.view', 'hr.payroll', 'hr.eosb', 'hr.self', 'hr.team.attendance_leave'] },
        { name: 'Employee Data Sheet', href: '/admin/hr/employee-data-sheet', icon: Users, permissions: ['hr.view', 'hr.create', 'hr.update', 'hr.self'] },
        { name: 'Attendance Management', href: '/admin/hr/attendance-management', icon: UserCheck, permissions: ['hr.view', 'hr.create', 'hr.update', 'hr.team.attendance_leave'] },
        { name: 'Attendance Reports', href: '/admin/hr/attendance-report', icon: BarChart3, permissions: ['hr.view', 'hr.reports.attendance'] },
        { name: 'Leave Management', href: '/admin/hr/leave-management', icon: Calendar, permissions: ['hr.view', 'hr.create', 'hr.update', 'hr.team.attendance_leave'] },
        { name: 'Holiday List', href: '/admin/hr/holidays', icon: Calendar, permissions: ['hr.view', 'hr.create', 'hr.update'] },
        // My Leave Application / My Resignation are self-service actions every
        // employee needs (file leave/resignation for themselves), so - unlike
        // every other item in this group - they carry no permission gate.
        { name: 'My Leave Application', href: '/admin/my-leave', icon: Calendar },
        { name: 'My Payslips', href: '/admin/my-payslips', icon: FileCheck },
        { name: 'My Resignation', href: '/admin/my-resignation', icon: FileCheck },
        { name: 'Company Handbook', href: '/admin/company-handbook', icon: FileText },
        { name: 'Payroll Management', href: '/admin/hr/payroll-management', icon: DollarSign, permissions: ['hr.payroll', 'hr.view'] },
        { name: 'EOSB', href: '/admin/hr/eosb', icon: FileCheck, permissions: ['hr.eosb', 'hr.view'] },
        { name: 'Payslip Generation', href: '/admin/hr/payslip-generation', icon: CreditCard, permissions: ['hr.payroll', 'hr.view'] },
        { name: 'Recruitment & Joining', href: '/admin/hr/recruitment', icon: UserPlus, permissions: ['hr.view', 'hr.create', 'hr.update'] },
        { name: 'Exit Checklist', href: '/admin/hr/exit-checklist', icon: FileText, permissions: ['hr.view', 'hr.update'] },
        { name: 'Exit Flow', href: '/admin/hr/exit-flow', icon: FileCheck, permissions: ['hr.view', 'hr.update'] },
        { name: 'Letters', href: '/admin/hr/letters', icon: Mail, permissions: ['hr.view', 'hr.update'] },
        { name: 'Exit Interview', href: '/admin/hr/exit-interview', icon: MessageSquare, permissions: ['hr.view', 'hr.update'] },
      ]
    },
    {
      title: 'PRO Works',
      items: [
        { name: 'PRO Dashboard', href: '/admin/pro-works', icon: BarChart3, permissions: ['pro.dashboard', 'pro.view', 'pro.wps.view', 'pro.owners.restricted'] },
        { name: 'Company Documents', href: '/admin/pro-works/company-documents', icon: FileText, permissions: ['pro.view', 'pro.create', 'pro.update'] },
        { name: 'Employee Labour / Immigration', href: '/admin/pro-works/employee-labour-immigration', icon: UserCheck, permissions: ['pro.view', 'pro.create', 'pro.update'] },
        { name: 'WPS Management', href: '/admin/pro-works/wps-management', icon: CreditCard, permissions: ['pro.wps.view', 'pro.view'] },
        { name: 'Renewal Reminders', href: '/admin/pro-works/renewal-reminders', icon: Bell, permissions: ['pro.dashboard', 'pro.view'] },
        { name: 'Insurance List', href: '/admin/pro-works/insurance-list', icon: Shield, permissions: ['pro.view', 'pro.create', 'pro.update'] },
        { name: 'GCC Branch Documents', href: '/admin/pro-works/gcc-branch-documents', icon: Globe, permissions: ['pro.view', 'pro.create', 'pro.update'] },
        { name: 'Owners Database', href: '/admin/pro-works/owners-document-database', icon: Database, permissions: ['pro.owners.restricted', 'admin.access'] },
      ]
    },
    {
      title: 'IT Support',
      items: [
        { name: 'IT Dashboard', href: '/admin/it-support', icon: BarChart3, permissions: ['it.dashboard', 'it.view', 'it.self'] },
        { name: 'My Tickets', href: '/admin/it-support/my-tickets', icon: FileCheck, permissions: ['it.self'] },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Employees', href: '/admin/employees', icon: Briefcase, permission: 'employees.manage' },
        { name: 'Branches', href: '/admin/branches', icon: Building, permission: 'branches.manage' },
        { name: 'Departments', href: '/admin/departments', icon: Building, permission: 'departments.manage' },
        { name: 'Attendance', href: '/admin/attendance', icon: UserCheck, permission: 'attendance.manage' },
        { name: 'Employers', href: '/admin/employers', icon: Briefcase, permission: 'employers.manage' },
        { name: 'Monitoring', href: '/admin/monitoring', icon: Shield, permission: 'monitoring.view' },
      ]
    },
    {
      title: 'Meta Lead Ads',
      items: [
        { name: 'Meta Dashboard', href: '/admin/meta-leads', icon: Activity, permissions: ['admin.access', 'marketing.manage'] },
        { name: 'Meta Leads', href: '/admin/meta-leads/leads', icon: Users, permissions: ['admin.access', 'marketing.manage'] },
        { name: 'Meta Campaigns', href: '/admin/meta-leads/campaigns', icon: BarChart3, permissions: ['admin.access', 'marketing.manage'] },
        { name: 'Field Mappings', href: '/admin/meta-leads/mappings', icon: Settings, permissions: ['admin.access'] },
        { name: 'Meta Settings', href: '/admin/meta-leads/settings', icon: Settings, permissions: ['admin.access'] },
        { name: 'Delivery Logs', href: '/admin/meta-leads/logs', icon: Activity, permissions: ['admin.access'] },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Programs', href: '/admin/programs', icon: Target, permission: 'programs.manage' },
        { name: 'Fees', href: '/admin/fees', icon: DollarSign, permission: 'fees.manage' },
        { name: 'Currency', href: '/admin/currency', icon: Globe, permission: 'currency.manage' },
        { name: 'Countries', href: '/admin/countries', icon: Globe, permission: 'countries.manage' },
        { name: 'Roles', href: '/admin/roles', icon: UserCheck, permission: 'roles.manage' },
        { name: 'Role Permissions', href: '/admin/roles/permissions', icon: Shield, permission: 'admin.access' },
        { name: 'Market Sources', href: '/admin/market-sources', icon: BarChart3, permission: 'marketing.manage' },
        { name: 'Campaigns', href: '/admin/campaigns', icon: MessageSquare, permission: 'campaigns.manage' },
        { name: 'Email Templates', href: '/admin/email-templates', icon: Mail, permission: 'templates.manage' },
        { name: 'Legacy Modules', href: '/admin/legacy-modules', icon: Database, permission: 'settings.manage' },
        { name: 'Automation Rules', href: '/admin/automation-rules', icon: Zap, permission: 'automation.manage' },
        { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.manage' },
      ]
    },
    {
      // Pinned last so it always renders at the bottom of the sidebar. No
      // permission gate on either item - every logged-in employee, regardless
      // of role, needs their own profile and attendance/breaks.
      title: 'My Space',
      items: [
        { name: 'My Profile', href: '/admin/profile', icon: User },
        { name: 'My Attendance & Breaks', href: '/admin/my-attendance', icon: Clock },
      ]
    },
  ];

// Flatten all navigation items for filtering
  const allNavigationItems = navigationGroups.flatMap(group => group.items);

  const filteredNavigation = allNavigationItems.filter(item => {
    if (item.ceoOnly && !isCeo(user as any)) return false;
    if (!canAccessAdminPath(user, item.href)) return false;

    const itemPermissions = item.permissions || (item.permission ? [item.permission] : []);
    const shouldShow = itemPermissions.length === 0 ||
                      user?.permissions?.includes('all') ||
                      itemPermissions.some((permission) => hasPermission(permission));
    return shouldShow;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  useEffect(() => {
    const query = globalSearchQuery.trim();
    if (query.length < 2) {
      setGlobalSearchResults([]);
      setGlobalSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setGlobalSearchLoading(true);
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setGlobalSearchResults(data.results || []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Global search error:', error);
          setGlobalSearchResults([]);
        }
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [globalSearchQuery]);

  const openSearchResult = (href: string) => {
    setGlobalSearchOpen(false);
    setGlobalSearchQuery('');
    setGlobalSearchResults([]);
    router.push(href);
  };

  // Show loading state while user data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen cmg-page-shell flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cmg-blue)] mx-auto mb-4"></div>
          <p className="text-[var(--cmg-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render navigation if no user
  if (!user) {
    return (
      <div className="min-h-screen cmg-page-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--cmg-muted)]">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden cmg-page-shell">
      <ForcePasswordChangeModal />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-[rgba(20,33,61,0.68)]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-72 bg-white border-r border-[var(--cmg-border)] shadow-lg lg:shadow-sm transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="dmc-one-brand flex items-center justify-between px-5 py-4 border-b border-[var(--cmg-border)] flex-shrink-0">
          <div className="flex min-w-0 items-center">
            <div className="dmc-one-logo-frame relative h-14 w-24 flex-shrink-0">
              <Image src="/logo.png" alt="Inzeit Business Consultants" fill sizes="96px" className="object-contain" priority />
            </div>
            <div className="ml-3 min-w-0">
              <span className="dmc-one-title block leading-tight">Inzeit</span>
              <span className="dmc-one-subtitle mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                CRM
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--cmg-muted)] hover:text-[var(--cmg-blue)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 sidebar-nav py-5 px-3 overflow-y-auto">
          <div className="space-y-7">
            {navigationGroups.map((group) => {
              const permittedItems = group.items.filter(item => filteredNavigation.includes(item));
              if (permittedItems.length === 0) return null;

              return (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-[var(--cmg-muted)] uppercase mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {permittedItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-150 border-l-[3px]
                          ${isActive
                            ? 'bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] border-[var(--dmc-gold)] font-semibold'
                            : 'text-[var(--cmg-muted)] border-transparent hover:bg-[#F6EEDC] hover:text-[var(--cmg-ink)] hover:translate-x-0.5'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="flex-1">{item.name}</span>
                        {Boolean(item.badge) && (
                          <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                            {item.badge! > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </nav>

        {/* User info in sidebar */}
        <div className="p-4 border-t border-[var(--cmg-border)] flex-shrink-0 bg-[#FDFBF6]">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-[var(--cmg-blue-soft)] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--cmg-blue)]" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-[var(--cmg-ink)]">{user?.name}</p>
              <p className="text-xs text-[var(--cmg-muted)] capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top navigation */}
        <header className="relative z-40 bg-white/95 backdrop-blur shadow-sm border-b border-[var(--cmg-border)] flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[var(--cmg-muted)] hover:text-[var(--cmg-blue)]"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search bar */}
              <div className="hidden md:block ml-4 flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--cmg-muted)] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reports, leads, or anything..."
                    value={globalSearchQuery}
                    onChange={(event) => {
                      setGlobalSearchQuery(event.target.value);
                      setGlobalSearchOpen(true);
                    }}
                    onFocus={() => setGlobalSearchOpen(true)}
                    onBlur={() => window.setTimeout(() => setGlobalSearchOpen(false), 150)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && globalSearchResults[0]) {
                        openSearchResult(globalSearchResults[0].href);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-transparent bg-[var(--cmg-blue-soft)]/60 rounded-full transition-all duration-150 focus:bg-white focus:border-[var(--cmg-border)] focus:shadow-sm cmg-focus text-[var(--cmg-ink)] placeholder:text-[var(--cmg-muted)]"
                  />
                  {globalSearchOpen && globalSearchQuery.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-md border border-[var(--cmg-border)] bg-white shadow-lg">
                      {globalSearchLoading && (
                        <div className="px-4 py-3 text-sm text-[var(--cmg-muted)]">Searching...</div>
                      )}
                      {!globalSearchLoading && globalSearchResults.length === 0 && (
                        <div className="px-4 py-3 text-sm text-[var(--cmg-muted)]">No results found</div>
                      )}
                      {!globalSearchLoading && globalSearchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}-${result.href}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openSearchResult(result.href)}
                          className="block w-full px-4 py-3 text-left hover:bg-[#F6EEDC]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-medium text-[var(--cmg-ink)]">{result.title}</span>
                            <span className="shrink-0 rounded bg-[var(--cmg-blue-soft)] px-2 py-0.5 text-xs font-medium text-[var(--cmg-blue)]">{result.type}</span>
                          </div>
                          {result.subtitle && (
                            <div className="mt-1 truncate text-xs text-[var(--cmg-muted)]">{result.subtitle}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {canSeeFoeWorkload && (
                <button
                  type="button"
                  onClick={() => setFoeSidebarOpen(true)}
                  aria-label="Counselor workload"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-600" />
                  {counselorWorkload.unassignedLeads > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {counselorWorkload.unassignedLeads > 99 ? '99+' : counselorWorkload.unassignedLeads}
                    </span>
                  )}
                </button>
              )}
              <NotificationCenter />

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
                >
                  <div className="w-8 h-8 bg-[var(--cmg-blue-soft)] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--cmg-blue)]" />
                  </div>
                  <span className="ml-2 hidden md:block text-[var(--cmg-ink)]">{user?.name}</span>
                  <ChevronDown className="ml-2 w-4 h-4 text-[var(--cmg-muted)]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-[var(--cmg-border)] z-50">
                    <div className="p-3 border-b border-[var(--cmg-border)]">
                      <p className="text-sm font-medium text-[var(--cmg-ink)]">{user?.name}</p>
                      <p className="text-xs text-[var(--cmg-muted)]">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--cmg-muted)] hover:bg-[var(--cmg-blue-soft)] hover:text-[var(--cmg-blue)]"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--cmg-muted)] hover:bg-[var(--cmg-blue-soft)] hover:text-[var(--cmg-blue)]"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--cmg-red)] hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-auto p-6">
          {children}
        </main>
      </div>

      {canSeeFoeWorkload && (
        <FoeWorkloadSidebar
          currentUser={user}
          counselors={counselorWorkload.counselors}
          unassignedLeads={counselorWorkload.unassignedLeads}
          open={foeSidebarOpen}
          onOpenChange={setFoeSidebarOpen}
          period={foeWorkloadPeriod}
          onPeriodChange={setFoeWorkloadPeriod}
          hideTrigger
        />
      )}
    </div>
  );
}
