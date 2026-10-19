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

import { ApplicationConfig, provideEnvironmentInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { environment } from "../environments/environment.development";
import { getAI, GoogleAIBackend } from 'firebase/ai';
import { getFirestore } from 'firebase/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient( withFetch() ),
    provideMarkdown(),
    provideAnimationsAsync(), 
    provideEnvironmentInitializer(() => {
      const app = initializeApp(environment.firebase);
      if (environment.firebase.recaptchaSiteKey) {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(
            environment.firebase.recaptchaSiteKey
          ),
          isTokenAutoRefreshEnabled: true,
        });
      }
      getStorage(app);
      getAuth(app);
      getAI(app, { backend: new GoogleAIBackend() });
      getFirestore(app);
    }),
  ]
};
