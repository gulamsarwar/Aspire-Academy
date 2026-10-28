'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  BookOpen,
  ArrowRight,
  MessageCircle,
  Lightbulb,
  CheckCircle2,
  Share2,
  RefreshCw,
  Search,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'pi';
  text: string;
  timestamp: string;
  topic?: string;
}

const FAQ_PROMPTS = [
  {
    title: 'Mendel 9:3:3:1 Ratio',
    query: 'द्विसंकर संकरण (Dihybrid Cross) का 9:3:3:1 लक्षणप्ररूपी अनुपात क्या है और कैसे आता है?',
    subject: 'Biology',
  },
  {
    title: 'Hardy-Weinberg Equation',
    query: 'हार्ड-वेनबर्ग साम्यावस्था का समीकरण $p^2 + 2pq + q^2 = 1$ समझाइए।',
    subject: 'Biology',
  },
  {
    title: 'Coulomb Law Formula',
    query: 'कूलॉम बल का गणितीय सूत्र $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$ और इसका मात्रक बताइए।',
    subject: 'Physics',
  },
  {
    title: 'DNA Double Helix Pitch',
    query: 'B-DNA की पिच $3.4\\text{ nm}$ और 10 बेस पेयर प्रति घुमाव का क्या महत्व है?',
    subject: 'Biology',
  },
];

