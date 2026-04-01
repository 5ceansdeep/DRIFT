import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { SatellitesModule } from './satellites/satellites.module';
import { UniverseModule } from './universe/universe.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule, SongsModule, SatellitesModule, UniverseModule],
})
export class AppModule {}
