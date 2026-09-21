import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { NILA_SYSTEM_PROMPT, CHAT_CONFIG } from './chat.constants';
import { ChatHistoryItemDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.GROK_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('GROK_API_KEY is not set — chat endpoint will return errors');
    }
    // OpenAI SDK throws on empty apiKey — placeholder lets Nest boot without the key
    this.client = new OpenAI({
      apiKey: apiKey || 'missing-grok-api-key',
      baseURL: 'https://api.x.ai/v1',
    });
  }

  /**
   * Send a message to Grok (xAI) with conversation history and system prompt.
   * Returns the model's response text.
   */
  async chat(message: string, history?: ChatHistoryItemDto[]): Promise<string> {
    if (!process.env.GROK_API_KEY) {
      throw new InternalServerErrorException(
        'Layanan chat belum dikonfigurasi. Silakan hubungi administrator.',
      );
    }

    try {
      // Sanitize input: strip HTML tags, collapse whitespace
      const sanitizedMessage = this.sanitizeInput(message);

      // Trim history to max allowed length
      const trimmedHistory = this.trimHistory(history);

      // OpenAI-compatible messages: system + history + current user turn
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: NILA_SYSTEM_PROMPT },
        ...trimmedHistory.map((item) => ({
          role: item.role as 'user' | 'assistant',
          content: item.content,
        })),
        { role: 'user', content: sanitizedMessage },
      ];

      const response = await this.client.chat.completions.create({
        model: CHAT_CONFIG.MODEL_NAME,
        messages,
        max_tokens: CHAT_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: CHAT_CONFIG.TEMPERATURE,
      });

      const responseText = response.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from Grok API');
      }

      // Log for observability
      this.logger.log(
        `[Nila Chat] User: "${sanitizedMessage.substring(0, 80)}..." → Response: ${responseText.length} chars`,
      );

      return responseText;
    } catch (error: any) {
      const status: number | undefined =
        error?.status ?? error?.response?.status ?? error?.statusCode;
      const apiMessage =
        error?.error?.message || error?.message || 'Unknown error';

      this.logger.error(`[Nila Chat] Error (status=${status}): ${apiMessage}`, error?.stack);

      // OpenAI / xAI-style HTTP errors
      if (status === 401 || error?.code === 'invalid_api_key') {
        throw new InternalServerErrorException(
          'Layanan chat sedang mengalami masalah konfigurasi. Silakan coba lagi nanti.',
        );
      }

      if (status === 429) {
        throw new InternalServerErrorException(
          'Layanan chat sedang sibuk. Silakan tunggu beberapa saat dan coba lagi.',
        );
      }

      // 400 = bad request (invalid model, malformed body, etc.) — not a content refusal
      if (status === 400) {
        throw new InternalServerErrorException(
          'Layanan chat menolak permintaan. Periksa GROK_API_KEY dan GROK_MODEL di .env.',
        );
      }

      throw new InternalServerErrorException(
        'Maaf, sedang ada gangguan pada layanan chat. Silakan coba lagi sebentar.',
      );
    }
  }

  /**
   * Sanitize user input: strip HTML, collapse whitespace, trim.
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();
  }

  /**
   * Trim conversation history to the most recent exchanges.
   * Grok/xAI Chat Completions has no role-order constraint (unlike Gemini),
   * so we only enforce MAX_HISTORY_LENGTH.
   */
  private trimHistory(history?: ChatHistoryItemDto[]): ChatHistoryItemDto[] {
    if (!history || history.length === 0) return [];

    const maxItems = CHAT_CONFIG.MAX_HISTORY_LENGTH;
    return history.slice(-maxItems);
  }
}
