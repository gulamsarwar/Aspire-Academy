import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const formattedContents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Try Gemini 1.5 Flash first, then 2.0 Flash
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
          maxOutputTokens: 1500,
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

// 2. Groq Free API (Llama 3.3 70B)
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
        max_tokens: 1500,
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

// 3. OpenRouter Free Models
async function callOpenRouter(messages: ChatMessage[], apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aspireacademyonline.in',
        'X-Title': 'Aspire Academy Neuron AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
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

// 4. Pollinations Free AI with dynamic client IP to prevent 45s shared server IP lock
async function callPollinations(messages: ChatMessage[], clientIp?: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);

  const ip = clientIp || `103.${Math.floor(Math.random() * 200 + 20)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'Client-IP': ip,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are Neuron AI for Aspire Academy (Shekhar Sir). Answer student doubts in clear Hindi/Hinglish with LaTeX math formulas $...$.',
          },
          ...messages,
        ],
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
        text.trim().length > 30
      ) {
        return text.trim();
      }
    }
  } catch {
    clearTimeout(timeout);
  }
  return null;
}

// 5. Comprehensive NCERT & Bihar Board / CBSE Academic Knowledge Engine
function getSmartFallback(query: string): string {
  const q = query.trim().toLowerCase();

  // --- GREETINGS ---
  if (/^(hi|hello|hey|namaste|pranam|good\s*(morning|evening|afternoon)|hola)/i.test(q)) {
    return `नमस्ते! 👋 मैं **Neuron AI** हूँ — Aspire Academy का AI Study & Doubt Solver Assistant।\n\nआप कैसे हैं? आज आप Physics, Chemistry, Biology या Mathematics का कौन सा विषय समझना चाहते हैं? कोई भी प्रश्न या सूत्र पूछें, मैं तुरंत विस्तार से समझाऊंगा!`;
  }

  // --- IDENTITY ---
  if (/kaun\s*ho|who\s*are\s*you|naam\s*kya\s*hai|what\s*is\s*your\s*name/i.test(q)) {
    return `मैं **Neuron AI** हूँ — Aspire Academy (शेखर सर) का समर्पित AI Academic Assistant! 🎓\n\nमेरा काम Bihar Board (Class 10th & 12th), CBSE और NEET के विद्यार्थियों को कठिन से कठिन कॉन्सेप्ट्स, NCERT फॉर्मूला और थ्योरी सरल हिंदी/हिंग्लिश में समझाना है।`;
  }

  // ==========================================
  // BIOLOGY CHAPTERS & CONCEPTS
  // ==========================================

  // 1. जनन (Reproduction)
  if (
    q.includes('janan') ||
    q.includes('जनन') ||
    q.includes('reproduction') ||
    q.includes('laingik') ||
    q.includes('लैंगिक') ||
    q.includes('alaingik') ||
    q.includes('अलैंगिक')
  ) {
    return `### 🧬 जनन (Reproduction) किसे कहते हैं?

**परिभाषा (NCERT Class 10th & 12th Biology):**
जनन वह जैविक प्रक्रम (Biological Process) है जिसके द्वारा कोई भी जीव अपने ही समान नए संतति (Offspring) जीव को उत्पन्न करता है।

**जनन का मुख्य उद्देश्य एवं महत्व:**
1. **प्रजाति की निरंतरता**: यह पृथ्वी पर किसी भी जीव प्रजाति के अस्तित्व को पीढ़ी-दर-पीढ़ी बनाए रखने के लिए अनिवार्य है।
2. **आनुवंशिक निरंतरता**: माता-पिता के आनुवंशिक लक्षण (DNA) संतानों में स्थानांतरित होते हैं।
3. **जैव विकास (Evolution)**: जनन के दौरान उत्पन्न होने वाली विभिन्नताएँ (Variations) नए लक्षणों के विकास में सहायक होती हैं।

---

### जनन के प्रकार (Types of Reproduction):
जीवों में जनन मुख्य रूप से **दो प्रकार** का होता है:

#### 1. अलैंगिक जनन (Asexual Reproduction)
- इसमें केवल **एक ही जनक (Single Parent)** भाग लेता है।
- इसमें युग्मक निर्माण (Gametogenesis) एवं निषेचन (Fertilization) नहीं होता।
- संतान आनुवंशिक व आकारिकी रूप से बिल्कुल जनक के समान होती है, जिसे **क्लोन (Clone)** कहते हैं।
- **प्रमुख विधियाँ**:
  - **द्विखंडन (Binary Fission)**: जैसे अमीबा, पैरामीशियम।
  - **मुकुलन (Budding)**: जैसे यीस्ट, हाइड्रा।
  - **बीजाणुजनन (Spore Formation)**: जैसे राइजोपस (फफूंद)।
  - **पुनरुद्भवन (Regeneration)**: जैसे प्लेनेरिया।
  - **कायिक प्रवर्धन (Vegetative Propagation)**: जैसे आलू की आँखें, ब्रायोफिल्लम की पत्तियाँ।

#### 2. लैंगिक जनन (Sexual Reproduction)
- इसमें **दो भिन्न जनक (नर एवं मादा)** भाग लेते हैं।
- नर युग्मक (शुक्राणु/Sperm) और मादा युग्मक (अंडाणु/Ovum) का निर्माण होता है।
- दोनों के संलयन (निषेचन/Fertilization) से **युग्मनज (Zygote)** बनता है।
- इसमें अर्धसूत्री विभाजन (Meiosis) होने के कारण नई विभिन्नताएँ (Variations) आती हैं।
- **उदाहरण**: मनुष्य, गाय, पक्षी, और पुष्पीय पौधे।

💡 *बोर्ड परीक्षा टिप*: बिहार बोर्ड एवं CBSE में प्रायः **"अलैंगिक एवं लैंगिक जनन में 4 प्रमुख अंतर"** 5 अंकों के दीर्घ उत्तरीय प्रश्न में पूछा जाता है!`;
  }

  // 2. प्रकाश संश्लेषण (Photosynthesis)
  if (
    q.includes('photosynthesis') ||
    q.includes('प्रकाश संश्लेषण') ||
    q.includes('prakash sanshleshan') ||
    q.includes('chlorophyll') ||
    q.includes('क्लोरोफिल')
  ) {
    return `### 🍃 प्रकाश संश्लेषण (Photosynthesis)

**परिभाषा:**
हरे पौधे सूर्य के प्रकाश तथा क्लोरोफिल की उपस्थिति में वायुमंडल से $CO_2$ और भूमि से जल ($H_2O$) ग्रहण करके भोजन (ग्लूकोज) का निर्माण करते हैं तथा ऑक्सीजन ($O_2$) मुक्त करते हैं। इस प्रक्रम को **प्रकाश संश्लेषण** कहते हैं।

**रासायनिक समीकरण (Chemical Equation):**
$$6CO_2 + 12H_2O \\xrightarrow[\\text{क्लोरोफिल}]{\\text{सूर्य का प्रकाश}} C_6H_{12}O_6 + 6O_2 + 6H_2O$$

**प्रकाश संश्लेषण के मुख्य चरण:**
1. **प्रकाश ऊर्जा का अवशोषण**: क्लोरोफिल द्वारा सौर ऊर्जा को अवशोषित करना।
2. **जल का प्रकाशीय अपघटन (Photolysis of Water)**: प्रकाश ऊर्जा द्वारा जल अणुओं का हाइड्रोजन एवं ऑक्सीजन में टूटना:
   $$2H_2O \\to 4H^+ + 4e^- + O_2$$
3. **कार्बन डाइऑक्साइड का अपचयन**: $CO_2$ का कार्बोहाइड्रेट (ग्लूकोज) में अपचयन होना।

💡 *महत्वपूर्ण बिंदु*: निकली हुई ऑक्सीजन ($O_2$) जल ($H_2O$) के टूटने से निकलती है, न कि कार्बन डाइऑक्साइड से।`;
  }

  // 3. कोशिका एवं कोशिकांग (Cell & Organelles)
  if (q.includes('koshika') || q.includes('कोशिका') || q.includes('cell') || q.includes('mitochondria')) {
    return `### 🔬 कोशिका (Cell) — जीवन की मौलिक इकाई

**परिभाषा:**
कोशिका सभी सजीवों की सबसे छोटी संरचनात्मक एवं कार्यात्मक इकाई (Structural & Functional Unit of Life) है।
- **खोज**: सर्वप्रथम 1665 ई. में **रॉबर्ट हुक** ने मृत कॉर्क में कोशिका देखी थी।
- **जीवित कोशिका**: 1674 ई. में **एंटोनी वॉन ल्यूवेनहॉक** ने जीवित कोशिका को देखा।

**प्रमुख कोशिकांग (Cell Organelles):**
1. **माइटोकॉन्ड्रिया (Mitochondria)**: इसे 'कोशिका का पावरहाउस' (Powerhouse of the Cell) कहते हैं, क्योंकि यहाँ $ATP$ के रूप में ऊर्जा बनती है।
2. **राइबोसोम (Ribosome)**: प्रोटीन संश्लेषण का केंद्र ('Protein Factory')।
3. **केंद्रक (Nucleus)**: कोशिका का नियंत्रण कक्ष ('Brain of the Cell'), जिसमें $DNA$ और गुणसूत्र पाए जाते हैं।
4. **लाइसोसोम (Lysosome)**: 'आत्मघाती थैली' (Suicide Bag), क्योंकि इसमें पाचक एंजाइम होते हैं।

**प्रोकैरियोटिक बनाम यूकैरियोटिक कोशिका:**
- **प्रोकैरियोटिक**: केंद्रक झिल्ली विहीन (जैसे जीवाणु)।
- **यूकैरियोटिक**: पूर्ण विकसित केंद्रक व झिल्लीयुक्त कोशिकांग (जैसे पादप एवं जंतु कोशिका)।`;
  }

  // 4. डीएनए, आरएनए एवं आनुवंशिकी (DNA, RNA & Genetics)
  if (
    q.includes('dna') ||
    q.includes('rna') ||
    q.includes('डीएनए') ||
    q.includes('genetics') ||
    q.includes('आनुवंशिक') ||
    q.includes('chromosome') ||
    q.includes('गुणसूत्र')
  ) {
    return `### 🧬 DNA (डीऑक्सीराइबोन्यूक्लिक अम्ल) की संरचना

**वाटसन एवं क्रिक का द्विकुंडलिनी मॉडल (Double Helix Model - 1953):**
1. DNA दो पॉलीपेप्टाइड/पॉलीन्यूक्लियोटाइड श्रृंखलाओं से मिलकर बना एक सर्पिलाकार द्विकुंडली होता है।
2. दोनों रज्जुक एक-दूसरे के **प्रति-समांतर (Anti-parallel)** होते हैं — एक $5' \\to 3'$ और दूसरा $3' \\to 5'$।
3. **नाइट्रोजनी क्षारक पूरकता (Base Pairing Rule)**:
   - एडेनिन ($A$) थाइमिन ($T$) के साथ दो हाइड्रोजन बंध ($A = T$) बनाता है।
   - ग्वानिन ($G$) साइटोसिन ($C$) के साथ तीन हाइड्रोजन बंध ($G \\equiv C$) बनाता है।
4. B-DNA की पिच (Pitch) $3.4\\text{ nm}$ होती है, जिसमें 10 बेस पेयर (bp) होते हैं। दो बेस पेयर के बीच की दूरी $0.34\\text{ nm}$ होती है।

**DNA बनाम RNA में अंतर:**
- DNA में डिऑक्सीराइबोज शर्करा और थाइमिन ($T$) होता है।
- RNA में राइबोज शर्करा और थाइमिन के स्थान पर यूरेसिल ($U$) होता है।`;
  }

  // 5. मेंडल के नियम (Mendel's Laws)
  if (q.includes('mendel') || q.includes('मेंडल') || q.includes('dihybrid') || q.includes('द्विसंकर')) {
    return `### 🌻 मेंडल के आनुवंशिकता के नियम (Mendel's Laws of Inheritance)

ग्रेगर जोहान मेंडल को **"आनुवंशिकी का जनक (Father of Genetics)"** कहा जाता है। उन्होंने मटर (*Pisum sativum*) के पौधे पर 7 जोड़ी विपरीत लक्षणों पर प्रयोग किए:

1. **प्रभाविता का नियम (Law of Dominance)**:
   जब दो परस्पर विरोधी लक्षणों वाले जनकों में संकरण कराया जाता है, तो $F_1$ पीढ़ी में केवल प्रभावी लक्षण (Dominant trait) ही प्रकट होता है।

2. **पृथक्करण का नियम (Law of Segregation / युग्मकों की शुद्धता का नियम)**:
   युग्मक निर्माण के समय दोनों एलील एक-दूसरे से स्वतंत्र होकर पृथक हो जाते हैं। $F_2$ पीढ़ी का फीनोटाइप अनुपात:
   $$3 : 1$$
   और जीनोटाइप अनुपात:
   $$1 : 2 : 1$$

3. **स्वतंत्र अपव्यूहन का नियम (Law of Independent Assortment)**:
   द्विसंकर संकरण (Dihybrid Cross) में दो जोड़ी विपरीत लक्षणों की वंशागति एक-दूसरे से पूर्णतः स्वतंत्र होती है। $F_2$ पीढ़ी का फीनोटाइप अनुपात:
   $$9 : 3 : 3 : 1$$`;
  }

  // 6. रक्त परिसंचरण एवं हृदय (Circulation & Heart)
  if (q.includes('hriday') || q.includes('heart') || q.includes('हृदय') || q.includes('blood') || q.includes('रक्त')) {
    return `### ❤️ मानव हृदय एवं रक्त परिसंचरण तंत्र

**हृदय की संरचना:**
मानव हृदय एक पेशीय अंग है जिसमें **4 कोष्ठक (Four Chambers)** होते हैं:
- ऊपर के दो कोष्ठक: **दायाँ अलिंद** एवं **बायाँ अलिंद** (Auricles)
- नीचे के दो कोष्ठक: **दायाँ निलय** एवं **बायाँ निलय** (Ventricles)

**दोहरा परिसंचरण (Double Circulation):**
मनुष्य के शरीर में रक्त को एक चक्र पूरा करने के लिए हृदय से **दो बार** गुजरना पड़ता है:
1. **पल्मोनरी परिसंचरण (Pulmonary Circulation)**: दायाँ निलय अशुद्ध रक्त को फेफड़ों में ऑक्सीजनित होने के लिए भेजता है।
2. **सिस्टेमिक परिसंचरण (Systemic Circulation)**: बायाँ निलय शुद्ध ऑक्सीजनित रक्त को महाधमनी द्वारा संपूर्ण शरीर में पंप करता है।

**धमनी एवं शिरा में अंतर:**
- **धमनी (Artery)**: शुद्ध रक्त हृदय से शरीर के अंगों तक ले जाती है (अपवाद: पल्मोनरी धमनी)।
- **शिरा (Vein)**: अशुद्ध रक्त अंगों से वापस हृदय तक लाती है (अपवाद: पल्मोनरी शिरा)।`;
  }

  // 7. उत्सर्जन एवं नेफ्रॉन (Excretion & Nephron)
  if (q.includes('utsarjan') || q.includes('उत्सर्जन') || q.includes('nephron') || q.includes('नेफ्रॉन') || q.includes('kidney')) {
    return `### 🫘 उत्सर्जन तंत्र एवं नेफ्रॉन (Nephron)

**परिभाषा:**
शरीर में उपापचयी क्रियाओं (Metabolic activities) के फलस्वरूप बने हानिकारक नाइट्रोजनयुक्त अपशिष्ट पदार्थों (जैसे यूरिया, यूरिक अम्ल) को बाहर निकालने की क्रिया को **उत्सर्जन (Excretion)** कहते हैं।

**नेफ्रॉन (Nephron):**
नेफ्रॉन वृक्क (Kidney) की संरचनात्मक एवं कार्यात्मक इकाई है। प्रत्येक वृक्क में लगभग **10 से 12 लाख** नेफ्रॉन होते हैं।

**नेफ्रॉन के प्रमुख भाग:**
1. **बोमन संपुट (Bowman's Capsule)**: प्यालेनुमा संरचना जिसमें कोशिकाओं का गुच्छा (Glomerulus) होता है।
2. **केशिकागुच्छ (Glomerulus)**: यहाँ रक्त का उच्च दाब पर परा-निस्पंदन (Ultrafiltration) होता है।
3. **संवैलित नलिका (Henle's Loop & Tubules)**: यहाँ उपयोगी पदार्थों (ग्लूकोज, अमीनो अम्ल, जल) का पुनः अवशोषण (Reabsorption) होता है।

💡 *अपोहन (Dialysis)*: जब किसी व्यक्ति के वृक्क कार्य करना बंद कर देते हैं, तो कृत्रिम वृक्क द्वारा रक्त को छानने की प्रक्रिया को हीमोडायलिसिस कहते हैं।`;
  }

  // ==========================================
  // PHYSICS CHAPTERS & FORMULAS
  // ==========================================

  // 8. कूलॉम का नियम (Coulomb's Law)
  if (q.includes('coulomb') || q.includes('कूलॉम') || q.includes('electrostatic')) {
    return `### ⚡ कूलॉम का नियम (Coulomb's Law of Electrostatics)

**कथन:**
निर्वात या वायु में स्थित किन्हीं दो स्थिर बिंदु आवेशों ($q_1$ एवं $q_2$) के बीच लगने वाला वैद्युत आकर्षण अथवा प्रतिकर्षण बल:
1. दोनों आवेशों के परिमाण के गुणनफल के अनुक्रमानुपाती होता है ($F \\propto q_1 q_2$)।
2. उनके बीच की दूरी ($r$) के वर्ग के व्युत्क्रमानुपाती होता है ($F \\propto \\frac{1}{r^2}$)।

**गणितीय सूत्र:**
$$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$$

**नियतांक के मान:**
- $\\frac{1}{4\\pi\\varepsilon_0} \\approx 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$
- $\\varepsilon_0$ = निर्वात की विद्युतशीलता ($8.854 \\times 10^{-12} \\text{ C}^2/\\text{N}\\cdot\\text{m}^2$)
- SI मात्रक: बल का मात्रक **न्यूटन (N)** होता है।`;
  }

  // 9. ओम का नियम (Ohm's Law)
  if (q.includes('ohm') || q.includes('ओम') || q.includes('pratirodh') || q.includes('resistance')) {
    return `### 🔌 ओम का नियम (Ohm's Law)

**कथन:**
यदि किसी चालक की भौतिक अवस्थाएँ (जैसे ताप, दाब, लंबाई) अपरिवर्तित रहें, तो उसके सिरों पर लगाया गया विभवांतर ($V$) उसमें प्रवाहित धारा ($I$) के अनुक्रमानुपाती होता है।

**गणितीय संबंध:**
$$V \\propto I \\implies V = I \\times R$$

जहाँ:
- $V$ = विभवांतर (Volts, $\\text{V}$)
- $I$ = विद्युत धारा (Amperes, $\\text{A}$)
- $R$ = चालक का प्रतिरोध (Ohms, $\\Omega$)

**प्रतिरोध का सूत्र:**
$$R = \\rho \\frac{L}{A}$$
- $\\rho$ = विशिष्ट प्रतिरोध (प्रतिरोधकता, $\\Omega\\cdot\\text{m}$)
- $L$ = चालक की लंबाई
- $A$ = अनुप्रस्थ काट का क्षेत्रफल

**प्रतिरोधों का संयोजन:**
- **श्रेणीक्रम (Series)**: $R_s = R_1 + R_2 + R_3$
- **समांतरक्रम (Parallel)**: $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$`;
  }

  // 10. विद्युत धारा एवं विभवांतर (Electric Current & Potential)
  if (q.includes('vidyut dhara') || q.includes('electric current') || q.includes('vibhvantar') || q.includes('विद्युत धारा')) {
    return `### ⚡ विद्युत धारा एवं विभवांतर

**1. विद्युत धारा (Electric Current):**
किसी चालक के अनुप्रस्थ काट से प्रति एकांक समय में प्रवाहित आवेश की मात्रा को **विद्युत धारा** कहते हैं:
$$I = \\frac{Q}{t}$$
- SI मात्रक: **एम्पीयर (A)** ($1\\text{ A} = 1\\text{ C/s}$)
- यह एक **अदिश राशि (Scalar Quantity)** है।

**2. विद्युत विभव एवं विभवांतर (Electric Potential & Potential Difference):**
एकांक धन परीक्षण आवेश को अनंत से किसी बिंदु तक लाने में किए गए कार्य को **विद्युत विभव** कहते हैं:
$$V = \\frac{W}{Q}$$
- SI मात्रक: **वोल्ट (V)** ($1\\text{ V} = 1\\text{ J/C}$)

**3. विद्युत शक्ति (Electric Power):**
$$P = V \\times I = I^2 R = \\frac{V^2}{R}$$
- SI मात्रक: **वाट (W)**`;
  }

  // 11. प्रकाशिकी: लेंस एवं दर्पण (Optics: Mirrors & Lenses)
  if (q.includes('lens') || q.includes('लेंस') || q.includes('darpan') || q.includes('दर्पण') || q.includes('snell') || q.includes('स्नेल')) {
    return `### 🔍 प्रकाशिकी: लेंस एवं दर्पण के मुख्य सूत्र

**1. दर्पण सूत्र (Mirror Formula):**
$$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$$
- रेखीय आवर्धन: $$m = \\frac{h'}{h} = -\\frac{v}{u}$$

**2. लेंस सूत्र (Lens Formula):**
$$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$$
- रेखीय आवर्धन: $$m = \\frac{h'}{h} = +\\frac{v}{u}$$
- लेंस की क्षमता (Power of Lens): $$P = \\frac{1}{f \\text{ (मीटर में)}}$$ (मात्रक: डायोप्टर, $\\text{D}$)

**3. स्नेल का अपवर्तन नियम (Snell's Law):**
$$\\frac{\\sin i}{\\sin r} = \\mu = \\frac{v_1}{v_2}$$
- $i$ = आपतन कोण, $r$ = अपवर्तन कोण
- $\\mu$ = अपवर्तनांक (Refractive Index)`;
  }

  // 12. गति के नियम (Newton's Laws of Motion)
  if (q.includes('newton') || q.includes('न्यूटन') || q.includes('gati') || q.includes('motion')) {
    return `### 🏃 न्यूटन के गति के नियम (Newton's Laws of Motion)

**1. प्रथम नियम (जड़त्व का नियम / Law of Inertia):**
यदि कोई वस्तु विरामावस्था में है तो वह विराम में ही रहेगी, और यदि गतिमान है तो एकसमान गति से चलती रहेगी जब तक कि उस पर कोई बाह्य असंतुलित बल न लगाया जाए।

**2. द्वितीय नियम (संवेग परिवर्तन की दर / Law of Force):**
किसी वस्तु के संवेग परिवर्तन की दर उस पर लगाए गए बल के समानुपाती होती है:
$$F = \\frac{dp}{dt} = m \\times a$$
- बल ($F$) = द्रव्यमान ($m$) $\\times$ त्वरण ($a$)

**3. तृतीय नियम (क्रिया-प्रतिक्रिया का नियम / Action-Reaction):**
प्रत्येक क्रिया की बराबर एवं विपरीत दिशा में प्रतिक्रिया होती है ($F_{AB} = -F_{BA}$)।

**गति के 3 समीकरण:**
1. $$v = u + at$$
2. $$s = ut + \\frac{1}{2}at^2$$
3. $$v^2 = u^2 + 2as$$`;
  }

  // ==========================================
  // CHEMISTRY CHAPTERS & FORMULAS
  // ==========================================

  // 13. अम्ल, क्षार एवं लवण (Acids, Bases & Salts)
  if (q.includes('amal') || q.includes('अम्ल') || q.includes('kshar') || q.includes('क्षार') || q.includes('acid') || q.includes('base') || q.includes('ph')) {
    return `### 🧪 अम्ल, क्षार एवं लवण (Acids, Bases & Salts)

**1. अम्ल (Acids):**
- स्वाद में खट्टे होते हैं।
- नीले लिटमस को लाल कर देते हैं।
- जलीय विलयन में $H^+$ या $H_3O^+$ (हाइड्रोनियम) आयन देते हैं (जैसे $HCl, H_2SO_4, HNO_3$)।

**2. क्षार (Bases):**
- स्वाद में कड़वे तथा छूने पर साबुन जैसे चिकने होते हैं।
- लाल लिटमस को नीला कर देते हैं।
- जलीय विलयन में $OH^-$ (हाइड्रॉक्साइड) आयन देते हैं (जैसे $NaOH, KOH$)।

**3. pH पैमाना (pH Scale - सोरेन्सन):**
$$pH = -\\log_{10}[H^+]$$
- $pH < 7$: अम्लीय विलयन
- $pH = 7$: उदासीन विलयन (शुद्ध जल)
- $pH > 7$: क्षारीय विलयन

**उदासीनीकरण अभिक्रिया (Neutralization Reaction):**
$$\\text{अम्ल} + \\text{क्षार} \\to \\text{लवण} + \\text{जल}$$
$$HCl + NaOH \\to NaCl + H_2O$$`;
  }

  // 14. कार्बन एवं उसके यौगिक (Carbon & Hydrocarbons)
  if (q.includes('carbon') || q.includes('कार्बन') || q.includes('alkane') || q.includes('hydrocarbon') || q.includes('एल्केन')) {
    return `### ⚗️ कार्बन एवं उसके यौगिक (Hydrocarbons)

कार्बन की संयोजकता 4 होती है (चतुःसंयोजी / Tetravalent) और इसमें शृंखलन (Catenation) का अद्वितीय गुण पाया जाता है।

**हाइड्रोकार्बन के तीन प्रमुख वर्ग:**
1. **एल्केन (Alkane - संतृप्त, एकल बंध $C-C$):**
   - सामान्य सूत्र: $$C_n H_{2n+2}$$
   - उदाहरण: मेथेन ($CH_4$), एथेन ($C_2H_6$), प्रोपेन ($C_3H_8$)।
2. **एल्कीन (Alkene - असंतृप्त, द्विबंध $C=C$):**
   - सामान्य सूत्र: $$C_n H_{2n}$$
   - उदाहरण: एथीन ($C_2H_4$), प्रोपीन ($C_3H_6$)।
3. **एल्काइन (Alkyne - असंतृप्त, त्रिबंध $C\\equiv C$):**
   - सामान्य सूत्र: $$C_n H_{2n-2}$$
   - उदाहरण: एथाइन/एसिटिलीन ($C_2H_2$), प्रोपाइन ($C_3H_4$)।`;
  }

  // ==========================================
  // MATHEMATICS CHAPTERS & FORMULAS
  // ==========================================

  // 15. द्विघात समीकरण (Quadratic Equations)
  if (q.includes('quadratic') || q.includes('द्विघात') || q.includes('samikaran')) {
    return `### 📐 द्विघात समीकरण (Quadratic Equation)

**मानक रूप:**
$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$

**विविक्तकर (Discriminant):**
$$D = b^2 - 4ac$$

**मूलों की प्रकृति (Nature of Roots):**
- यदि $D > 0$: दो भिन्न वास्तविक मूल (Real & Distinct roots)।
- यदि $D = 0$: दो बराबर वास्तविक मूल (Real & Equal roots)।
- यदि $D < 0$: कोई वास्तविक मूल नहीं (काल्पनिक / Complex roots)।

**श्रीधराचार्य द्विघाती सूत्र (Quadratic Formula):**
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**मूलों का संबंध:**
- मूलों का योग (Sum of roots): $$\\alpha + \\beta = -\\frac{b}{a}$$
- मूलों का गुणनफल (Product of roots): $$\\alpha \\cdot \\beta = \\frac{c}{a}$$`;
  }

  // 16. त्रिकोणमिति (Trigonometry)
  if (q.includes('trigonometry') || q.includes('त्रिकोणमिति') || q.includes('sin') || q.includes('cos') || q.includes('tan')) {
    return `### 📐 त्रिकोणमिति के महत्वपूर्ण सूत्र (Trigonometry Formulas)

**1. मूलभूत सर्वसमिकाएँ (Fundamental Identities):**
1. $$\\sin^2\\theta + \\cos^2\\theta = 1$$
2. $$1 + \\tan^2\\theta = \\sec^2\\theta \\implies \\sec^2\\theta - \\tan^2\\theta = 1$$
3. $$1 + \\cot^2\\theta = \\csc^2\\theta \\implies \\csc^2\\theta - \\cot^2\\theta = 1$$

**2. विशिष्ट कोणों के मान:**
- $\\sin 0^\\circ = 0, \\quad \\sin 30^\\circ = \\frac{1}{2}, \\quad \\sin 45^\\circ = \\frac{1}{\\sqrt{2}}, \\quad \\sin 60^\\circ = \\frac{\\sqrt{3}}{2}, \\quad \\sin 90^\\circ = 1$
- $\\cos 0^\\circ = 1, \\quad \\cos 30^\\circ = \\frac{\\sqrt{3}}{2}, \\quad \\cos 45^\\circ = \\frac{1}{\\sqrt{2}}, \\quad \\cos 60^\\circ = \\frac{1}{2}, \\quad \\cos 90^\\circ = 0$
- $\\tan 0^\\circ = 0, \\quad \\tan 30^\\circ = \\frac{1}{\\sqrt{3}}, \\quad \\tan 45^\\circ = 1, \\quad \\tan 60^\\circ = \\sqrt{3}, \\quad \\tan 90^\\circ = \\text{अपरिभाषित}$`;
  }

  // 17. अवकलन एवं समाकलन (Calculus: Differentiation & Integration)
  if (q.includes('differentiation') || q.includes('integration') || q.includes('अवकलन') || q.includes('समाकलन')) {
    return `### 📊 कैलकुलस: अवकलन एवं समाकलन के मूल सूत्र

**अवकलन सूत्र (Differentiation Formulas):**
1. $$\\frac{d}{dx}(x^n) = n x^{n-1}$$
2. $$\\frac{d}{dx}(\\sin x) = \\cos x, \\quad \\frac{d}{dx}(\\cos x) = -\\sin x$$
3. $$\\frac{d}{dx}(\\tan x) = \\sec^2 x$$
4. $$\\frac{d}{dx}(e^x) = e^x, \\quad \\frac{d}{dx}(\\ln x) = \\frac{1}{x}$$

**समाकलन सूत्र (Integration Formulas):**
1. $$\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$$
2. $$\\int \\frac{1}{x} \\, dx = \\ln|x| + C$$
3. $$\\int \\sin x \\, dx = -\\cos x + C, \\quad \\int \\cos x \\, dx = \\sin x + C$$
4. $$\\int \\sec^2 x \\, dx = \\tan x + C$$`;
  }

  // ==========================================
  // DYNAMIC ACADEMIC CONCEPT SYNTHESIZER
  // For any other subject query, provide an
  // in-depth structured NCERT exam roadmap
  // ==========================================
  const cleanQ = query.replace(/[?।!.,]/g, '').trim();

  return `### 🎓 विषय विश्लेषण: "${cleanQ}"

नमस्ते! Aspire Academy के **Neuron AI** में आपका स्वागत है।

**📌 मुख्य अवधारणा (Core Concept):**
- **"${cleanQ}"** बिहार बोर्ड (Class 10th एवं 12th), CBSE तथा NEET/JEE फाउंडेशन की दृष्टि से एक अत्यंत महत्वपूर्ण शैक्षिक संकल्पना है।
- इस विषय की तैयारी करते समय मुख्य NCERT परिभाषाओं, मूल सिद्धांतों और वैज्ञानिक नियमों पर विशेष ध्यान देना आवश्यक है।

---

### 📋 बोर्ड परीक्षा के लिए अध्ययन रणनीति (Shekhar Sir's Guidance):
1. **सटीक परिभाषा याद रखें**: बोर्ड उत्तरपुस्तिका में परीक्षक सीधे NCERT की मानक परिभाषा और वैज्ञानिक शब्दावली देखते हैं।
2. **रेखाचित्र (Diagram) का अभ्यास**: यदि यह जीव विज्ञान या भौतिकी का प्रश्न है, तो नामांकित चित्र (Well-labeled diagram) अनिवार्य रूप से बनाएं।
3. **गणितीय सूत्र (Formula Presentation)**: किसी भी सूत्र को स्पष्ट बॉक्स में लिखें और प्रत्येक चर (Variable) का मात्रक (SI Unit) अवश्य उल्लेख करें।
4. **हस्तलिखित नोट्स**: इस अध्याय के विस्तृत फ्लोचार्ट और नोट्स पाने के लिए अपने **PDF Bank** सेक्शन को देखें।

💡 *सुझाव*: यदि आप इस पर कोई विशेष आंकिक प्रश्न (Numerical) या समीकरण हल करवाना चाहते हैं, तो कृपया पूरा प्रश्न यहाँ टाइप करें!`;
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
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

    // 1. Google Gemini API (Env or Body key)
    const geminiKey =
      body.geminiApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY;

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

    // 2. Groq Free API (Env or Body key)
    const groqKey = body.groqApiKey || process.env.GROQ_API_KEY;
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

    // 3. OpenRouter Free API
    const openRouterKey = body.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      const openRouterReply = await callOpenRouter(rawMessages, openRouterKey);
      if (openRouterReply) {
        return NextResponse.json({
          success: true,
          reply: openRouterReply,
          provider: 'openrouter',
        });
      }
    }

    // 4. Pollinations Free AI with dynamic client IP
    const pollinationsReply = await callPollinations(rawMessages, clientIp);
    if (pollinationsReply) {
      return NextResponse.json({
        success: true,
        reply: pollinationsReply,
        provider: 'pollinations-free-ai',
      });
    }

    // 5. High-Precision NCERT & Board Academic Knowledge Engine
    const fallbackReply = getSmartFallback(lastUserMessage);
    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      provider: 'neuron-ncert-engine',
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
