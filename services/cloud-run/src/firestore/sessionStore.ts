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

import FirebaseFirestore, { Timestamp } from '@google-cloud/firestore';
import { SessionData, SessionStore } from 'genkit';


/**
 * @class FirestoreSessionstore
 * @classdesc Implements a SessionStore for Genkit, persisting session data in
 * Firestore.  Uses a document that is idenfied by the autogenerated session ID from genkit.
 * @template S The type of the session state.
 */
export class FirestoreSessionstore<S>
  implements SessionStore<S> {
  private firestore: FirebaseFirestore.Firestore;
  private collectionName = 'agentSessions';

  /**
   * Offset in the future in milliseconds when the saved record should expire and get deleted.
   */
  private readonly expirationOffset = 12 * 60 * 60 * 1000; // 12 hours.

  /**
   * Creates a new FirestoreSessionstore instance.
   * @constructor
   * @param {FirebaseFirestore.Firestore} firestore - The Firestore instance.
   */
  constructor(firestore: FirebaseFirestore.Firestore) {
    this.firestore = firestore;
  }

  /**
   * Retrieves session data from Firestore for the given session ID.
   * @async
   * @param {string} sessionId - The ID of the session to retrieve.
   * @return {Promise<SessionData<S> | undefined>} A Promise that resolves with
   * the session data, or undefined if no session data is found.
   */
  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    // Get the document reference to the data in Firestore
    const docRef = this.getDocRef(sessionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return undefined;
    }

    // Load the data.
    const data = doc.data();
    // Extract the session data that is stored in the 'genkit-session' key.
    const sessionString = data?.['genkit-session'];
    return JSON.parse(sessionString) as SessionData<S>;
  }

  /**
   * Checks if there is a session stored for this session ID.
   * @param sessionId The ID of the session to retrieve.
   * @returns True if there is a session for this ID, false otherwise.
   */
  async has(sessionId: string): Promise<boolean> {
    return (await this.get(sessionId)) != undefined;
  }

  private getDocRef(sessionId: string) {
    return this.firestore
      .collection(this.collectionName)
      .doc(sessionId);
  }

  /**
   * Saves session data to Firestore for the given session ID.
   * @async
   * @param {string} sessionId - The ID of the session to save.
   * @param {SessionData<S>} sessionData - The session data to save.
   * @return {Promise<void>}
   */
  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
    const docRef = this.getDocRef(sessionId);;
    await docRef.set({
      'genkit-session': JSON.stringify(sessionData),
      'expiresAt': Timestamp.fromMillis(new Date().getTime() + this.expirationOffset)
    });
  }

  /**
   * Clears a session from Firestore and deletes its data.
   * 
   * @param sessionID The ID of the session to clear
   */
  async clear(sessionId: string) {
    const docRef = this.getDocRef(sessionId);
    await docRef.delete();
  }
}
