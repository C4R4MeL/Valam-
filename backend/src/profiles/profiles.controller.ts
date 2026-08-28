import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.profilesService.getProfile(req.user.userId);
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.updateProfile(req.user.userId, updateProfileDto);
  }
}
