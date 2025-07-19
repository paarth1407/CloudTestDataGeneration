'use server';

/**
 * AI flow that improves ambiguous field details (name & dataType).
 * It receives fields with tentative names and labels and returns better names plus a
 * concrete dataType selected from our allowed list.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { dataTypes } from '@/lib/schemas';

const AmbiguousFieldSchema = z.object({
  originalName: z.string(),
  label: z.string().optional(),
});

const RefineFieldDetailsInputSchema = z.object({
  fields: z.array(AmbiguousFieldSchema).min(1).max(50),
  url: z.string().optional(),
});
export type RefineFieldDetailsInput = z.infer<typeof RefineFieldDetailsInputSchema>;

const ImprovedFieldSchema = z.object({
  fieldName: z.string(),
  dataType: z.enum(dataTypes as [string, ...string[]]),
});

const RefineFieldDetailsOutputSchema = z.object({
  improved: z.array(ImprovedFieldSchema),
});
export type RefineFieldDetailsOutput = z.infer<typeof RefineFieldDetailsOutputSchema>;

export async function refineFieldDetails(input: RefineFieldDetailsInput): Promise<RefineFieldDetailsOutput> {
  return refineFieldDetailsFlow(input);
}

const refinePrompt = ai.definePrompt({
  name: 'refineFieldDetailsPrompt',
  input: { schema: RefineFieldDetailsInputSchema },
  output: { schema: RefineFieldDetailsOutputSchema },
  config: { temperature: 0, topP: 0 },
  prompt: `You are an expert QA engineer creating synthetic test-data schemas.
Given each ambiguous field with its tentative name and label, assign a clearer camelCase fieldName and select the most appropriate dataType from the following list:
${dataTypes.join(', ')}
If nothing fits, use 'Word'.
Return a JSON array called \'improved\' with objects {fieldName,dataType} in the same order as input.
Do NOT output anything else.`,
});

const refineFieldDetailsFlow = ai.defineFlow(
  {
    name: 'refineFieldDetailsFlow',
    inputSchema: RefineFieldDetailsInputSchema,
    outputSchema: RefineFieldDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await refinePrompt(input);
    return output!;
  }
);
