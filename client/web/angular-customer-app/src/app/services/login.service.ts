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

import { Injectable, computed, inject, signal } from '@angular/core';

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { AppCheck, getToken, onTokenChanged } from '@angular/fire/app-check';
import { Auth, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';
import { catchError, from, map } from 'rxjs';
import { ErrorResponse } from '../../../../../../shared/errorResponse';
import { environment } from '../../environments/environment';

// const clearSessionUrl = `${environment.backendUrl}/clearSession`;

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private auth = inject(Auth);
  // private appCheck = inject(AppCheck);
  
  idToken = signal<string>('');
  appCheckToken = signal<string>('');
  uid = signal<string>('');
  isLoggedIn = computed(() => this.idToken() != '') 
  
  constructor(private http: HttpClient) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // Store the user's uid
        this.uid.set(user.uid);

        // Get the user's ID token and send it to the backend to initialize the session.
        user.getIdToken().then((token) => {
          this.idToken.set(token)
        });

      } else {
        this.loginAnonymously()
      }
    });

    // onTokenChanged(this.appCheck, (token) => {      
    //   if (token) {
    //     this.appCheckToken.set(token.token)
    //   } else {
    //     this.getAppCheckToken()
    //   }
    // });  
  }

  // async getAppCheckToken() {
  //   try {
  //     this.appCheckToken.set((await getToken(this.appCheck)).token);
  //   } catch (err) {
  //     console.log('Error in getAppCheckToken', err);
  //   }
  // }
  
  getHttpOptions() {
    // this.getAppCheckToken();
     
    return { 
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.idToken()}`,
        'X-Firebase-AppCheck': this.appCheckToken(),
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Allow: '*'
      }),
      withCredentials: true
    };
  }

  async loginAnonymously() {
    console.log('Logging in anonymously');
    
    await signInAnonymously(this.auth)
    .catch((error: ErrorResponse) => {
      const errorCode = error.statusCode;
      const errorMessage = error.text;
      console.error('Failed to login anonymously: ', errorCode, errorMessage)
    });
  }

  clearSession() {

    console.log("new session!")
    return from (new Promise<string>((resolve, reject) => {
      resolve('')
    })).pipe(
      catchError((err) => {
        throw err.error;
      }),
      map((data: string): string => {        
        this.auth.signOut();  
        this.idToken.set('')
        return data;
      })
      );
    // return this.http.post<string>(clearSessionUrl, {}, this.getHttpOptions())
    //   .pipe(
    //     catchError((err: HttpErrorResponse) => {
    //       console.error('Failed LoginService clearSession: ', err)
    //       throw err.error;
    //     }),
    //     map((data: string): string => {        
    //       this.auth.signOut();  
    //       this.idToken.set('')
    //       return data;
    //     })
    //   );
  }
}