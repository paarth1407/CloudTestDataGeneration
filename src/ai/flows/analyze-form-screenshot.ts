'use server';

/**
 * @fileOverview AI-powered form screenshot analysis flow.
 *
 * - analyzeFormScreenshot - A function that analyzes a form screenshot to detect fields.
 * - AnalyzeFormScreenshotInput - The input type for the analyzeFormScreenshot function.
 * - AnalyzeFormScreenshotOutput - The return type for the analyzeFormScreenshot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {dataTypes} from '@/lib/schemas';

const validDataTypes = dataTypes.map(d => `"${d}"`).join(', ');

const AnalyzeFormScreenshotInputSchema = z.object({
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot of a form, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFormScreenshotInput = z.infer<typeof AnalyzeFormScreenshotInputSchema>;


const AnalyzeFormScreenshotOutputSchema = z.object({
  fields: z.array(z.object({
    fieldName: z.string().describe('The machine-readable name for the field (e.g., "firstName").'),
    dataType: z.enum(dataTypes).describe('The detected data type for the field.'),
  })).describe('An array of detected form fields.')
});

export type AnalyzeFormScreenshotOutput = z.infer<typeof AnalyzeFormScreenshotOutputSchema>;

export async function analyzeFormScreenshot(input: AnalyzeFormScreenshotInput): Promise<AnalyzeFormScreenshotOutput> {
  return analyzeFormScreenshotFlow(input);
}

const analyzeFormScreenshotPrompt = ai.definePrompt({
  name: 'analyzeFormScreenshotPrompt',
  input: {schema: AnalyzeFormScreenshotInputSchema},
  output: {schema: AnalyzeFormScreenshotOutputSchema},
  prompt: `You are an expert UI/UX analyst specializing in form design. Your task is to analyze the provided screenshot of a web form and extract its field structure, even if the form has a non-standard or dynamic layout.

Analyze the screenshot and identify all user input fields. This includes text inputs, email fields, password fields, text areas, number inputs, select dropdowns, checkboxes, and radio buttons.

**Important considerations for analysis:**
- **Flexible Label Association:** Labels may not be directly next to their inputs. They could be above, below, or even placeholder text within the input field itself.
- **Visual Cues:** Pay attention to icons or visual cues next to fields that suggest their purpose (e.g., a calendar icon for a date field, a user icon for a name field).
- **Comprehensive Scan:** Scan the entire image for anything that looks like a user can enter data into it.

For each field you identify, provide the following:
1.  \`fieldName\`: A concise, machine-readable name for the field in camelCase or snake_case (e.g., 'firstName', 'user_email'). Infer this from the field's visible label, placeholder text, or surrounding context.
2.  \`dataType\`: The most appropriate data type for the field. You MUST choose one of the following valid options:
[${validDataTypes}]

Here are some examples of how to map labels to data types:
- A field labeled "First Name" should have \`fieldName: 'firstName'\` and \`dataType: 'FirstName'\`.
- A field with placeholder text "Enter your email" should have \`fieldName: 'email'\` and \`dataType: 'EmailAddress'\`.
- A field labeled "Country" should have \`fieldName: 'country'\` and \`dataType: 'Country'\`.
- A field labeled "Your message" in a large text box should have \`fieldName: 'yourMessage'\` and \`dataType: 'Paragraph'\`.

Return the result as a single JSON object with a "fields" array. Do not include any fields that are not present in the screenshot. If no form fields are found, return an empty "fields" array.

Image to analyze: {{media url=screenshotDataUri}}`,
});

const analyzeFormScreenshotFlow = ai.defineFlow(
  {
    name: 'analyzeFormScreenshotFlow',
    inputSchema: AnalyzeFormScreenshotInputSchema,
    outputSchema: AnalyzeFormScreenshotOutputSchema,
  },
  async input => {
    const {output} = await analyzeFormScreenshotPrompt(input);
    return output!;
  }
);
