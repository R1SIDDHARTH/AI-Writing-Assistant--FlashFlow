'use server';

/**
 * @fileOverview A text rewriting AI agent that adjusts the tone of the text.
 *
 * This file exports the following:
 * - rewriteTextTone - A function that handles the text rewriting process.
 *
 * The input and output types for this flow are defined in `@/ai/schemas/rewrite-text-tone.ts`.
 */

import {ai} from '@/ai/genkit';
import {
  RewriteTextToneInput,
  RewriteTextToneInputSchema,
  RewriteTextToneOutput,
  RewriteTextToneOutputSchema,
} from '@/ai/schemas/rewrite-text-tone';

export async function rewriteTextTone(input: RewriteTextToneInput): Promise<RewriteTextToneOutput> {
  return rewriteTextToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteTextTonePrompt',
  input: {schema: RewriteTextToneInputSchema},
  output: {schema: RewriteTextToneOutputSchema},
  prompt: `You are an AI writing assistant. Your task is to rewrite the provided text based on the requested tone: {{{tone}}}.

- If the tone is 'Formal Email' or 'Informal Email', you MUST structure the output as a complete email. This includes a relevant subject line, an appropriate greeting, the main body content derived from the original text, and a suitable closing.
- For all other tones, just rewrite the text in that style, preserving the core message.

Original Text:
{{{text}}}
`,
});

const rewriteTextToneFlow = ai.defineFlow(
  {
    name: 'rewriteTextToneFlow',
    inputSchema: RewriteTextToneInputSchema,
    outputSchema: RewriteTextToneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