export default function PiAssistantPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'pi',
      text: `नमस्ते ${user ? user.full_name : 'विद्यार्थी'}! मैं **Pi** हूँ — Aspire Academy का AI Study & Doubt Solver Assistant।\n\nआप मुझसे Biology, Physics, Chemistry या Math के प्रश्न पूछ सकते हैं। मैं Hindi और English दोनों में KaTeX गणितीय सूत्रों ($x^2, \\frac{a}{b}, \\sqrt{x}$) के साथ समझा सकता हूँ!`,
      timestamp: 'Just now',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Generate intelligent academic response with KaTeX math
    setTimeout(() => {
      let reply = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('mendel') || qLower.includes('dihybrid') || qLower.includes('द्विसंकर')) {
        reply = `**मेंडल के द्विसंकर संकरण (Dihybrid Cross) का सिद्धांत:**\n\nजब दो जोड़ी विपरीत लक्षणों (जैसे पीले/गोल और हरे/झुर्रीदार बीज) वाले पौधों में क्रॉस कराया जाता है, तो $F_2$ पीढ़ी में लक्षणप्ररूपी अनुपात (Phenotypic Ratio) प्राप्त होता है:\n\n$$9 : 3 : 3 : 1$$\n\n- **9**: गोल एवं पीले (दोनों प्रभावी)\n- **3**: गोल एवं हरे (एक प्रभावी, एक अप्रभावी)\n- **3**: झुर्रीदार एवं पीले (एक अप्रभावी, एक प्रभावी)\n- **1**: झुर्रीदार एवं हरे (दोनों अप्रभावी)\n\nयह **स्वतंत्र अपव्यूहन के नियम (Law of Independent Assortment)** की पुष्टि करता है।`;
      } else if (qLower.includes('hardy') || qLower.includes('हार्ड-वेनबर्ग') || qLower.includes('equilibrium')) {
        reply = `**हार्ड-वेनबर्ग साम्यावस्था (Hardy-Weinberg Equilibrium):**\n\nएक आदर्श विशाल समष्टि में युग्मविकल्पी (Allele) आवृत्तियाँ पीढ़ी-दर-पीढ़ी स्थिर रहती हैं। इसका द्विपद सूत्र है:\n\n$$p^2 + 2pq + q^2 = 1$$\n\nजहाँ:\n- $p$ = प्रभावी युग्मविकल्पी (Dominant allele frequency)\n- $q$ = अप्रभावी युग्मविकल्पी (Recessive allele frequency)\n- $p^2$ = समयुग्मजी प्रभावी ($AA$)\n- $2pq$ = विषमयुग्मजी ($Aa$)\n- $q^2$ = समयुग्मजी अप्रभावी ($aa$)\n\nयदि $p + q = 1$ है, तो इसका वर्ग करने पर $(p + q)^2 = 1$ सिद्ध होता है।`;
      } else if (qLower.includes('coulomb') || qLower.includes('कूलॉम') || qLower.includes('force')) {
        reply = `**कूलॉम का नियम (Coulomb's Law of Electrostatics):**\n\nनिर्वात में दो स्थिर बिंदु आवेशों $q_1$ और $q_2$ के बीच लगने वाला आकर्षण या प्रतिकर्षण बल:\n\n$$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$$\n\n- $\\varepsilon_0$ = निर्वात की विद्युतशीलता ($8.854 \\times 10^{-12} \\text{ C}^2/\\text{N}\\cdot\\text{m}^2$)\n- $\\frac{1}{4\\pi\\varepsilon_0} \\approx 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$\n- $r$ = दोनों आवेशों के बीच की दूरी\n\nबल दूरी के वर्ग के व्युत्क्रमानुपाती ($F \\propto \\frac{1}{r^2}$) होता है।`;
      } else if (qLower.includes('dna') || qLower.includes('pitch') || qLower.includes('watson')) {
        reply = `**B-DNA की द्विकुंडली संरचना (Watson & Crick Model, 1953):**\n\n1. प्रत्येक पूर्ण घुमाव (Pitch) की लंबाई **$3.4\\text{ nm}$ ($34\\text{ \\AA}$)** होती है।\n2. प्रत्येक घुमाव में **10 बेस पेयर्स ($10\\text{ bp}$)** उपस्थित होते हैं।\n3. दो निकटतम बेस पेयर्स के बीच की दूरी: $$\\frac{3.4\\text{ nm}}{10} = 0.34\\text{ nm} = 3.4\\text{ \\AA}$$\n4. DNA के रज्जुक प्रतिसमांतर (Antiparallel, $5' \\to 3'$ एवं $3' \\to 5'$) होते हैं।`;
      } else {
        reply = `आपके प्रश्न का विश्लेषण:\n\n"${query}"\n\nयह संकल्पना Bihar Board एवं CBSE Class 12th के लिए बहुत महत्वपूर्ण है।\n\n- **मुख्य बिंदु**: इस विषय से संबंधित मुख्य NCERT सारांश और महत्वपूर्ण सूत्र को याद रखें।\n- यदि आपको विस्तृत हस्तलिखित समाधान चाहिए, तो आप नीचे **"Ask ${settings.lead_faculty || 'Shekhar Sir'} Directly"** पर क्लिक करके सीधे फैकल्टी से भी मार्गदर्शन प्राप्त कर सकते हैं!`;
      }

      const botMsg: ChatMessage = {
        id: `pi_${Date.now()}`,
        sender: 'pi',
        text: reply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#046BD2] to-[#1E3E62] text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl text-amber-300 shadow-inner">
              π
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Aspire Pi AI Study Assistant</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">
                Ask Pi • Instant Doubt & Formula Solver
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard/doubts"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#046BD2] text-xs font-bold hover:bg-sky-50 transition shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Faculty Doubts Desk</span>
          </Link>
        </div>
        <p className="text-xs text-sky-100 max-w-xl">
          Biology, Physics, Chemistry aur Mathematics ke sawal Hindi ya English me puchein. KaTeX mathematical equations ke sath turant solution payein.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Frequent Bihar Board & NEET Questions:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1">
          {messages.map((m) => {
            const isPi = m.sender === 'pi';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isPi ? 'justify-start' : 'justify-end'}`}
              >
                {isPi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#046BD2] to-[#0B192C] text-amber-300 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                    π
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isPi
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-sm'
                      : 'bg-[#046BD2] text-white rounded-tr-sm'
                  }`}
                >
                  <MathRenderer content={m.text} />
                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      isPi ? 'text-slate-400' : 'text-blue-200'
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
              <div className="w-8 h-8 rounded-xl bg-[#046BD2] text-amber-300 font-bold text-sm flex items-center justify-center">
                π
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#046BD2] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#046BD2] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#046BD2] animate-bounce [animation-delay:0.4s]" />
                <span>Pi is formulating the answer...</span>
              </div>
            </div>
          )}
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
            placeholder="Type your question or formula (e.g. Mendel dihybrid cross or Coulomb law)..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#046BD2] bg-slate-50/50"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim()}
            className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-[#046BD2] hover:bg-[#0352A0] text-white text-xs font-bold transition shadow-sm disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Pi</span>
          </button>
        </div>
      </div>

      {/* Escalation to Shekhar Sir Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            S
          </div>
          <div>
            <span className="font-bold text-indigo-950 block">Need Personalized Faculty Mentoring?</span>
            <span className="text-slate-600">Submit complex board numericals directly to {settings.lead_faculty || 'Shekhar Sir'} and senior faculty.</span>
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
