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

export const environment = {
    production: false,
    // URL for the backend. Exposed through the Angular proxy server.
    backendUrl: "/api",
    firebaseConfig: {
        apiKey: "AIzaSyBQCxsyNXhVO8Ac-Z8-TbLXc3AnQ4fskH0",
        authDomain: "free-tier-1000.firebaseapp.com",
        projectId: "free-tier-1000",
        storageBucket: "free-tier-1000.firebasestorage.app",
        messagingSenderId: "255640991092",
        appId: "1:255640991092:web:8b41dc541ff50ed2fce821"
    },
    recaptchaEnterpriseKey: "",
};

export const geminiModel = "gemini-2.5-flash-preview-04-17";