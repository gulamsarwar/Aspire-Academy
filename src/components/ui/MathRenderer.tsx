'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

/**
 * Standardizes common unicode math symbols into clean LaTeX expressions
 * for crisp KaTeX typography without font distortion.
 */
function normalizeMathText(text: string): string {
  if (!text) return '';

  return text
    // Normalize square roots: √16 or √(x+y) -> \sqrt{16} or \sqrt{x+y}
    .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}')
    // Normalize common superscripts: x² -> x^2, x³ -> x^3, etc.
    .replace(/([a-zA-Z0-9])²/g, '$1^2')
    .replace(/([a-zA-Z0-9])³/g, '$1^3')
    .replace(/([a-zA-Z0-9])⁴/g, '$1^4')
    .replace(/([a-zA-Z0-9])ⁿ/g, '$1^n')
    // Subscripts: H₂O -> H_2O, a₁ -> a_1
    .replace(/([A-Za-z])₀/g, '$1_0')
    .replace(/([A-Za-z])₁/g, '$1_1')
    .replace(/([A-Za-z])₂/g, '$1_2')
    .replace(/([A-Za-z])₃/g, '$1_3')
    .replace(/([A-Za-z])₄/g, '$1_4')
    // Convert standard LaTeX bracket delimiters \[ \] and \( \) to $$ and $
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    // Greek and symbol replacements
    .replace(/±/g, '\\pm ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\ne ')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/°/g, '^\\circ ');
}

/**
 * Parses mixed text containing Hindi, English, and LaTeX delimiters ($...$ and $$...$$).
 */
export function MathRenderer({
  content,
  className = '',
  block = false,
}: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    const normalized = normalizeMathText(content);

    // If the entire string is explicitly wrapped in $$ or $
    if (normalized.startsWith('$$') && normalized.endsWith('$$') && normalized.length > 4) {
      const math = normalized.slice(2, -2).trim();
      try {
        return katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return normalized;
      }
    }

    // Split text by LaTeX delimiters: $$block$$ or $inline$
    // Regex matches: $$...$$ or $...$
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
    const parts = normalized.split(mathRegex);

    return parts
      .map((part) => {
        if (!part) return '';

        // Block math: $$...$$
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const math = part.slice(2, -2).trim();
          try {
            return `<div class="my-2 overflow-x-auto text-center">${katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            })}</div>`;
          } catch {
            return `<span>${part}</span>`;
          }
        }

        // Inline math: $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1).trim();
          try {
            return `<span class="inline-math mx-0.5">${katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            })}</span>`;
          } catch {
            return `<span>${part}</span>`;
          }
        }

        // Regular text (preserves Hindi / Devanagari and English safely)
        // Convert linebreaks to <br/>
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/\n/g, '<br/>');
      })
      .join('');
  }, [content]);

  return (
    <div
      className={`math-content font-normal leading-relaxed text-slate-800 ${className} ${
        block ? 'block' : 'inline'
      }`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
