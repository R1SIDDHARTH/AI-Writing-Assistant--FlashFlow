'use server';

/**
 * @fileOverview A text-to-speech (TTS) AI agent.
 *
 * This file exports the following:
 * - textToSpeech - A function that handles the TTS process.
 *
 * The input and output types for this flow are defined in `@/ai/schemas/text-to-speech.ts`.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {
  TextToSpeechInput,
  TextToSpeechInputSchema,
  TextToSpeechOutput,
  TextToSpeechOutputSchema,
} from '@/ai/schemas/text-to-speech';
import wav from 'wav';
import {Buffer} from 'buffer';

export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: input.voice || 'Algenib'},
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('No media returned from TTS model.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    return {
      media: `data:audio/wav;base64,${wavData}`,
    };
  }
);
