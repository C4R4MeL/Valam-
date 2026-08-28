import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      // Auto-create profile if missing
      profile = await this.prisma.profile.create({
        data: {
          user_id: userId,
        },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Ensure profile exists
    await this.getProfile(userId);

    return this.prisma.profile.update({
      where: { user_id: userId },
      data: dto,
    });
  }
}
