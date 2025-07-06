/**
 * @fileOverview Schemas and types for the text tone rewriting flow.
 */
import {z} from 'genkit';

export const RewriteTextToneInputSchema = z.object({
  text: z.string().describe('The text to be rewritten.'),
  tone: z.string().describe('The desired tone for the rewritten text (e.g., Casual, Formal, Professional, Friendly, Academic, Formal Email, Informal Email).'),
});
export type RewriteTextToneInput = z.infer<typeof RewriteTextToneInputSchema>;

export const RewriteTextToneOutputSchema = z.object({
  rewrittenText: z.string().describe('The text rewritten in the specified tone.'),
});
export type RewriteTextToneOutput = z.infer<typeof RewriteTextToneOutputSchema>;
