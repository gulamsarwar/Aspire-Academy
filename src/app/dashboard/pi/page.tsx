'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  Brain,
  Sparkles,
  Send,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'neuron';
  text: string;
  timestamp: string;
  provider?: string;
}

const FAQ_PROMPTS = [
  {
    title: 'Janan (Reproduction)',
    query: 'जनन किसे कहते हैं? इसके प्रकार (अलैंगिक एवं लैंगिक जनन) उदाहरण सहित समझाइए।',
    subject: 'Biology',
  },
  {
    title: 'Mendel 9:3:3:1 Ratio',
    query: 'द्विसंकर संकरण (Dihybrid Cross) का 9:3:3:1 लक्षणप्ररूपी अनुपात क्या है और कैसे आता है?',
    subject: 'Biology',
  },
  {
    title: 'Coulomb Law Formula',
    query: 'कूलॉम बल का गणितीय सूत्र $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$ और इसका मात्रक बताइए।',
    subject: 'Physics',
  },
  {
    title: 'Ohm Law & Resistance',
    query: 'ओम का नियम $V = IR$ और प्रतिरोधकता का सूत्र समझाइए।',
    subject: 'Physics',
  },
  {
    title: 'Photosynthesis Reaction',
    query: 'प्रकाश संश्लेषण का संतुलित रासायनिक समीकरण $6CO_2 + 12H_2O \\to C_6H_{12}O_6 + 6O_2 + 6H_2O$ समझाइए।',
    subject: 'Biology',
  },
  {
    title: 'DNA Double Helix',
    query: 'B-DNA की पिच $3.4\\text{ nm}$ और 10 बेस पेयर प्रति घुमाव का क्या महत्व है?',
    subject: 'Biology',
  },
];

export default function NeuronAIAssistantPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome',
    sender: 'neuron',
    text: `नमस्ते ${user ? user.full_name : 'विद्यार्थी'}! मैं **Neuron AI** हूँ — Aspire Academy का AI Study & Doubt Solver Assistant।\n\nआप मुझसे Biology, Physics, Chemistry या Mathematics का कोई भी प्रश्न या कॉन्सेप्ट पूछ सकते हैं। मैं KaTeX गणितीय सूत्रों ($x^2, \\frac{a}{b}, \\sqrt{x}$) के साथ समझाता हूँ!`,
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Do you want to clear this chat history?')) {
      setMessages([initialGreeting]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    try {
      // Send conversation history to Neuron AI backend
      const history = updatedMessages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const res = await fetch('/api/neuron/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          query,
          geminiApiKey: settings.gemini_api_key,
          groqApiKey: settings.groq_api_key,
        }),
      });

      const data = await res.json().catch(() => null);
      const replyText =
        data?.reply ||
        'नमस्ते! मैं Neuron AI हूँ। आपका प्रश्न प्राप्त हुआ। कृपया अपना प्रश्न थोड़ा और विस्तार से पूछें!';

      const botMsg: ChatMessage = {
        id: `neuron_${Date.now()}`,
        sender: 'neuron',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        provider: data?.provider,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Neuron AI request error:', err);
      const fallbackMsg: ChatMessage = {
        id: `neuron_${Date.now()}`,
        sender: 'neuron',
        text: `नमस्ते! मैं **Neuron AI** हूँ। आपका प्रश्न:\n\n"${query}"\n\nयदि उत्तर लोड होने में कोई रुकावट आए, तो आप सीधे **"Faculty Doubts Desk"** पर शेखर सर से भी पूछ सकते हैं!`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#046BD2] to-[#1E3E62] text-white shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#046BD2] via-indigo-600 to-[#0B192C] text-cyan-300 flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0">
              <Brain className="w-7 h-7 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Neuron AI • Aspire Study Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Neuron AI • Instant Doubt & Formula Solver
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Clear Chat History"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Clear</span>
            </button>

            <Link
              href="/dashboard/doubts"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#046BD2] text-xs font-bold hover:bg-sky-50 transition shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Faculty Desk</span>
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
          Ask Biology, Physics, Chemistry, and Mathematics questions in Hindi, Hinglish, or English.
          Get instant conceptual explanations with accurate LaTeX &amp; KaTeX formulas.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Popular Bihar Board &amp; NEET Topics:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {FAQ_PROMPTS.map((faq, i) => (
            <button
              key={i}
              onClick={() => handleSend(faq.query)}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#046BD2] text-left transition shadow-sm hover:shadow group"
            >
              <span className="text-[10px] font-bold text-[#046BD2] block">{faq.subject}</span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#046BD2] transition">
                {faq.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[420px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
          {messages.map((m) => {
            const isNeuron = m.sender === 'neuron';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isNeuron ? 'justify-start' : 'justify-end'}`}
              >
                {isNeuron && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#046BD2] to-indigo-700 text-cyan-200 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-400/30">
                    <Brain className="w-4 h-4 text-cyan-200" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm relative group ${isNeuron
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-sm'
                      : 'bg-[#046BD2] text-white rounded-tr-sm'
                    }`}
                >
                  {isNeuron && (
                    <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-200/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#046BD2] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        <span>Neuron AI</span>
                      </span>

                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        title="Copy solution"
                        className="text-slate-400 hover:text-slate-700 text-[10px] flex items-center gap-1 transition"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <MathRenderer content={m.text} />

                  <span
                    className={`block text-[10px] mt-2 text-right ${isNeuron ? 'text-slate-400' : 'text-blue-200'
                      }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#046BD2] to-indigo-700 text-cyan-200 flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-cyan-200 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#046BD2] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                <span className="font-semibold text-slate-700">Neuron AI is formulating the solution...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type your question or formula (e.g. Mendel law, Coulomb force, or say Hello)..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#046BD2] bg-slate-50/50 shadow-inner"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isTyping}
            className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#046BD2] to-indigo-600 hover:from-[#0352A0] hover:to-indigo-700 text-white text-xs font-bold transition shadow-md disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Neuron AI</span>
          </button>
        </div>
      </div>

      {/* Escalation to Shekhar Sir Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
            S
          </div>
          <div>
            <span className="font-bold text-indigo-950 block">Need Personalized Faculty Mentoring?</span>
            <span className="text-slate-600">
              Submit complex board numericals and subjective queries directly to {settings.lead_faculty || 'Shekhar Sir'}.
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/doubts"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
        >
          <span>Open Doubt Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
