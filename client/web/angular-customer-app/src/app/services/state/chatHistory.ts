import { Content } from '@angular/fire/ai';

export class ChatHistory {
  messages: Content[];
  constructor() {
    this.messages = [];
  }

  addMessage(message: Content): void {
    this.messages.push(message);
  }

  addMessages(part: Content[]) {
    this.messages.push(...part);
  }

  getMessages(): Content[] {
    return this.messages;
  }
}
