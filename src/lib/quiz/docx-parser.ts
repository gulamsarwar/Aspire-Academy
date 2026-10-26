import { QuizQuestion, QuizOption } from '../types';

export interface ParseResult {
  questions: QuizQuestion[];
  errors: string[];
  totalParsed: number;
  validCount: number;
  invalidCount: number;
}

/**
 * Converts Office Math Markup Language (OMML) XML strings into standard LaTeX syntax.
 */
export function convertOMMLToLatex(ommlXml: string): string {
  if (!ommlXml || !ommlXml.includes('<m:')) {
    return ommlXml;
  }

  let latex = ommlXml;

  // 1. Fractions: <m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f> -> \frac{a}{b}
  latex = latex.replace(/<m:f[\s\S]*?<m:num>([\s\S]*?)<\/m:num>[\s\S]*?<m:den>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/gi, (_, num, den) => {
    const cleanNum = extractOmmlText(num);
    const cleanDen = extractOmmlText(den);
    return `\\frac{${cleanNum}}{${cleanDen}}`;
  });

  // 2. Radicals / Square Roots: <m:rad><m:deg/><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad> -> \sqrt{x}
  latex = latex.replace(/<m:rad[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:rad>/gi, (_, expr) => {
    const cleanExpr = extractOmmlText(expr);
    return `\\sqrt{${cleanExpr}}`;
  });

  // 3. Superscripts: <m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup> -> x^{2}
  latex = latex.replace(/<m:sSup[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/gi, (_, base, sup) => {
    return `${extractOmmlText(base)}^{${extractOmmlText(sup)}}`;
  });

  // 4. Subscripts: <m:sSub><m:e>base</m:e><m:sub>sub</m:sub></m:sSub> -> base_{sub}
  latex = latex.replace(/<m:sSub[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/gi, (_, base, sub) => {
    return `${extractOmmlText(base)}_{${extractOmmlText(sub)}}`;
  });

  // 5. Sub-Superscripts: <m:sSubSup><m:e>base</m:e><m:sub>sub</m:sub><m:sup>sup</m:sup></m:sSubSup> -> base_{sub}^{sup}
  latex = latex.replace(/<m:sSubSup[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSubSup>/gi, (_, base, sub, sup) => {
    return `${extractOmmlText(base)}_{${extractOmmlText(sub)}}^{${extractOmmlText(sup)}}`;
  });

  // 6. Delimiters (parentheses, brackets): <m:d><m:e>expr</m:e></m:d> -> \left( expr \right)
  latex = latex.replace(/<m:d[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:d>/gi, (_, expr) => {
    return `\\left( ${extractOmmlText(expr)} \\right)`;
  });

  // 7. Clean remaining OMML tags to text
  latex = extractOmmlText(latex);

  return latex.trim() ? `$${latex.trim()}$` : '';
}

function extractOmmlText(xml: string): string {
  if (!xml) return '';
  return xml
    .replace(/<m:t[^>]*>([\s\S]*?)<\/m:t>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Robust Parser that converts text or Word document content into structured Quiz Questions.
 * Supports:
 * - Hindi (Devanagari) & English bilingual text
 * - Question numbering: 1., Q1., Question 1:, प्र. 1., प्रश्न 1:
 * - Option formats: (A), (B), (C), (D) or [A], [B] or A), B), C), D) or A., B., C., D. or (1), (2), (3), (4) or क), ख), ग), घ)
 * - Answer formats: Ans: A, Answer: (B), उत्तर: A, उत्तर: (ख), Correct: C
 * - Inline mathematical expressions with KaTeX delimiters: $...$
 * - Preserves question numbering and option ordering
 */
