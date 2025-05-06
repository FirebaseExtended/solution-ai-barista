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

/**
 * Object that describes the menu. Drinks are organized in a map of categories to a list of drinks.
 */
export const menuDrinks = {
    drinks: {
        'Coffee Drinks': ['Espresso', 'Americano', 'Cold Brew'],
        'Coffee Drinks with Milk': ['Latte', 'Cappuccino', 'Cortado', 'Macchiato', 'Mocha', 'Flat White'],
        'Tea Drinks': ['English Breakfast Tea', 'Green Tea', 'Earl Grey'],
        'Tea Drinks with Milk': ['Chai Latte', 'Matcha Latte', 'London Fog'],
        'Other Drinks': ['Steamer', 'Hot Chocolate']
    },
};

/**
 * Object that describes beverage modifiers. Modifiers are organized in a map of categories to a list of modifiers.
 */
export const menuModifiers = {
    modifiers: {
        'Milk options': ['Whole', '2%', 'Oat', 'Almond', 'Soy', '2% Lactose Free'],
        'Espresso shots': ['Single shot', 'Double shots', 'Triple shots', 'Quadruple shots'],
        'Caffeine': ['Decaf', 'Regular'],
        'Hot-Iced': ['Hot', 'Iced'],
        'Sweeteners': ['vanilla sweetener', 'hazelnut sweetener', 'caramel sauce', 'chocolate sauce', 'sugar free vanilla sweetener', 'sugar'],
        'Additions': ['whipped cream']
    }
};

/**
 * Object that describes the default modifiers for drinks.
 */
export const menuDefaultModifiers = {
    milk: 'Whole',
    shots: 'Double',
    caffeine: 'Regular',
    hotIced: 'Hot',
    sweeteners: ''
};

/**
 * List of all beverages in the menu.
 */
export const menuAllBeverages = Object.values(menuDrinks.drinks).flat();

/**
 * Text prompt that describes the menu, including all drinks and modifiers.
 */
export const menuText = `${JSON.stringify(menuDrinks)}

Modifiers:
${JSON.stringify(menuModifiers)}

Only one milk can be added to a drink.
Milk cannot be added to 'coffee drinks'.
One or more sweetners can be added to a drink.
One or more special requests can be added as modifiers: any reasonable modification that does not involve items not on the menu, for example: 'extra hot', 'one pump', 'half caff', 'extra foam', etc.

Default modifiers:
${JSON.stringify(menuDefaultModifiers)}

'dirty' means add a shot of espresso to a drink that doesn't usually have it, like 'Dirty Chai Latte'.
'Regular milk' is the same as 'whole milk'.
'Sweetened' means add some regular sugar, not a specific sweetener or sauce.`;
