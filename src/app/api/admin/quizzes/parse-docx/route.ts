import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { parseWordQuizContent, convertOMMLToLatex } from '@/lib/quiz/docx-parser';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let extractedText = '';
    let filename = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawText = formData.get('rawText') as string | null;

      if (rawText && rawText.trim()) {
        extractedText = rawText;
      } else if (file) {
        filename = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check if file is a zip/docx (starts with PK)
        if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
          try {
            const zip = await JSZip.loadAsync(buffer);
            const docXmlFile = zip.file('word/document.xml');

            if (docXmlFile) {
              const docXml = await docXmlFile.async('text');

              // 1. Convert OMML math tags into LaTeX
              let processedXml = docXml.replace(/<m:oMath[\s\S]*?<\/m:oMath>/gi, (match) => {
                return ` ${convertOMMLToLatex(match)} `;
              });

              // 2. Convert paragraph breaks to newlines
              processedXml = processedXml
                .replace(/<\/w:p>/gi, '\n')
                .replace(/<w:br[^>]*>/gi, '\n')
                .replace(/<w:tab[^>]*>/gi, ' ');

              // 3. Strip remaining XML tags
              processedXml = processedXml.replace(/<[^>]+>/g, '');

              // 4. Decode common XML entities
              processedXml = processedXml
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');

              extractedText = processedXml;
            }
          } catch (zipErr) {
            console.warn('JSZip extraction fallback:', zipErr);
          }

          // Fallback or complement with mammoth for plain text if XML extraction was empty
          if (!extractedText.trim()) {
            try {
              const mammothResult = await mammoth.extractRawText({ buffer });
              extractedText = mammothResult.value;
            } catch (mammothErr) {
              console.warn('Mammoth extraction fallback:', mammothErr);
            }
          }
        } else {
          // Plain text file (.txt, .md)
          extractedText = buffer.toString('utf-8');
        }
      }
    } else {
      // JSON body
      const body = await req.json();
      extractedText = body.content || body.rawText || '';
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No readable text content found in the uploaded file.',
          questions: [],
          errors: ['Uploaded document is empty or unreadable.'],
        },
        { status: 400 }
      );
    }

    const parseResult = parseWordQuizContent(extractedText);

    return NextResponse.json({
      success: true,
      filename,
      extractedPreview: extractedText.slice(0, 500),
      ...parseResult,
    });
  } catch (error: any) {
    console.error('DOCX parse route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse document.',
        questions: [],
        errors: [error.message],
      },
      { status: 500 }
    );
  }
}
