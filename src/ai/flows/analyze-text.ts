'use server';

/**
 * @fileOverview A text analysis AI agent for grammar, spelling, punctuation, style, and clarity.
 *
 * This file exports the following:
 * - analyzeText - A function that handles the text analysis process.
 *
 * The input and output types for this flow are defined in `@/ai/schemas/analyze-text.ts`.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeTextInput,
  AnalyzeTextInputSchema,
  AnalyzeTextOutput,
  AnalyzeTextOutputSchema,
} from '@/ai/schemas/analyze-text';
import { randomBytes } from 'crypto';

export async function analyzeText(input: AnalyzeTextInput): Promise<AnalyzeTextOutput> {
  return analyzeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTextPrompt',
  input: {schema: AnalyzeTextInputSchema},
  output: {schema: AnalyzeTextOutputSchema},
  prompt: `You are an expert AI writing assistant. Your task is to provide a comprehensive analysis of the following text, checking for Grammar, Spelling, Punctuation, Word Choice, Clarity, and Vocabulary. Return a list of suggestions in a structured JSON format.

For each issue you find, create a suggestion object with the following fields: 'id' (a unique string using a short random hash), 'category', 'original', 'suggestion', 'explanation', and an optional 'alternatives' field (a list of other good replacement options).

Analyze the following areas:
- **Grammar:** Identify and correct grammatical errors.
- **Spelling:** Identify and correct spelling mistakes.
- **Punctuation:** Identify and correct punctuation errors.
- **Word Choice:** Improve word choice for better effect by replacing words/phrases with ones that have the same meaning but a different tone or are more direct/precise. Provide the best option in the 'suggestion' field and other options in the 'alternatives' field. Examples: "make sure" -> "ensure", "very big" -> "enormous", "get" -> "obtain", "help" -> "assist".
- **Clarity:** Rephrase sentences to make them clearer and more direct.
- **Vocabulary:** Your primary goal for this category is to elevate the text's sophistication. Actively seek out simple, common words and replace them with more advanced, precise, or impressive alternatives. The focus is on making the writing sound more professional, academic, or eloquent. For each identified word or phrase, provide the best replacement in the 'suggestion' field and a list of other strong synonyms in the 'alternatives' field. Examples: "good" -> "excellent", "use" -> "utilize", "big expensive" -> "costly", "show" -> "demonstrate", "speed up" -> "accelerate".

Text to Analyze:
{{{text}}}
`,
});

const analyzeTextFlow = ai.defineFlow(
  {
    name: 'analyzeTextFlow',
    inputSchema: AnalyzeTextInputSchema,
    outputSchema: AnalyzeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output?.suggestions) {
      // The AI can sometimes return duplicate IDs. We'll generate our own to be safe.
      output.suggestions = output.suggestions.map(suggestion => ({
        ...suggestion,
        id: randomBytes(4).toString('hex'),
      }));
    }
    return output!;
  }
);
