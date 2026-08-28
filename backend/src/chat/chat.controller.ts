import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat.dto';
import { CHAT_CONFIG } from './chat.constants';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: CHAT_CONFIG.RATE_LIMIT, ttl: CHAT_CONFIG.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Send a message to Nila AI assistant' })
  @ApiResponse({ status: 200, description: 'Successful response from Nila' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limited' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chat(@Body() chatRequestDto: ChatRequestDto) {
    const reply = await this.chatService.chat(
      chatRequestDto.message,
      chatRequestDto.history,
    );

    return {
      reply,
      timestamp: new Date().toISOString(),
    };
  }
}
