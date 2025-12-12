import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { environment } from '../../environments/environment';
import { SecretCardData } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class LlmService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openai.apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });
  }

  /**
   * Answers a yes/no question about a Magic card using OpenAI
   * @param question The user's question about the card
   * @param card The secret card data
   * @returns Promise<string> The LLM's answer (should be Yes/No)
   */
  async answerQuestion(question: string, card: SecretCardData): Promise<string> {
    // Prepare card data as a structured string
    const cardDataString = this.formatCardData(card);

    const systemPrompt = `You are a referee in a 20 questions game about Magic: The Gathering cards.

Your role:
- Answer the user's question with ONLY "Yes" or "No" based strictly on the card data provided
- Be precise and literal in your interpretation
- If the question is ambiguous or cannot be answered with yes/no, respond with "Please rephrase as a yes/no question"
- Do NOT reveal the card name under any circumstances
- Base your answer ONLY on the data provided, not on your general knowledge of Magic cards

Card Data:
${cardDataString}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.3, // Low temperature for consistent yes/no answers
        max_tokens: 50,
      });

      const answer = completion.choices[0]?.message?.content?.trim() || 'Unable to answer';
      return answer;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to get answer from LLM');
    }
  }

  /**
   * Formats card data into a readable string for the LLM
   */
  private formatCardData(card: SecretCardData): string {
    const lines: string[] = [];

    if (card.name) lines.push(`Name: ${card.name}`);
    if (card.mana_cost) lines.push(`Mana Cost: ${card.mana_cost}`);
    if (card.cmc !== undefined) lines.push(`Converted Mana Cost: ${card.cmc}`);
    if (card.type_line) lines.push(`Type: ${card.type_line}`);
    if (card.oracle_text) lines.push(`Oracle Text: ${card.oracle_text}`);
    if (card.power) lines.push(`Power: ${card.power}`);
    if (card.toughness) lines.push(`Toughness: ${card.toughness}`);
    if (card.loyalty) lines.push(`Loyalty: ${card.loyalty}`);
    if (card.colors && card.colors.length > 0) lines.push(`Colors: ${card.colors.join(', ')}`);
    if (card.color_identity && card.color_identity.length > 0)
      lines.push(`Color Identity: ${card.color_identity.join(', ')}`);
    if (card.rarity) lines.push(`Rarity: ${card.rarity}`);
    if (card.set_name) lines.push(`Set: ${card.set_name}`);
    if (card.artist) lines.push(`Artist: ${card.artist}`);

    return lines.join('\n');
  }
}