export function parseWordQuizContent(rawContent: string): ParseResult {
  const errors: string[] = [];
  const questions: QuizQuestion[] = [];

  if (!rawContent || !rawContent.trim()) {
    return {
      questions: [],
      errors: ['Document content is empty.'],
      totalParsed: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  // Pre-process OMML math if XML tags are present
  let normalized = rawContent;
  if (normalized.includes('<m:oMath')) {
    normalized = normalized.replace(/<m:oMath[\s\S]*?<\/m:oMath>/gi, (match) => {
      return ` ${convertOMMLToLatex(match)} `;
    });
    // Strip other XML tags
    normalized = normalized.replace(/<[^>]+>/g, ' ');
  }

  // Normalize line breaks
  const lines = normalized
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Question starting patterns: "1.", "1)", "Q1.", "Question 1:", "प्र. 1.", "प्रश्न 1:"
  const questionStartRegex = /^(?:(?:Q(?:uestion)?\.?|प्र(?:श्न)?\.?)\s*(\d+)[:\.\)]|\b(\d+)[\.\)]\s+)/i;

  // Option patterns: (A), [A], A), A., (1), 1), (क), क), क.
  const optionRegex = /^(?:(?:\(|\[)\s*([A-Da-d1-4क-घ])\s*(?:\)|\])|([A-Da-d1-4क-घ])[\.\)])\s*(.*)$/;

  // Answer patterns: Ans: B, Answer: A, उत्तर: क, Correct Option: C
  const answerRegex = /^(?:Ans(?:wer)?|उत्तर|Correct(?:\s*Option)?|उत्तर\s*विकल्प|Key)\s*[:=\-]?\s*(?:\(|\[)?\s*([A-Da-d1-4क-घ])\s*(?:\)|\])?/i;

  // Explanation patterns: Explanation: ..., हल: ..., व्याख्या: ...
  const explanationRegex = /^(?:Explanation|हल|व्याख्या|Solution|Note)\s*[:=\-]?\s*(.*)$/i;

  interface RawBlock {
    qNum: number;
    qLines: string[];
    options: { key: string; text: string }[];
    answer?: string;
    explanation?: string;
  }

  const rawBlocks: RawBlock[] = [];
  let currentBlock: RawBlock | null = null;
  let autoQNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check if line is a question header
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      if (currentBlock) {
        rawBlocks.push(currentBlock);
      }
      const parsedNum = parseInt(qMatch[1] || qMatch[2] || `${autoQNum}`, 10);
      const textAfterHeader = line.replace(questionStartRegex, '').trim();

      currentBlock = {
        qNum: parsedNum || autoQNum,
        qLines: textAfterHeader ? [textAfterHeader] : [],
        options: [],
      };
      autoQNum++;
      continue;
    }

    if (!currentBlock) {
      // If content appears before first explicit question number, start block 1
      currentBlock = {
        qNum: autoQNum++,
        qLines: [line],
        options: [],
      };
      continue;
    }

    // 2. Check if line is an Option
    const optMatch = line.match(optionRegex);
    if (optMatch) {
      const rawKey = (optMatch[1] || optMatch[2] || '').trim();
      const optText = optMatch[3] || '';

      // Normalize option keys to A, B, C, D
      let normalizedKey = 'A';
      const k = rawKey.toUpperCase();
      if (k === '1' || k === 'क' || k === 'A') normalizedKey = 'A';
      else if (k === '2' || k === 'ख' || k === 'B') normalizedKey = 'B';
      else if (k === '3' || k === 'ग' || k === 'C') normalizedKey = 'C';
      else if (k === '4' || k === 'घ' || k === 'D') normalizedKey = 'D';

      currentBlock.options.push({
        key: normalizedKey,
        text: optText,
      });
      continue;
    }

    // 3. Check if line is an Answer
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      const rawAns = ansMatch[1].trim().toUpperCase();
      let normalizedAns = 'A';
      if (rawAns === '1' || rawAns === 'क' || rawAns === 'A') normalizedAns = 'A';
      else if (rawAns === '2' || rawAns === 'ख' || rawAns === 'B') normalizedAns = 'B';
      else if (rawAns === '3' || rawAns === 'ग' || rawAns === 'C') normalizedAns = 'C';
      else if (rawAns === '4' || rawAns === 'घ' || rawAns === 'D') normalizedAns = 'D';

      currentBlock.answer = normalizedAns;
      continue;
    }

    // 4. Check if line is an Explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentBlock.explanation = expMatch[1] || '';
      continue;
    }

    // 5. Continuation of previous line
    if (currentBlock.options.length > 0) {
      // Continuation of last option
      const lastOpt = currentBlock.options[currentBlock.options.length - 1];
      lastOpt.text = `${lastOpt.text} ${line}`.trim();
    } else if (currentBlock.explanation !== undefined) {
      currentBlock.explanation = `${currentBlock.explanation} ${line}`.trim();
    } else {
      currentBlock.qLines.push(line);
    }
  }

  if (currentBlock) {
    rawBlocks.push(currentBlock);
  }

  // Validate and assemble structured QuizQuestion objects
  let validCount = 0;
  let invalidCount = 0;

  rawBlocks.forEach((block, idx) => {
    const questionText = block.qLines.join(' ').trim();
    const qNumber = block.qNum || idx + 1;

    // Validate options
    const formattedOptions: QuizOption[] = block.options.map((opt, i) => ({
      id: opt.key,
      key: opt.key,
      text: opt.text.trim(),
      order_index: i,
    }));

    // If options are missing or fewer than 2, record validation error
    const blockErrors: string[] = [];
    if (!questionText) {
      blockErrors.push(`Question #${qNumber}: Missing question description text.`);
    }

    if (formattedOptions.length < 2) {
      blockErrors.push(
        `Question #${qNumber}: Found only ${formattedOptions.length} option(s). At least 2 options (typically A, B, C, D) are required.`
      );
    }

    // Default or validated answer
    const correctOption = block.answer || 'A';
    if (!block.answer) {
      blockErrors.push(
        `Question #${qNumber}: No explicit answer detected. Defaulted to (A). Please verify in preview.`
      );
    }

    const isValid = blockErrors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
      errors.push(...blockErrors);
    }

    questions.push({
      id: `q_${Date.now()}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      question_number: qNumber,
      question_text: questionText || `Question ${qNumber}`,
      options: formattedOptions.length > 0 ? formattedOptions : [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
        { id: 'D', text: 'Option D' },
      ],
      correct_option: correctOption,
      explanation: block.explanation || undefined,
      marks: 1,
    });
  });

  return {
    questions,
    errors,
    totalParsed: questions.length,
    validCount,
    invalidCount,
  };
}
