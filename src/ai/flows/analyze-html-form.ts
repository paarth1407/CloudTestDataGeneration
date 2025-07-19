'use server';

/**
 * @fileOverview AI-powered HTML form analysis flow.
 *
 * - analyzeHtmlForm - A function that analyzes HTML content to detect form fields.
 * - AnalyzeHtmlFormInput - The input type for the analyzeHtmlForm function.
 * - AnalyzeHtmlFormOutput - The return type for the analyzeHtmlForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {dataTypes} from '@/lib/schemas';

const validDataTypes = dataTypes.map(d => `"${d}"`).join(', ');

const AnalyzeHtmlFormInputSchema = z.object({
  htmlContent: z.string().describe("The HTML content of a webpage containing a form."),
});
export type AnalyzeHtmlFormInput = z.infer<typeof AnalyzeHtmlFormInputSchema>;

const AnalyzeHtmlFormOutputSchema = z.object({
  fields: z.array(z.object({
    fieldName: z.string().describe('The machine-readable name for the field (e.g., "firstName"). Use the input\'s `name` or `id` attribute if available.'),
    dataType: z.enum(dataTypes).describe('The detected data type for the field.'),
  })).describe('An array of detected form fields.')
});
export type AnalyzeHtmlFormOutput = z.infer<typeof AnalyzeHtmlFormOutputSchema>;

export async function analyzeHtmlForm(input: AnalyzeHtmlFormInput): Promise<AnalyzeHtmlFormOutput> {
  return analyzeHtmlFormFlow(input);
}

const analyzeHtmlFormPrompt = ai.definePrompt({
  name: 'analyzeHtmlFormPrompt',
  input: {schema: AnalyzeHtmlFormInputSchema},
  output: {schema: AnalyzeHtmlFormOutputSchema},
  config: { temperature: 0, topP: 0 },
  prompt: `You are an expert web developer and data analyst. Your task is to analyze the provided HTML content and extract its form field structure, even if the fields are part of a complex, JavaScript-rendered UI.

**CRITICAL INSTRUCTIONS:**
1.  **Scan the ENTIRE HTML BODY.** Do not limit your search to just \`<form>\` tags. Fields can be located anywhere in the document, including within complex layouts using \`<div>\`s or \`<table>\`s.
2.  **Identify all user input elements.** This includes:
    *   **Standard Fields**: \`<input>\`, \`<textarea>\`, and \`<select>\`.
    *   **Complex/Custom Fields**: Modern web apps use custom components. Look for \`<div>\` or other elements with ARIA roles like \`role="textbox"\`, \`role="combobox"\`, or \`role="search"\`. Also, pay attention to elements with class names or \`data-\` attributes that suggest they are input controls (e.g., \`class="custom-input"\`, \`data-testid="email-field"\`).
3.  **IGNORE HIDDEN FIELDS.** Do not include fields with \`type="hidden"\` or CSS styles like \`display: none;\` or \`visibility: hidden;\`.

For each field you identify, provide the following:
1.  \`fieldName\`: A concise, machine-readable name for the field in camelCase. Infer this from the field's 'name', 'id', or 'data-testid' attribute. If those are missing, use its \`aria-label\`, an associated \`<label>\` tag, or placeholder text. **The text in a preceding \`<td>\` element in a table is often the label for an input in the next \`<td>\`**.
2.  \`dataType\`: The most appropriate data type for the field based on all available information (type, name, label, ARIA attributes). You MUST choose one of the following valid options:
[${validDataTypes}]

Here are some examples of how to map HTML to data types:
- An input like \`<input type="text" name="first_name">\` with a label "First Name" should have \`fieldName: 'firstName'\` and \`dataType: 'FirstName'\`.
- An input like \`<input type="email" id="emailAddress">\` should have \`fieldName: 'emailAddress'\` and \`dataType: 'EmailAddress'\`.
- A \`<select name="country">\` should have \`fieldName: 'country'\` and \`dataType: 'Country'\`.
- A \`<textarea name="comment">\` should have \`fieldName: 'comment'\` and \`dataType: 'Paragraph'\`.
- A \`<textarea name="street_address">\` with a label "Street Address" should have \`fieldName: 'streetAddress'\` and \`dataType: 'StreetAddress'\`.
- A custom element like \`<div role="textbox" aria-label="Your Age"></div>\` should be mapped to \`fieldName: 'yourAge'\` and \`dataType: 'Age'\`.
- A table row \`<tr><td>Gender</td><td><input type="radio" name="gender"></td></tr>\` should have \`fieldName: 'gender'\` and \`dataType: 'Gender'\`.
- A table row \`<tr><td>Hobbies</td><td><input type="checkbox" name="hobbies"></td></tr>\` should have \`fieldName: 'hobbies'\` and \`dataType: 'Word'\`.
- A table row \`<tr><td>Date of Birth</td><td><input type="date" name="dob"></td></tr>\` should have \`fieldName: 'dateOfBirth'\` and \`dataType: 'DateOfBirth'\`.

Return the result as a single JSON object with a "fields" array. Do not include submit buttons or other non-input elements. If no form fields are found, return an empty "fields" array.

HTML to analyze:
\`\`\`html
{{{htmlContent}}}
\`\`\`
`,
});

const analyzeHtmlFormFlow = ai.defineFlow(
  {
    name: 'analyzeHtmlFormFlow',
    inputSchema: AnalyzeHtmlFormInputSchema,
    outputSchema: AnalyzeHtmlFormOutputSchema,
  },
  async input => {
    const {output} = await analyzeHtmlFormPrompt(input);
    return output!;
  }
);
