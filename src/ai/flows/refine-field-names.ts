'use server';

/**
 * AI-powered field name refinement flow.
 * Given raw/heuristic field names and optional labels, returns improved camelCase names
 * that are concise, meaningful, and machine-readable.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RawFieldSchema = z.object({
  original: z.string().describe('Raw field name as detected heuristically'),
  label: z.string().optional().describe('Visible label text for the field, if available'),
});

const RefineFieldNamesInputSchema = z.object({
  fields: z.array(RawFieldSchema).max(50),
  url: z.string().optional(),
});
export type RefineFieldNamesInput = z.infer<typeof RefineFieldNamesInputSchema>;

const RefineFieldNamesOutputSchema = z.object({
  refined: z.array(z.string()).describe(
    'Array of refined field names in the same order as the input. Each name must be camelCase, unique, and non-empty.'
  ),
});
export type RefineFieldNamesOutput = z.infer<typeof RefineFieldNamesOutputSchema>;

export async function refineFieldNames(input: RefineFieldNamesInput): Promise<RefineFieldNamesOutput> {
  return refineFieldNamesFlow(input);
}

const refinePrompt = ai.definePrompt({
  name: 'refineFieldNamesPrompt',
  input: { schema: RefineFieldNamesInputSchema },
  output: { schema: RefineFieldNamesOutputSchema },
  config: { temperature: 0, topP: 0 },
  prompt: `You are an expert software engineer. Your job is to improve a list of raw web-form field names into clean camelCase identifiers.

The form HTML was fetched from the following URL (may hint at its purpose): {{{url ?? ''}}}


Rules:
1. Each output name must be valid JavaScript identifier (letters, numbers, no spaces), camelCase.
2. Prefer meaningful words from the provided label when the raw name is ambiguous (e.g., "input_12").
3. Remove stop-words like "your", "enter", "please".
4. Ensure names are unique – append a numeric suffix only if absolutely necessary.
5. Keep them short but descriptive.

Return ONLY the JSON array of strings (no markdown).

Input field list:
{{{JSON.stringify(fields)}}}
`,
});

const refineFieldNamesFlow = ai.defineFlow(
  {
    name: 'refineFieldNamesFlow',
    inputSchema: RefineFieldNamesInputSchema,
    outputSchema: RefineFieldNamesOutputSchema,
  },
  async (input) => {
    const { output } = await refinePrompt(input);
    return output!;
  }
);
