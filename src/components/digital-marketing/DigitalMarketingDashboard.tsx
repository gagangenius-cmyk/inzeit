'use client';

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, CheckCircle2, Calendar, RefreshCw, Megaphone, Target,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalLeads: number;
  todayLeads: number;
  weekLeads: number;
  monthLeads: number;
  convertedLeads: number;
  conversionRate: number;
  statusBreakdown: Array<{ name: string; value: number }>;
  sourceBreakdown: Array<{ name: string; value: number }>;
  monthlyLeads: Array<{ month: string; count: number }>;
}

interface MetaStats {
  todayCount: number;
  weekCount: number;
  delivered: number;
  failed: number;
  pending: number;
  campaignCounts: Array<{ campaign_name: string; count: number }>;
}

const emptyStats: DashboardStats = {
  totalLeads: 0, todayLeads: 0, weekLeads: 0, monthLeads: 0,
  convertedLeads: 0, conversionRate: 0,
  statusBreakdown: [], sourceBreakdown: [], monthlyLeads: [],
};

const emptyMeta: MetaStats = {
  todayCount: 0, weekCount: 0, delivered: 0, failed: 0, pending: 0, campaignCounts: [],
};

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

function StatTile({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-md p-1.5 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DigitalMarketingDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [meta, setMeta] = useState<MetaStats>(emptyMeta);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [dashRes, metaRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/meta-leads/stats'),
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        const s = json.success && json.data ? json.data.stats : json;
        if (s) {
          setStats({
            totalLeads: s.totalLeads || 0,
            todayLeads: s.todayLeads || 0,
            weekLeads: s.weekLeads || 0,
            monthLeads: s.monthLeads || 0,
            convertedLeads: s.convertedLeads || 0,
            conversionRate: parseFloat(s.conversionRate || 0) || 0,
            statusBreakdown: s.statusBreakdown || [],
            sourceBreakdown: s.sourceBreakdown || [],
            monthlyLeads: s.monthlyLeads || [],
          });
        }
      }

      if (metaRes.ok) {
        const metaJson = await metaRes.json();
        setMeta({
          todayCount: metaJson.todayCount || 0,
          weekCount: metaJson.weekCount || 0,
          delivered: metaJson.delivered || 0,
          failed: metaJson.failed || 0,
          pending: metaJson.pending || 0,
          campaignCounts: metaJson.campaignCounts || [],
        });
      }
    } catch (error) {
      console.error('Digital marketing dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Company-wide lead volume, status, and source performance.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Leads" value={stats.totalLeads} icon={Users} accent="bg-blue-50 text-blue-600" />
        <StatTile label="Today's Leads" value={stats.todayLeads} icon={Calendar} accent="bg-sky-50 text-sky-600" />
        <StatTile label="This Week" value={stats.weekLeads} icon={TrendingUp} accent="bg-cyan-50 text-cyan-600" />
        <StatTile label="This Month" value={stats.monthLeads} icon={TrendingUp} accent="bg-indigo-50 text-indigo-600" />
        <StatTile label="Converted" value={stats.convertedLeads} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        <StatTile label="Conversion Rate" value={`${stats.conversionRate}%`} icon={Target} accent="bg-violet-50 text-violet-600" />
        <StatTile label="Meta Leads Today" value={meta.todayCount} icon={Megaphone} accent="bg-amber-50 text-amber-600" />
        <StatTile label="Meta Leads This Week" value={meta.weekCount} icon={Megaphone} accent="bg-orange-50 text-orange-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Lead status breakdown */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Lead Status Breakdown</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.statusBreakdown.map((_, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Lead source breakdown */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Lead Source Breakdown</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sourceBreakdown} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Monthly trend */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Monthly Lead Trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyLeads} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Meta campaigns */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Top Meta Campaigns</h2>
          <div className="mt-3 space-y-2">
            {meta.campaignCounts.length === 0 && (
              <p className="text-sm text-slate-400">No Meta campaign leads yet.</p>
            )}
            {meta.campaignCounts.slice(0, 8).map((c, i) => (
              <div key={`${c.campaign_name}-${i}`} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span className="truncate text-sm text-slate-700">{c.campaign_name || 'Unnamed campaign'}</span>
                <span className="shrink-0 text-sm font-semibold text-slate-900">{c.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Delivered</p>
              <p className="text-sm font-semibold text-emerald-600">{meta.delivered}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-sm font-semibold text-amber-600">{meta.pending}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Failed</p>
              <p className="text-sm font-semibold text-red-600">{meta.failed}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
