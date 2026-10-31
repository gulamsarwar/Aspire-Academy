'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Megaphone,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Eye,
  Database,
  RefreshCw,
  AlertTriangle,
  Copy,
  Terminal,
  CreditCard,
  Cloud,
  Brain,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetToDefaults } = useSiteSettings();

  const [formData, setFormData] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'banner' | 'stats' | 'supabase' | 'razorpay' | 'cloudflare' | 'ai'>('branding');
  const [testQuery, setTestQuery] = useState('Janan kise kahte hai');
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testProvider, setTestProvider] = useState<string | null>(null);

  const handleTestAi = async () => {
    try {
      setTestingAi(true);
      setTestResult(null);
      const res = await fetch('/api/neuron/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery.trim() || 'Janan kise kahte hai',
          geminiApiKey: formData.gemini_api_key,
          groqApiKey: formData.groq_api_key,
        }),
      });
      const data = await res.json();
      setTestResult(data?.reply || 'No response received.');
      setTestProvider(data?.provider || 'unknown');
    } catch (err: any) {
      setTestResult('Error: ' + (err.message || 'Failed to connect to Neuron AI'));
    } finally {
      setTestingAi(false);
    }
  };
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cloudflare R2 State
  const [r2Info, setR2Info] = useState<{ isConfigured: boolean; missing: string[]; bucketName: string | null } | null>(null);
  const [loadingR2, setLoadingR2] = useState(false);

  const fetchR2Status = async () => {
    try {
      setLoadingR2(true);
      const res = await fetch('/api/r2/status');
      if (res.ok) {
        const data = await res.json();
        setR2Info(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingR2(false);
    }
  };

  useEffect(() => {
    fetchR2Status();
  }, []);

  // Razorpay Gateway State
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [rzpStatus, setRzpStatus] = useState<any>(null);
  const [isSavingRzp, setIsSavingRzp] = useState(false);
  const [rzpNotice, setRzpNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRzpStatus = async () => {
    try {
      const res = await fetch('/api/admin/razorpay-status');
      const data = await res.json();
      setRzpStatus(data);
      if (data.rawKeyId) {
        setRzpKeyId(data.rawKeyId);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rzpKeyId.trim() || !rzpKeySecret.trim()) {
      alert('Please provide both Razorpay Key ID and Key Secret.');
      return;
    }
    setIsSavingRzp(true);
    setRzpNotice(null);
    try {
      const res = await fetch('/api/admin/razorpay-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: rzpKeyId,
          keySecret: rzpKeySecret,
          webhookSecret: rzpWebhookSecret,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRzpNotice({
          type: 'success',
          message: data.message || 'Razorpay credentials saved successfully!',
        });
        fetchRzpStatus();
      } else {
        setRzpNotice({
          type: 'error',
          message: data.error || 'Failed to save Razorpay keys.',
        });
      }
    } catch (err: any) {
      setRzpNotice({ type: 'error', message: err.message });
    } finally {
      setIsSavingRzp(false);
    }
  };

  // Supabase Database Connection State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbNotice, setDbNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fetchDbStatus = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/admin/supabase-status');
      const data = await res.json();
      setDbStatus(data);
      if (data.url && data.url.startsWith('https://')) {
        setSupabaseUrl(data.url);
      }
    } catch (err: any) {
      setDbStatus({ success: false, status: 'error', message: err.message });
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      alert('Please provide both Supabase Project URL and Anon Key.');
      return;
    }
    setIsSavingDb(true);
    setDbNotice(null);
    try {
      const res = await fetch('/api/admin/supabase-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl,
          anonKey,
          serviceRoleKey: serviceKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDbNotice({
          type: 'success',
          message: 'Supabase configuration saved and tested successfully! The platform is connected to Supabase.',
        });
        setDbStatus(data.testResult);
      } else {
        setDbNotice({
          type: 'error',
          message: data.error || 'Failed to save configuration.',
        });
      }
    } catch (err: any) {
      setDbNotice({ type: 'error', message: err.message });
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      updateSettings(formData);
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }, 400);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all site settings to default factory values?')) {
      resetToDefaults();
      setFormData({ ...settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Global CMS Controls</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Academy Branding & Contact Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Edit your academy name, mobile numbers, address, announcement bar, and marketing headlines. All edits reflect live instantly across the entire platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Site settings updated successfully! All public pages, headers, and footers are now updated.</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Saved</span>
        </div>
      )}

      {/* Live Brand Preview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs text-sky-300">
          <span className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Live Header & Branding Preview
          </span>
          <span className="text-[11px] text-slate-400">Updates as you edit</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xl shadow-md text-white">
              {formData.academy_name ? formData.academy_name.charAt(0) : 'A'}
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-tight uppercase">
                {formData.academy_name || 'Academy Name'}
              </h3>
              <p className="text-xs text-sky-300 tracking-wide">
                {formData.tagline || 'Tagline'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Phone</span>
              <span className="font-semibold text-white">{formData.phone}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Lead Faculty</span>
              <span className="font-semibold text-white">{formData.lead_faculty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form with Tabs */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'branding'
                ? 'bg-[#046BD2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Academy & Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'contact'
                ? 'bg-[#046BD2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Phone, WhatsApp & Address</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'banner'
                ? 'bg-[#046BD2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Top Announcement Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'stats'
                ? 'bg-[#046BD2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Trust Counters & Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('razorpay')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'razorpay'
                ? 'bg-[#046BD2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Razorpay Payments</span>
            {rzpStatus?.isLive && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-white ml-1">
                LIVE
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase PostgreSQL</span>
            {dbStatus?.success && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'cloudflare'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-300" />
            <span>Cloudflare R2 Storage</span>
            {r2Info?.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>Neuron AI Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        {/* Tab 1: Academy & Branding */}
        {activeTab === 'branding' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Academy Identity & Mission
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Academy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.academy_name}
                  onChange={(e) =>
                    setFormData({ ...formData, academy_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Tagline / Sub-title
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Director / Lead Faculty Name
                </label>
                <input
                  type="text"
                  value={formData.lead_faculty}
                  onChange={(e) =>
                    setFormData({ ...formData, lead_faculty: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Homepage Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.hero_headline}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_headline: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Academy Short Description / Bio
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2] leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                This description is displayed in the Homepage Hero, Footer bio, and About Us introduction.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Contact & Location */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Official Contact Numbers & Campus Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#046BD2]" />
                  <span>Primary Calling Phone Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official WhatsApp Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Official Admissions Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Counseling / Office Working Hours</span>
                </label>
                <input
                  type="text"
                  value={formData.office_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, office_hours: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Physical Campus / Center Address</span>
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
              />
              <p className="text-[11px] text-slate-400">
                This full address is displayed in the Contact page, Footer, and student invoices.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Announcement Bar */}
        {activeTab === 'banner' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Top Announcement Ticker
            </h2>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="announcement_active"
                checked={formData.announcement_active}
                onChange={(e) =>
                  setFormData({ ...formData, announcement_active: e.target.checked })
                }
                className="w-5 h-5 rounded text-[#046BD2] focus:ring-[#046BD2]"
              />
              <label htmlFor="announcement_active" className="text-sm font-bold text-slate-800 cursor-pointer">
                Enable Top Announcement Bar on All Pages
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Badge Tag Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Batch 2026-27"
                  value={formData.announcement_tag}
                  onChange={(e) =>
                    setFormData({ ...formData, announcement_tag: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Announcement Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 12 Bihar Board & NEET Foundation Admissions Open!"
                  value={formData.announcement_text}
                  onChange={(e) =>
                    setFormData({ ...formData, announcement_text: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Trust Counters & Stats */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Homepage Credibility & Trust Numbers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-[#046BD2] block">
                  Students Mentored Stat
                </span>
                <input
                  type="text"
                  value={formData.stat_students}
                  onChange={(e) =>
                    setFormData({ ...formData, stat_students: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-base font-black text-slate-900 bg-white focus:outline-none focus:border-[#046BD2]"
                />
                <span className="text-[10px] text-slate-500">e.g. 500+ or 1,000+</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <span className="text-xs font-bold text-amber-700 block">
                  Faculty Experience Stat
                </span>
                <input
                  type="text"
                  value={formData.stat_experience}
                  onChange={(e) =>
                    setFormData({ ...formData, stat_experience: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-base font-black text-slate-900 bg-white focus:outline-none focus:border-amber-500]"
                />
                <span className="text-[10px] text-slate-500">e.g. 10+ Yrs or 15+ Yrs</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <span className="text-xs font-bold text-emerald-700 block">
                  NCERT / Success Stat
                </span>
                <input
                  type="text"
                  value={formData.stat_success}
                  onChange={(e) =>
                    setFormData({ ...formData, stat_success: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-base font-black text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500">e.g. 100% NCERT or 98.4%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Supabase Database Configuration */}
        {activeTab === 'supabase' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Supabase PostgreSQL Cloud Database</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect your live Supabase project. When connected, all courses, lectures, enrollments, and settings sync securely to your PostgreSQL cloud database.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchDbStatus}
                disabled={isTestingDb}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition shadow-sm self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                <span>Test Connection Ping</span>
              </button>
            </div>

            {/* Live Connection Diagnostic Status */}
            <div
              className={`p-5 rounded-2xl border-2 transition ${
                dbStatus?.success
                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {dbStatus?.success ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Connected to Supabase PostgreSQL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Local In-Memory Mode (Keys Required for Cloud Sync)
                      </span>
                    )}
                    {dbStatus?.latencyMs && (
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Latency: {dbStatus.latencyMs}ms
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold leading-relaxed">
                    {dbStatus?.message || 'Checking Supabase connection status...'}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-medium">Project URL:</span>
                      <code className="font-mono font-bold">{dbStatus?.url || 'Not set'}</code>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Anon Key:</span>
                      <span className="font-bold">
                        {dbStatus?.hasAnonKey ? '✓ Present' : '✕ Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Verified Tables:</span>
                      <span className="font-bold">
                        {dbStatus?.tablesVerified?.length > 0
                          ? dbStatus.tablesVerified.join(', ')
                          : 'None (Local DB active)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {dbNotice && (
              <div
                className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  dbNotice.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                <span>{dbNotice.message}</span>
              </div>
            )}

            {/* Supabase Credentials Input Form */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Enter Supabase API Keys (Supabase Dashboard ➔ Project Settings ➔ API)
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Supabase Project URL (NEXT_PUBLIC_SUPABASE_URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Supabase Anon Public API Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional (Strictly Backend)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Optional)"
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSupabase}
                disabled={isSavingDb}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition disabled:bg-slate-300"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDb ? 'Testing & Saving...' : 'Save & Connect to Supabase'}</span>
              </button>
            </div>

            {/* Quick SQL Schema Setup Guide */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Database Schema & Migration Setup
                </span>
                <span className="text-[10px] text-slate-400">supabase/migrations/20261025000000_init_schema.sql</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Supabase project me tables create karne ke liye:
                <br />
                1. Apne Supabase Dashboard me jaakar <strong>SQL Editor</strong> open karein.
                <br />
                2. Project ke <code>supabase/migrations/20261025000000_init_schema.sql</code> aur <code>supabase/seed.sql</code> ka code wahan paste karein.
                <br />
                3. <strong>Run (Ctrl+Enter)</strong> dabayein. Saare 15 tables, RLS security policies, aur sample data 5 second me ready ho jayenge!
              </p>
            </div>
          </div>
        )}

        {/* Tab 6: Razorpay Payment Gateway */}
        {activeTab === 'razorpay' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Razorpay UPI & Cards Payment Gateway
                </h2>
                <p className="text-xs text-slate-500">
                  Shekhar Sir / Aspire Academy merchant credentials setup so all student course payments deposit directly into your bank account.
                </p>
              </div>

              {rzpStatus && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      rzpStatus.isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rzpStatus.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {rzpStatus.isLive ? 'Active LIVE Mode' : 'Sandbox Test Mode'}
                  </span>
                </div>
              )}
            </div>

            {rzpNotice && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                  rzpNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{rzpNotice.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Razorpay Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="rzp_live_xxxxxxxxxxxx (or rzp_test_xxxxxxxxxxxx)"
                  value={rzpKeyId}
                  onChange={(e) => setRzpKeyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
                <span className="text-[11px] text-slate-400 block">
                  Live payments ke liye yeh <code>rzp_live_</code> se start hota hai.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Razorpay Key Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Paste your 24+ character Key Secret here"
                  value={rzpKeySecret}
                  onChange={(e) => setRzpKeySecret(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="aspire_webhook_secret_..."
                  value={rzpWebhookSecret}
                  onChange={(e) => setRzpWebhookSecret(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveRazorpay}
                disabled={isSavingRzp}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-black text-xs shadow-md transition disabled:bg-slate-300"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingRzp ? 'Saving...' : 'Save Razorpay Credentials'}</span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Razorpay Live Key kaise nikalein (2 Minutes):
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                <li>
                  Apna <strong>Razorpay Dashboard</strong> open karein:{' '}
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#046BD2] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>dashboard.razorpay.com/app/keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Dashboard me top-right switch se <strong>Live Mode</strong> select karein.
                </li>
                <li>
                  <strong>Settings ➔ API Keys</strong> par jaakar <strong>Generate Key</strong> par click karein.
                </li>
                <li>
                  Wahan se <code>Key ID</code> aur <code>Key Secret</code> copy karke upar ke box me paste karein aur <strong>Save Razorpay Credentials</strong> button daba dein!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 7: Cloudflare R2 Storage */}
        {activeTab === 'cloudflare' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <h2 className="text-base font-bold text-slate-900">
                    Cloudflare R2 Object Storage
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Zero-egress private cloud storage for high-definition course videos, lesson attachments, and course thumbnails.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchR2Status}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingR2 ? 'animate-spin' : ''}`} />
                  <span>Check Connectivity</span>
                </button>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                r2Info?.isConfigured
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}
            >
              {r2Info?.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider">
                  {r2Info?.isConfigured
                    ? 'Cloudflare R2 Bucket Connected & Ready'
                    : 'Cloudflare R2 Credentials Pending in Environment'}
                </h4>
                <p className="text-xs leading-relaxed">
                  {r2Info?.isConfigured
                    ? `Bucket "${r2Info.bucketName || 'aspire-academy-media'}" is configured. Video lectures uploaded to R2 are automatically protected with short-lived presigned URLs and only unlocked for actively enrolled students.`
                    : `Direct video and thumbnail uploads require setting your Cloudflare R2 S3-compatible credentials in your environment (.env.local or Cloudflare Pages Dashboard). Missing: ${r2Info?.missing?.join(', ') || 'environment variables'}.`}
                </p>
              </div>
            </div>

            {/* Required Environment Variables Reference */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Required Environment Configuration Keys
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-mono font-bold text-slate-800 block">R2_ACCOUNT_ID</span>
                  <p className="text-[11px] text-slate-500">
                    Your Cloudflare Account ID from the Cloudflare Dashboard URL or Overview page.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-mono font-bold text-slate-800 block">R2_ACCESS_KEY_ID</span>
                  <p className="text-[11px] text-slate-500">
                    S3 API token Access Key ID generated under R2 &gt; Manage R2 API Tokens.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-mono font-bold text-slate-800 block">R2_SECRET_ACCESS_KEY</span>
                  <p className="text-[11px] text-slate-500">
                    Secret Access Key for the R2 token (remains strictly server-side).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-mono font-bold text-slate-800 block">R2_BUCKET_NAME</span>
                  <p className="text-[11px] text-slate-500">
                    Name of your private R2 bucket (e.g. <code>aspire-academy-media</code>).
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                How to set up Free Cloudflare R2 Storage (10 GB Free Every Month):
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  Go to <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-[#046BD2] underline font-bold">Cloudflare Dashboard</a> and click on <strong>R2</strong> in the left sidebar.
                </li>
                <li>
                  Click <strong>Create bucket</strong>, name it <code>aspire-academy-media</code>, and keep the location as <em>Automatic</em>.
                </li>
                <li>
                  Click <strong>Manage R2 API Tokens</strong> &gt; <strong>Create API token</strong> with <em>Object Read & Write</em> permissions.
                </li>
                <li>
                  Copy the Access Key ID and Secret Access Key into your deployment settings or <code>.env.local</code>.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 8: Neuron AI Assistant & Provider Config */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Neuron AI • Intelligence Engine & Provider Setup
                  </h2>
                  <p className="text-xs text-slate-500">
                    Connect Google Gemini Free Tier, Groq LPU, or use the built-in NCERT Knowledge Engine.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Neuron AI Active</span>
              </div>
            </div>

            {/* Provider 1: Google Gemini (Free Tier) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Google Gemini 1.5 Flash (Recommended • 100% Free Forever)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Google gives <strong>1,500 questions/day</strong> and <strong>60 queries/min</strong> completely free. Zero credit card needed. Responds in ~1 second with full Hindi, Hinglish, formulas, and NCERT diagrams.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={formData.gemini_api_key || ''}
                  onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-mono"
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">
                    Keys are stored securely and used by your students to solve doubts.
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#046BD2] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Get Free Gemini Key (Takes 10 sec)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Provider 2: Groq Cloud (Free LPU) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Groq Cloud API Key (Optional • 300+ Tokens/Sec LPU)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fastest open-source inference running Llama 3.3 70B.
                  </p>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#046BD2] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>Get Groq Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                placeholder="gsk_..."
                value={formData.groq_api_key || ''}
                onChange={(e) => setFormData({ ...formData, groq_api_key: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-mono"
              />
            </div>

            {/* Live Interactive Doubt Test */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-600" />
                    <span>Live Doubt Solver Test</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test how Neuron AI answers a real question right now.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="e.g. Janan kise kahte hai"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleTestAi}
                  disabled={testingAi}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:bg-slate-300 whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingAi ? 'animate-spin' : ''}`} />
                  <span>{testingAi ? 'Testing AI...' : 'Test Neuron AI'}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-700">Response Output:</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Provider: {testProvider}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">
                    {testResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        {activeTab !== 'supabase' && activeTab !== 'razorpay' && activeTab !== 'cloudflare' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset to Factory Defaults</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-sm shadow-md transition disabled:bg-slate-300"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving changes...' : 'Save All Changes'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
