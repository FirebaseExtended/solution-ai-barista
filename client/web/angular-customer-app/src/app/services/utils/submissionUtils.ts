const attributes = ['Amazing', 'Spectacular', 'Wonderful', 'Fantastic', 'Incredible', 'Outstanding', 'Exceptional', 'Marvelous', 'Terrific', 'Phenomenal'];
const animals = ['Aardvark', 'Badger', 'Capybara', 'Dingo', 'Emu', 'Ferret', 'Giraffe', 'Hippopotamus', 'Iguana', 'Jaguar', 'Kangaroo', 'Lion', 'Meerkat', 'Narwhal', 'Ostrich', 'Penguin', 'Quail', 'Rhinoceros', 'Snake', 'Tiger', 'Unicorn', 'Vaquita', 'Wallaby', 'Xenoceratops', 'Yak', 'Zebra'];

/**
 * Generate a random name consisting of an attribute and an animal. 
 * @returns Random name
 */
export function generateName(): string {
    const attribute = attributes[Math.floor(Math.random() * attributes.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${attribute} ${animal}`;
}