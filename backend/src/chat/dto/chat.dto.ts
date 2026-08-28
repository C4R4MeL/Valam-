import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'model'], description: 'Role of the message sender' })
  @IsString()
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'User message to send to Nila', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ description: 'Previous conversation history (max 10 items)', type: [ChatHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
