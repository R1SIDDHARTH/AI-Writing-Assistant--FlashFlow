/**
 * @fileOverview Schemas and types for the text-to-speech flow.
 */
import {z} from 'genkit';

export const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voice: z.string().optional().describe('The desired voice for the speech synthesis. e.g., Algenib, Achernar'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
  media: z
    .string()
    .describe(
      "The synthesized audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
