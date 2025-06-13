import { Content } from '@angular/fire/ai';

export class ChatHistory {
  messages: Content[];
  constructor() {
    this.messages = [];
  }

  addMessage(part: Content[]) {
    this.messages.push(...part);
  }

  getMessages(): Content[] {
    return this.messages;
  }

  setMessages(messages: Content[]): void {
    this.messages = messages;
  }
}
