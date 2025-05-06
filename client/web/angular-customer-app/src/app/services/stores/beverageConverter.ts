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

import { BeverageModel } from '../../../../../../../shared';
import { createBeverage } from '../agents/orderingAgent/orderTools';
import { DocumentData } from '@angular/fire/firestore';

/**
 * FirestoreDataConverter for Beverage objects. Used for conversion between
 *  Firestore data and Beverage instances.
 */
export const beverageConverter = {
  toFirestore(data: BeverageModel[]): DocumentData {
    return data.map((bev) => (
      { name: bev.name, modifiers: bev.modifiers }));

  },

  fromFirestoreDocumentData(data: DocumentData): BeverageModel[] {
    let beverages = (Array.isArray(data) ? data : []);
    beverages = beverages
      .map((bevData: { name: string; modifiers: string[]; }) => createBeverage(bevData.name, bevData.modifiers));
    return beverages;
  },
};
