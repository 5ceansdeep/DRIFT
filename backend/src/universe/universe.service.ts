import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UniverseService {
  constructor(private prisma: PrismaService) {}

  async getStars() {
    const songs = await this.prisma.song.findMany({
      where: {
        coordX: { not: null },
        coordY: { not: null },
        coordZ: { not: null },
      },
      select: {
        id: true,
        title: true,
        artist: true,
        coverUrl: true,
        genreTags: true,
        coordX: true,
        coordY: true,
        coordZ: true,
      },
    });

    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      coverUrl: s.coverUrl,
      genreTags: s.genreTags,
      coord: { x: s.coordX, y: s.coordY, z: s.coordZ },
    }));
  }

  async getPlanets() {
    const users = await this.prisma.user.findMany({
      where: {
        coordX: { not: null },
        coordY: { not: null },
        coordZ: { not: null },
      },
      select: {
        id: true,
        username: true,
        coordX: true,
        coordY: true,
        coordZ: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      coord: { x: u.coordX, y: u.coordY, z: u.coordZ },
    }));
  }
}
