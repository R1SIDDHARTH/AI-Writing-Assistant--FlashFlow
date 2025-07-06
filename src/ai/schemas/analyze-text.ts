/**
 * @fileOverview Schemas and types for the text analysis flow.
 */
import {z} from 'genkit';

export const AnalyzeTextInputSchema = z.object({
  text: z.string().describe('The text to be analyzed.'),
});
export type AnalyzeTextInput = z.infer<typeof AnalyzeTextInputSchema>;

export const SuggestionSchema = z.object({
  id: z.string().describe('A unique identifier for the suggestion.'),
  category: z
    .enum(['Grammar', 'Spelling', 'Punctuation', 'Clarity', 'Vocabulary', 'Word Choice'])
    .describe('The category of the suggestion.'),
  original: z.string().describe('The original text snippet that needs correction.'),
  suggestion: z
    .string()
    .describe('The suggested corrected text. For Vocabulary or Word Choice, this should be the primary suggestion.'),
  explanation: z.string().describe('An explanation for why the suggestion is made.'),
  alternatives: z
    .array(z.string())
    .optional()
    .describe(
      'A list of alternative suggestions, especially for vocabulary and word choice improvements.'
    ),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

export const AnalyzeTextOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('A list of suggestions to improve the text.'),
});
export type AnalyzeTextOutput = z.infer<typeof AnalyzeTextOutputSchema>;
