import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are "Neuron AI", the official intelligent AI Academic Assistant and Doubt Solver for Aspire Academy (founded by Shekhar Sir).
You specialize in helping students preparing for Bihar Board (Class 10 & 12), CBSE, and NEET Foundation in Biology, Physics, Chemistry, and Mathematics.

Key Persona & Guidelines:
1. Tone: Friendly, encouraging, polite, respectful, and crystal clear.
2. Language: Match the student's language naturally. Use natural Hindi / Hinglish (e.g. "नमस्ते! मैं Neuron AI हूँ, Aspire Academy का AI Assistant..."), or pure English if asked in English.
3. Conversational Queries: When greeted (e.g. "hello", "hi", "kaise ho", "namaste"), greet back warmly and ask which chapter or topic they want to discuss today.
4. Mathematical & Scientific Equations: ALWAYS use clean LaTeX syntax:
   - Use single dollar signs $...$ for inline formulas (e.g. $F = ma$, $E = mc^2$, $H_2O$).
   - Use double dollar signs $$...$$ on their own line for block/display equations (e.g. $$\\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$$).
5. Explanations: Give structured, step-by-step answers with bullet points and bold headers for easy reading.
6. Mentorship: When discussing complex board numericals, remind the student that they can also submit questions to Shekhar Sir and senior faculty via the Doubt Desk.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 1. Google Gemini API (Free tier: Gemini 1.5 Flash / 2.0 Flash)
async function callGemini(messages: ChatMessage[], apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const formattedContents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        return text.trim();
      }
    }
  } catch {
    clearTimeout(timeout);
  }
  return null;
}

// 2. Groq Free API
async function callGroq(messages: ChatMessage[], apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();
    }
  } catch {
    clearTimeout(timeout);
  }
  return null;
}

// 3. Pollinations Free AI (100% Free, Zero configuration required)
async function callPollinations(messages: ChatMessage[]): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        model: 'openai-fast',
        seed: Math.floor(Math.random() * 1000000),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (
        text &&
        !text.includes('Free limit reached') &&
        !text.includes('"error"') &&
        text.trim().length > 0
      ) {
        return text.trim();
      }
    }
  } catch {
    clearTimeout(timeout);
  }
  return null;
}

