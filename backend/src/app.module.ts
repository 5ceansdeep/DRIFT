import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { SatellitesModule } from './satellites/satellites.module';

@Module({
  imports: [PrismaModule, AuthModule, SongsModule, SatellitesModule],
})
export class AppModule {}
