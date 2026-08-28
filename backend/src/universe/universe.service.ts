import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UniverseService {
  constructor(private prisma: PrismaService) {}

  async getStars(userId: string) {
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
        previewUrl: true,
        genreTags: true,
        coordX: true,
        coordY: true,
        coordZ: true,
        createdAt: true,
      },
    });

    // 이 유저가 실제로 저장한 곡이면 "그때 저장한 시각"을, 아니면(공유 카탈로그의
    // 남의 곡) 곡이 DB에 들어온 시각을 대신 써서 RedshiftEngine의 최근성 색/드리프트가
    // 전부 "방금"으로 뭉치지 않고 실제로 갈리게 한다.
    const myUserSongs = await this.prisma.userSong.findMany({
      where: { userId },
      select: { songId: true, savedAt: true },
    });
    const savedAtMap = new Map(myUserSongs.map((us) => [us.songId, us.savedAt]));

    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      coverUrl: s.coverUrl,
      previewUrl: s.previewUrl,
      genreTags: s.genreTags,
      coord: { x: s.coordX, y: s.coordY, z: s.coordZ },
      lastPlayedAt: (savedAtMap.get(s.id) ?? s.createdAt).toISOString(),
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
