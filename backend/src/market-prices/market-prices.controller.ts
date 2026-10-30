import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MarketPricesService } from './market-prices.service';

class UpdateMarketPriceDto {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(Number.MAX_SAFE_INTEGER / 100)
  price_per_kg: number;
}

class PriceHistoryQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;
}

@Controller('market-prices')
export class MarketPricesController {
  constructor(private readonly prices: MarketPricesService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  findAll() {
    return this.prices.findAll();
  }

  @Get(':grade/history')
  @Header('Cache-Control', 'no-store')
  history(@Param('grade') grade: string, @Query() query: PriceHistoryQuery) {
    return this.prices.history(grade, query.limit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMarketPriceDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.prices.update(id, body.price_per_kg, req.user.userId);
  }
}
