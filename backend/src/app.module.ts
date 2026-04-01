import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { SatellitesModule } from './satellites/satellites.module';
import { UniverseModule } from './universe/universe.module';

@Module({
  imports: [PrismaModule, AuthModule, SongsModule, SatellitesModule, UniverseModule],
})
export class AppModule {}
