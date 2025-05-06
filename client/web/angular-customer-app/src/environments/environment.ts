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

declare const window: any;

export declare interface BootstrapData {
  firebase: {
    apiKey?: string;
    authDomain?: string,
    databaseURL?: string,
    projectId?: string,
    storageBucket?: string,
    messagingSenderId?: string,
    measurementId?: string,
    appId?: string,
  };
  geminiApiKey?: string;
  debugToken?: string;
  viewCodeLink?: string;
  viewCodeMessage?: string;
}

const bootstrapData = window['APP_TEMPLATE_BOOTSTRAP'] as BootstrapData;

if (!bootstrapData) {
  window.location.href = '/config.html';
}

export const environment = {
  firebase: {
      ...bootstrapData?.firebase,
  },
  geminiApiKey: bootstrapData?.geminiApiKey || '',
  viewCodeLink: bootstrapData?.viewCodeLink || '',
  viewCodeMessage: bootstrapData?.viewCodeMessage || '',
};

export const geminiModel = "gemini-2.5-flash-preview-04-17";