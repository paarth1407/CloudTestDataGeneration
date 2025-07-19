'use server';

import { generateRealisticTestData, type GenerateRealisticTestDataInput } from '@/ai/flows/generate-realistic-test-data';
import { analyzeFormScreenshot } from '@/ai/flows/analyze-form-screenshot';
import { analyzeHtmlForm } from '@/ai/flows/analyze-html-form';
import { extractRelevantHtml } from '@/lib/html-sanitizer';
import { basicParseFormFields } from '@/lib/basic-form-parser';
import { refineFieldNames } from '@/ai/flows/refine-field-names';
import { analyzeTemplateFile } from '@/ai/flows/analyze-template-file';
import { formSchema, type FormValues } from '@/lib/schemas';

export async function handleGenerateData(data: FormValues) {
  try {
    const validatedData = formSchema.safeParse(data);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues.map(issue => issue.message).join(' ');
      return { success: false, error: errorMessages || 'Invalid input data.' };
    }

    const input: GenerateRealisticTestDataInput = {
      fields: validatedData.data.fields,
      numberOfRows: validatedData.data.numberOfRows,
      locale: validatedData.data.locale,
    };

    const result = await generateRealisticTestData(input);

    if (result.generatedData) {
      // Validate that the output is valid JSON before sending to client
      JSON.parse(result.generatedData);
      return { success: true, data: result.generatedData };
    } else {
      return { success: false, error: 'Failed to generate data. The AI returned an empty result.' };
    }
  } catch (error) {
    console.error('Error generating test data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred on the server.';
    return { success: false, error: errorMessage };
  }
}

export async function handleAnalyzeScreenshot(screenshotDataUri: string) {
  try {
    if (!screenshotDataUri) {
      return { success: false, error: 'No screenshot data provided.' };
    }

    const result = await analyzeFormScreenshot({ screenshotDataUri });
    
    if (result.fields) {
      return { success: true, data: result.fields };
    } else {
      return { success: false, error: 'Failed to analyze screenshot. The AI returned an empty result.' };
    }
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred on the server.';
    return { success: false, error: errorMessage };
  }
}


export async function handleAnalyzeHtml({ htmlContent, url }: { htmlContent?: string; url?: string }) {
  try {
    let contentToAnalyze = htmlContent;

    if (url) {
      if (!URL.canParse(url)) {
        return { success: false, error: 'Invalid URL provided.' };
      }
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Failed to fetch URL: ${response.statusText}` };
      }
      contentToAnalyze = await response.text();
    }

    if (!contentToAnalyze) {
      return { success: false, error: 'No HTML content or URL provided.' };
    }

    // Pre-process large or noisy HTML to keep the LLM prompt small and focused
    const sanitizedHtml = extractRelevantHtml(contentToAnalyze);
    const result = await analyzeHtmlForm({ htmlContent: sanitizedHtml });

    // Always compute heuristics as a safety net
    const heuristicFields = basicParseFormFields(contentToAnalyze);

    let combined: typeof heuristicFields = [];

    if (result.fields && result.fields.length > 0) {
      // Merge AI + heuristic extras
      combined = [...result.fields];
      for (const h of heuristicFields) {
        if (!combined.some(a => a.fieldName === h.fieldName)) {
          combined.push(h);
        }
      }
    } else {
      combined = heuristicFields;
    }

    if (combined.length === 0) {
      return { success: false, error: 'Failed to detect any fields from the HTML.' };
    }

    // Remove obvious misdetections: if we already have a streetAddress field, drop any Paragraph datatypes whose label/id was misread
    const hasStreet = combined.some(f => f.fieldName === 'streetAddress');
    if (hasStreet) {
      combined = combined.filter(f => !(f.dataType === 'Paragraph' && /picture/i.test(f.fieldName)) );
    }

    // Post-process: ensure address-like fields use StreetAddress data type
    combined = combined.map(f => {
      const addrRegex = /(current|street|postal|address)/i;
      if (addrRegex.test(f.label ?? '') || addrRegex.test(f.fieldName)) {
        return { ...f, fieldName: 'streetAddress', dataType: 'StreetAddress' };
      }
      return f;
    });

    // Refine any field names that originated from heuristics and are still generic
    const needsRefine = combined.filter(f => /^(field|input|text|textarea|select)[0-9_]*$/i.test(f.fieldName));
    if (needsRefine.length > 0) {
      const refinement = await refineFieldNames({
        fields: heuristicFields.map(h => ({ original: h.fieldName, label: h.label })),
        url,
      });
      let rIdx = 0;
      combined = combined.map(f => {
        if (needsRefine.includes(f)) {
          const newName = refinement.refined[rIdx++] || f.fieldName;
          return { ...f, fieldName: newName };
        }
        return f;
      });
    }

    return { success: true, data: combined };
  } catch (error) {
    console.error('Error analyzing HTML:', error);
    let userErrorMessage = 'An error occurred during analysis. The HTML may be malformed, or the AI service may be temporarily unavailable.';
    if (error instanceof Error && error.message.toLowerCase().includes('token')) {
        userErrorMessage = 'The provided HTML file is too large for the AI to process. Please try with a smaller file or a different URL.';
    }
    return { success: false, error: userErrorMessage };
  }
}

export async function handleAnalyzeTemplate(headers: string[]) {
  try {
    if (!headers || headers.length === 0) {
      return { success: false, error: 'No headers provided to analyze.' };
    }

    const result = await analyzeTemplateFile({ headers });
    
    if (result.fields) {
      return { success: true, data: result.fields };
    } else {
      return { success: false, error: 'Failed to analyze template. The AI returned an empty result.' };
    }
  } catch (error) {
    console.error('Error analyzing template:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred on the server.';
    return { success: false, error: errorMessage };
  }
}
