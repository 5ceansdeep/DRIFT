import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';

@Module({
  imports: [PrismaModule, AuthModule, SongsModule],
})
export class AppModule {}
