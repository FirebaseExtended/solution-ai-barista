/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { genkit } from 'genkit/beta';
import { enableGoogleCloudTelemetry } from '@genkit-ai/google-cloud';
import { vertexAI } from '@genkit-ai/google-genai';

// Enable remote telemetry collection when running in production.
if (process.env.NODE_ENV == 'production') {
    console.log('[Production environment] Enabling Google Cloud Telemetry.');
    enableGoogleCloudTelemetry();
};

// Configure safety settings. Block all categories with low scores and above.
const geminiSafetySettings = [
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
    },
] as const;

export const ai = genkit({
    // Enable the Vertex AI plugin.
    plugins: [vertexAI({ location: 'us-central1', })],
    // Select a Gemini model and set the safety settings.
    model: vertexAI.model('gemini-2.5-flash').withConfig({
        safetySettings: [...geminiSafetySettings],
    }),
});