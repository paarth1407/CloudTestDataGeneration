'use server';

/**
 * @fileOverview AI-powered template file analysis flow.
 *
 * - analyzeTemplateFile - A function that analyzes CSV/Excel headers to detect field types.
 * - AnalyzeTemplateFileInput - The input type for the analyzeTemplateFile function.
 * - AnalyzeTemplateFileOutput - The return type for the analyzeTemplateFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {dataTypes} from '@/lib/schemas';

const validDataTypes = dataTypes.map(d => `"${d}"`).join(', ');

const AnalyzeTemplateFileInputSchema = z.object({
  headers: z.array(z.string()).describe("An array of column headers from a CSV or Excel file."),
});
export type AnalyzeTemplateFileInput = z.infer<typeof AnalyzeTemplateFileInputSchema>;

const AnalyzeTemplateFileOutputSchema = z.object({
  fields: z.array(z.object({
    fieldName: z.string().describe('The field name, derived directly from the header.'),
    dataType: z.enum(dataTypes).describe('The detected data type for the field.'),
  })).describe('An array of detected form fields based on the headers.')
});
export type AnalyzeTemplateFileOutput = z.infer<typeof AnalyzeTemplateFileOutputSchema>;

export async function analyzeTemplateFile(input: AnalyzeTemplateFileInput): Promise<AnalyzeTemplateFileOutput> {
  return analyzeTemplateFileFlow(input);
}

const analyzeTemplateFilePrompt = ai.definePrompt({
  name: 'analyzeTemplateFilePrompt',
  input: {schema: AnalyzeTemplateFileInputSchema},
  output: {schema: AnalyzeTemplateFileOutputSchema},
  prompt: `You are an expert data analyst. Your task is to analyze the provided list of column headers from a file and map each header to a suitable field name and data type for test data generation.

For each header in the input array, you must:
1.  Use the header string as the \`fieldName\`.
2.  Determine the most appropriate \`dataType\` for that field. You MUST choose one of the following valid options:
[${validDataTypes}]

Here are some examples of how to map headers to data types:
- A header "first_name" or "First Name" should map to \`dataType: 'FirstName'\`.
- A header "email" or "Email Address" should map to \`dataType: 'EmailAddress'\`.
- A header "country_code" should map to \`dataType: 'Country'\`.
- A header "price" or "amount" should map to \`dataType: 'Price'\`.
- A header "street_address" or "Address Line 1" should map to \`dataType: 'StreetAddress'\`.
- A header "hobbies" or "interests" should map to \`dataType: 'Word'\`.
- A header "zip" or "postal" should map to \`dataType: 'ZIP/Postal Code'\`.

Return the result as a single JSON object with a "fields" array. The order of fields in the output array should match the order of headers in the input array.

Headers to analyze:
{{#each headers}}
- {{this}}
{{/each}}
`,
});

const analyzeTemplateFileFlow = ai.defineFlow(
  {
    name: 'analyzeTemplateFileFlow',
    inputSchema: AnalyzeTemplateFileInputSchema,
    outputSchema: AnalyzeTemplateFileOutputSchema,
  },
  async input => {
    const {output} = await analyzeTemplateFilePrompt(input);
    return output!;
  }
);
