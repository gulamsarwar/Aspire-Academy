'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetToDefaults } = useSiteSettings();

  const [formData, setFormData] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'banner' | 'stats'>('branding');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Academy Branding & Contact Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
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

        {/* Actions Bar */}
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
      </form>
    </div>
  );
}
