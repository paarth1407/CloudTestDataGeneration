'use server';

/**
 * @fileOverview AI-powered test data generation flow.
 *
 * - generateRealisticTestData - A function that generates realistic test data based on field names and data types.
 * - TestDataField - Represents a single field for test data generation with a name and data type.
 * - GenerateRealisticTestDataInput - The input type for the generateRealisticTestData function, allowing up to eight fields.
 * - GenerateRealisticTestDataOutput - The output type for the generateRealisticTestData function, providing the generated test data as a JSON string.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {dataTypes} from '@/lib/schemas';

const DataTypeSchema = z.enum(dataTypes);

const TestDataFieldSchema = z.object({
  fieldName: z.string().describe('The name of the field to generate data for.'),
  dataType: DataTypeSchema.describe('The type of data to generate for the field.'),
  emailDomain: z.string().optional().describe('A specific domain to use when generating email addresses.'),
  dateFormat: z.string().optional().describe('A specific format to use when generating dates (e.g., "YYYY-MM-DD").'),
});

export type TestDataField = z.infer<typeof TestDataFieldSchema>;

const GenerateRealisticTestDataInputSchema = z.object({
  fields: z
    .array(TestDataFieldSchema)
    .max(50)
    .describe(
      'An array of fields for which to generate test data.  The array must not exceed fifty entries.'
    ),
  numberOfRows: z.number().int().min(1).max(10000).describe('The number of data records to generate.'),
  locale: z.string().optional().describe('An optional locale (e.g., "Germany", "Japan") to generate region-specific data.'),
});

export type GenerateRealisticTestDataInput = z.infer<typeof GenerateRealisticTestDataInputSchema>;

const GenerateRealisticTestDataOutputSchema = z.object({
  generatedData: z
    .string()
    .describe('The generated test data as a JSON array string.')
    .optional(),
});

export type GenerateRealisticTestDataOutput = z.infer<typeof GenerateRealisticTestDataOutputSchema>;

export async function generateRealisticTestData(input: GenerateRealisticTestDataInput): Promise<GenerateRealisticTestDataOutput> {
  return generateRealisticTestDataFlow(input);
}

const generateRealisticTestDataPrompt = ai.definePrompt({
  name: 'generateRealisticTestDataPrompt',
  input: {schema: GenerateRealisticTestDataInputSchema},
  output: {schema: GenerateRealisticTestDataOutputSchema},
  prompt: `You are a professional test data generation engine. Your primary task is to generate realistic, cohesive, and contextually appropriate test data in JSON format based on a list of fields and the desired number of records.

You must generate exactly {{numberOfRows}} records.

{{#if locale}}
All generated data (including names, addresses, phone numbers, etc.) MUST be appropriate for the "{{locale}}" locale.
{{/if}}

The final output must be a single, valid JSON array string where each element is an object representing a record.

Here are the fields for each record:
{{#each fields}}
- Field Name: "{{this.fieldName}}", Data Type: "{{this.dataType}}"
{{#if this.emailDomain}}
  - Special Instruction: For this email field, all generated email addresses MUST end with "@{{this.emailDomain}}".
{{/if}}
{{#if this.dateFormat}}
  - Special Instruction: For this date field, all generated dates MUST be in the "{{this.dateFormat}}" format.
{{/if}}
{{/each}}

CRITICAL INSTRUCTIONS FOR DATA GENERATION:
1.  **Contextual Cohesion is Paramount**: The data within each record MUST be logically consistent. The values in different fields should relate to each other realistically.
    *   **Geographical Example**: If fields for City, State, and Country are requested, they must form a valid real-world location (e.g., City: "Paris", State: "Ile-de-France", Country: "France"). Do NOT mix them (e.g., City: "London", Country: "USA").
    *   **Personal Data Example**: If fields for "FullName" and "EmailAddress" are requested, the email address should plausibly be derived from the name (e.g., FullName: "Jane Doe", EmailAddress: "jane.doe@example.com").
    *   **Business Example**: If fields for "JobTitle" and "Department" are requested, they should be a logical pairing (e.g., JobTitle: "Software Engineer", Department: "Technology").

2.  **Strict Data Typing**: Adhere strictly to the requested data types for each field.

3.  **Exact Field Matching**: Do not add, omit, or rename any fields that were requested. The output object keys must exactly match the \`fieldName\` values provided.

4.  **JSON Output Only**: The output must be ONLY the JSON array string, with no other text, comments, or markdown formatting.

Example of a valid output for 2 rows with fields "fullName" and "emailAddress":
[
  {
    "fullName": "John Doe",
    "emailAddress": "john.doe@example.com"
  },
  {
    "fullName": "Jane Smith",
    "emailAddress": "jane.smith@example.com"
  }
]
`,
});

const generateRealisticTestDataFlow = ai.defineFlow(
  {
    name: 'generateRealisticTestDataFlow',
    inputSchema: GenerateRealisticTestDataInputSchema,
    outputSchema: GenerateRealisticTestDataOutputSchema,
  },
  async input => {
    const {output} = await generateRealisticTestDataPrompt(input);
    return output!;
  }
);
