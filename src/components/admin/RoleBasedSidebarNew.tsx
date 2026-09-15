'use client';

import { useState } from 'react';

interface RoleBasedSidebarProps {
  userRole?: string;
  userDepartment?: string;
}

export default function RoleBasedSidebarNew({ userRole = 'employee', userDepartment = 'operations' }: RoleBasedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getNavigationItems = () => {
    // Super Admin - sees everything
    if (userRole === 'admin' || userRole === 'superadmin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
        { id: 'leads', label: 'Leads Management', icon: '👥', href: '/admin/leads' },
        { id: 'clients', label: 'Clients Management', icon: '👤', href: '/admin/clients' },
        { id: 'employees', label: 'Employees Management', icon: '👔', href: '/admin/employees' },
        { id: 'appointments', label: 'Appointments', icon: '📅', href: '/admin/appointments' },
        { id: 'payments', label: 'Payments', icon: '💰', href: '/admin/payments' },
        { id: 'branches', label: 'Branches', icon: '🏢', href: '/admin/branches' },
        { id: 'countries', label: 'Countries', icon: '🌍', href: '/admin/countries' },
        { id: 'departments', label: 'Departments', icon: '🏢', href: '/admin/departments' },
        { id: 'campaigns', label: 'Campaigns', icon: '📢', href: '/admin/campaigns' },
        { id: 'attendance', label: 'Attendance', icon: '⏰', href: '/admin/attendance' },
        { id: 'invoices', label: 'Invoices', icon: '📄', href: '/admin/invoices' },
        { id: 'accounts', label: 'Accounts', icon: '🏦', href: '/admin/accounts' },
        { id: 'b2b', label: 'B2B Management', icon: '🤝', href: '/admin/b2b' },
        { id: 'employers', label: 'Employers', icon: '🏢', href: '/admin/employers' },
        { id: 'reports', label: 'Reports', icon: '📊', href: '/admin/reports' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
      ];
    }

    // Sales Role - sees leads, clients, appointments, payments
    if (userRole === 'sales' || userRole === 'SA' || userRole === 'BCOo' || userRole === 'CPO' || userRole === 'SCPO' || userRole === 'RMSM' || userRole === 'RM' || userRole === 'DGM' || userRole === 'OM' || userRole === 'AOM' || userRole === 'ABOM' || userRole === 'BMO' || userRole === 'RMO' || userRole === 'GOM' || userRole === 'DO' || userRole === 'FMP') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
        { id: 'leads', label: 'Leads Management', icon: '👥', href: '/admin/leads' },
        { id: 'clients', label: 'Clients Management', icon: '👤', href: '/admin/clients' },
        { id: 'appointments', label: 'Appointments', icon: '📅', href: '/admin/appointments' },
        { id: 'payments', label: 'Payments', icon: '💰', href: '/admin/payments' },
        { id: 'reports', label: 'Reports', icon: '📊', href: '/admin/reports' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
      ];
    }

    // Operations Role - sees employees, attendance, branches, reports
    if (userRole === 'operations' || userRole === 'operations' || userRole === 'OP' || userRole === 'AOM' || userRole === 'DO') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
        { id: 'employees', label: 'Employees Management', icon: '👔', href: '/admin/employees' },
        { id: 'attendance', label: 'Attendance', icon: '⏰', href: '/admin/attendance' },
        { id: 'branches', label: 'Branches', icon: '🏢', href: '/admin/branches' },
        { id: 'reports', label: 'Reports', icon: '📊', href: '/admin/reports' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
      ];
    }

    // Finance Role - sees Finance Module, payments, invoices, accounts, reports
    if (userRole === 'finance' || userRole === 'accountant' || userRole === 'CFO') {
      return [
        { id: 'dashboard',      label: 'Dashboard',      icon: '📊', href: '/admin' },
        {
          id: 'finance-module', label: 'Finance Module', icon: '🏦', href: '/admin/finance',
          children: [
            { id: 'finance-sales',    label: 'Sales & Revenue',     icon: '📊', href: '/admin/finance' },
            { id: 'finance-receipts', label: 'Receipts',            icon: '🧾', href: '/admin/finance' },
            { id: 'finance-expenses', label: 'Expenses',            icon: '💸', href: '/admin/finance' },
            { id: 'finance-bank',     label: 'Bank Reconciliation', icon: '🏦', href: '/admin/finance' },
            { id: 'finance-vat',      label: 'VAT / GST',           icon: '📋', href: '/admin/finance' },
            { id: 'finance-ct',       label: 'Corporate Tax',       icon: '🏛', href: '/admin/finance' },
            { id: 'finance-pl',       label: 'P & L Report',        icon: '📈', href: '/admin/finance' },
            { id: 'finance-recovery', label: 'Recovery Report',     icon: '💰', href: '/admin/finance' },
            { id: 'finance-charges',  label: 'Finance Charges',     icon: '💳', href: '/admin/finance' },
          ],
        },
        { id: 'payments',       label: 'Payments',       icon: '💰', href: '/admin/payments'        },
        { id: 'invoices',       label: 'Invoices',       icon: '📄', href: '/admin/invoices'        },
        { id: 'accounts',       label: 'Accounts',       icon: '🏦', href: '/admin/accounts'        },
        { id: 'reports',        label: 'Reports',        icon: '📊', href: '/admin/reports'         },
        { id: 'settings',       label: 'Settings',       icon: '⚙️', href: '/admin/settings'        },
      ];
    }

    // HR Role - sees employees, HR suite, letters, attendance, departments, reports
    if (userRole === 'hr' || userRole === 'HR' || userRole === 'human_resources') {
      return [
        { id: 'dashboard',  label: 'Dashboard',             icon: '📊', href: '/admin'             },
        { id: 'employees',  label: 'Employees Management',  icon: '👔', href: '/admin/employees'   },
        {
          id: 'hr-suite', label: 'HR Suite', icon: '🗂', href: '/admin/hr',
          children: [
            { id: 'hr-main',       label: 'HR Dashboard',       icon: '📊', href: '/admin/hr'                  },
            { id: 'hr-letters',    label: 'Letters & Correspondence', icon: '✉️', href: '/admin/hr/letters'    },
            { id: 'hr-leave',      label: 'Leave Management',   icon: '🏖', href: '/admin/hr/leave-management' },
            { id: 'hr-attendance', label: 'Attendance',         icon: '⏰', href: '/admin/hr/attendance-management' },
            { id: 'hr-payroll',    label: 'Payroll',            icon: '💵', href: '/admin/hr/payroll-management' },
            { id: 'hr-eosb',       label: 'EOSB',              icon: '🏆', href: '/admin/hr/eosb'              },
          ],
        },
        { id: 'attendance', label: 'Attendance',            icon: '⏰', href: '/admin/attendance'   },
        { id: 'departments',label: 'Departments',           icon: '🏢', href: '/admin/departments'  },
        { id: 'reports',    label: 'Reports',               icon: '📊', href: '/admin/reports'      },
        { id: 'settings',   label: 'Settings',              icon: '⚙️', href: '/admin/settings'     },
      ];
    }

    // IT Support - sees settings, reports
    if (userRole === 'it' || userRole === 'IT' || userRole === 'support') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
        { id: 'reports', label: 'Reports', icon: '📊', href: '/admin/reports' },
      ];
    }

    // Default - minimal access
    return [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
      { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
      isCollapsed ? '-translate-x-full' : 'translate-x-0'
    }`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
        <div className="flex items-center">
          <span className="text-lg font-semibold">DM Admin</span>
          <span className="ml-2 text-sm bg-blue-700 px-2 py-1 rounded">Admin Panel</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 6l12 12" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Navigation</h3>
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${
                window.location.pathname === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>

        {/* Department-specific sections */}
        {(userDepartment === 'sales' || userDepartment === 'sales') && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Tools</h3>
            <a
              href="/admin/leads/contract"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${
                window.location.pathname.includes('/admin/leads/contract') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">📝</span>
              Contract Generation
            </a>
            <a
              href="/admin/reports"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${
                window.location.pathname === '/admin/reports' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">📊</span>
              Sales Reports
            </a>
          </div>
        )}

        {(userDepartment === 'operations' || userDepartment === 'operations') && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations Tools</h3>
            <a
              href="/admin/attendance"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${
                window.location.pathname === '/admin/attendance' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">⏰</span>
              Time Tracking
            </a>
            <a
              href="/admin/reports"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 ${
                window.location.pathname === '/admin/reports' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">📊</span>
              Operations Reports
            </a>
          </div>
        )}

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{(userRole?.slice(0, 2) || 'US').toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-900 font-medium">{userRole ? `${userRole.toUpperCase()} User` : 'User'}</div>
              <div className="text-xs text-gray-500">{userRole?.toUpperCase() || 'USER'}</div>
            </div>
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">?</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
