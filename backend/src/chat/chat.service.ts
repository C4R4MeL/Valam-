import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NILA_SYSTEM_PROMPT, CHAT_CONFIG } from './chat.constants';
import { ChatHistoryItemDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — chat endpoint will return errors');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  /**
   * Send a message to Gemini with conversation history and system prompt.
   * Returns the model's response text.
   */
  async chat(message: string, history?: ChatHistoryItemDto[]): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new InternalServerErrorException(
        'Layanan chat belum dikonfigurasi. Silakan hubungi administrator.',
      );
    }

    try {
      // Sanitize input: strip HTML tags, collapse whitespace
      const sanitizedMessage = this.sanitizeInput(message);

      // Trim history to max allowed length
      const trimmedHistory = this.trimHistory(history);

      // Build Gemini model with system instruction
      const model = this.genAI.getGenerativeModel({
        model: CHAT_CONFIG.MODEL_NAME,
        systemInstruction: NILA_SYSTEM_PROMPT,
        generationConfig: {
          maxOutputTokens: CHAT_CONFIG.MAX_OUTPUT_TOKENS,
          temperature: CHAT_CONFIG.TEMPERATURE,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      });

      // Build conversation history for Gemini format
      const geminiHistory = trimmedHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.content }],
      }));

      // Start chat with history and send current message
      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(sanitizedMessage);
      const responseText = result.response.text();

      // Log for observability
      this.logger.log(
        `[Nila Chat] User: "${sanitizedMessage.substring(0, 80)}..." → Response: ${responseText.length} chars`,
      );

      return responseText;
    } catch (error: any) {
      this.logger.error(`[Nila Chat] Error: ${error.message}`, error.stack);

      // Provide user-friendly error messages
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
        throw new InternalServerErrorException(
          'Layanan chat sedang mengalami masalah konfigurasi. Silakan coba lagi nanti.',
        );
      }

      if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
        throw new InternalServerErrorException(
          'Layanan chat sedang sibuk. Silakan tunggu beberapa saat dan coba lagi.',
        );
      }

      if (error.message?.includes('SAFETY')) {
        return 'Maaf, saya tidak bisa menjawab pertanyaan tersebut. Silakan ajukan pertanyaan lain seputar platform Valam dan minyak nilam. 😊';
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
   */
  private trimHistory(history?: ChatHistoryItemDto[]): ChatHistoryItemDto[] {
    if (!history || history.length === 0) return [];

    // Take only the last N items
    const maxItems = CHAT_CONFIG.MAX_HISTORY_LENGTH;
    const trimmed = history.slice(-maxItems);

    // Ensure history starts with a 'user' message (Gemini requirement)
    if (trimmed.length > 0 && trimmed[0].role !== 'user') {
      trimmed.shift();
    }

    return trimmed;
  }
}
