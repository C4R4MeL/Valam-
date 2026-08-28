import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MatchingService, type MatchingCriteriaDto } from './matching.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @Roles('buyer') // Only buyers can run smart matching
  async getMatches(@Body() criteria: MatchingCriteriaDto) {
    const matches = await this.matchingService.findMatches(criteria);
    return {
      message: 'Matches retrieved successfully',
      data: matches
    };
  }
}