// 4. Intelligent Academic & Conversational Fallback
function getSmartFallback(query: string): string {
  const q = query.trim().toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|namaste|pranam|good\s*(morning|evening|afternoon)|hola)/i.test(q)) {
    return `नमस्ते! 👋 मैं **Neuron AI** हूँ — Aspire Academy का AI Study & Doubt Solver Assistant।\n\nआप कैसे हैं? आज आप Physics, Chemistry, Biology या Math का कौन सा topic समझना चाहते हैं? कोई भी सवाल या सूत्र पूछें, मैं विस्तार से समझाऊंगा!`;
  }

  // Identity
  if (/kaun\s*ho|who\s*are\s*you|naam\s*kya\s*hai|what\s*is\s*your\s*name/i.test(q)) {
    return `मैं **Neuron AI** हूँ — Aspire Academy (शेखर सर) का समर्पित AI Academic Assistant! 🎓\n\nमेरा काम Bihar Board (Class 10th & 12th), CBSE और NEET के विद्यार्थियों को कठिन से कठिन कॉन्सेप्ट्स, NCERT फॉर्मूला और थ्योरी सरल भाषा में समझाना है।`;
  }

  // Science topics
  if (q.includes('coulomb') || q.includes('कूलॉम')) {
    return `**कूलॉम का नियम (Coulomb's Law of Electrostatics):**\n\nनिर्वात में दो स्थिर बिंदु आवेशों $q_1$ एवं $q_2$ के बीच लगने वाला आकर्षण या प्रतिकर्षण बल:\n\n$$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$$\n\n- $\\varepsilon_0$ = निर्वात की विद्युतशीलता ($8.854 \\times 10^{-12} \\text{ C}^2/\\text{N}\\cdot\\text{m}^2$)\n- $\\frac{1}{4\\pi\\varepsilon_0} \\approx 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$\n- $r$ = दोनों आवेशों के बीच की दूरी (मीटर में)\n\n**महत्वपूर्ण निष्कर्ष**: बल दोनों आवेशों के गुणनफल के समानुपाती ($F \\propto q_1 q_2$) तथा उनके बीच की दूरी के वर्ग के व्युत्क्रमानुपाती ($F \\propto \\frac{1}{r^2}$) होता है।`;
  }

  if (q.includes('mendel') || q.includes('dihybrid') || q.includes('द्विसंकर')) {
    return `**मेंडल के द्विसंकर संकरण (Dihybrid Cross) का सिद्धांत:**\n\nजब दो जोड़ी विपरीत लक्षणों (जैसे पीले/गोल और हरे/झुर्रीदार बीज) वाले पौधों में क्रॉस कराया जाता है, तो $F_2$ पीढ़ी में लक्षणप्ररूपी अनुपात (Phenotypic Ratio) प्राप्त होता है:\n\n$$9 : 3 : 3 : 1$$\n\n- **9**: गोल एवं पीले (दोनों प्रभावी लक्षण)\n- **3**: गोल एवं हरे (एक प्रभावी, एक अप्रभावी)\n- **3**: झुर्रीदार एवं पीले (एक अप्रभावी, एक प्रभावी)\n- **1**: झुर्रीदार एवं हरे (दोनों अप्रभावी लक्षण)\n\nयह **स्वतंत्र अपव्यूहन के नियम (Law of Independent Assortment)** की पुष्टि करता है।`;
  }

  if (q.includes('hardy') || q.includes('हार्ड-वेनबर्ग')) {
    return `**हार्ड-वेनबर्ग साम्यावस्था (Hardy-Weinberg Principle):**\n\nएक आदर्श विशाल समष्टि में युग्मविकल्पी (Allele) आवृत्तियाँ पीढ़ी-दर-पीढ़ी स्थिर रहती हैं।\n\n$$p^2 + 2pq + q^2 = 1$$\n\nजहाँ:\n- $p$ = प्रभावी युग्मविकल्पी की आवृत्ति (Dominant allele frequency)\n- $q$ = अप्रभावी युग्मविकल्पी की आवृत्ति (Recessive allele frequency)\n- $p^2$ = समयुग्मजी प्रभावी ($AA$)\n- $2pq$ = विषमयुग्मजी ($Aa$)\n- $q^2$ = समयुग्मजी अप्रभावी ($aa$)\n\nसाथ ही, $p + q = 1$ होता है।`;
  }

  if (q.includes('ohm') || q.includes('ओम')) {
    return `**ओम का नियम (Ohm's Law):**\n\nयदि किसी चालक की भौतिक अवस्थाएँ (जैसे ताप, लंबाई) अपरिवर्तित रहें, तो उसके सिरों पर लगाया गया विभवांतर उसमें प्रवाहित धारा के समानुपाती होता है:\n\n$$V = I \\times R$$\n\n- $V$ = विभवांतर (Volts)\n- $I$ = विद्युत धारा (Amperes)\n- $R$ = चालक का प्रतिरोध (Ohms, $\\Omega$)\n\nप्रतिरोध का सूत्र: $$R = \\rho \\frac{L}{A}$$ (जहाँ $\\rho$ विशिष्ट प्रतिरोध है)।`;
  }

  return `नमस्ते! आपके प्रश्न का उत्तर:\n\n"${query}"\n\nयह संकल्पना Bihar Board एवं CBSE बोर्ड परीक्षाओं के दृष्टिकोण से अत्यंत महत्वपूर्ण है।\n\n- **मुख्य बिंदु**: इस विषय से संबंधित NCERT थ्योरी, मुख्य समीकरण एवं परिभाषाओं को ध्यान से पढ़ें।\n- यदि आपको इस विषय पर विस्तृत हस्तलिखित नोट्स या व्यक्तिगत फैकल्टी समाधान चाहिए, तो आप **"Ask Shekhar Sir Directly"** पर क्लिक करके सीधे फैकल्टी से भी मार्गदर्शन प्राप्त कर सकते हैं!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : body.query
      ? [{ role: 'user', content: String(body.query) }]
      : [];

    if (rawMessages.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a message or query.' },
        { status: 400 }
      );
    }

    const lastUserMessage = [...rawMessages].reverse().find((m) => m.role === 'user')?.content || '';

    // 1. Check Gemini API
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    if (geminiKey) {
      const geminiReply = await callGemini(rawMessages, geminiKey);
      if (geminiReply) {
        return NextResponse.json({
          success: true,
          reply: geminiReply,
          provider: 'google-gemini',
        });
      }
    }

    // 2. Check Groq API
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqReply = await callGroq(rawMessages, groqKey);
      if (groqReply) {
        return NextResponse.json({
          success: true,
          reply: groqReply,
          provider: 'groq',
        });
      }
    }

    // 3. Check Pollinations Free AI (100% Free, No key needed)
    const pollinationsReply = await callPollinations(rawMessages);
    if (pollinationsReply) {
      return NextResponse.json({
        success: true,
        reply: pollinationsReply,
        provider: 'pollinations-free-ai',
      });
    }

    // 4. Smart Academic Fallback
    const fallbackReply = getSmartFallback(lastUserMessage);
    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      provider: 'neuron-academic-engine',
    });
  } catch (err: any) {
    console.error('Neuron AI API error:', err);
    return NextResponse.json(
      {
        success: true,
        reply: 'नमस्ते! मैं Neuron AI हूँ। आप मुझसे Biology, Physics, Chemistry या Math के प्रश्न पूछ सकते हैं। कृपया अपना प्रश्न दोबारा टाइप करें!',
        provider: 'fallback',
      },
      { status: 200 }
    );
  }
}

