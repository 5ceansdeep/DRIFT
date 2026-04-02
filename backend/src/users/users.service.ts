import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        coordX: true,
        coordY: true,
        coordZ: true,
        vectorUpdatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      vectorUpdatedAt: user.vectorUpdatedAt,
      coord: user.coordX !== null
        ? { x: user.coordX, y: user.coordY, z: user.coordZ }
        : null,
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (exists && exists.id !== userId) {
        throw new ConflictException('이미 사용 중인 이름입니다');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
      select: { id: true, email: true, username: true },
    });

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        coordX: true,
        coordY: true,
        coordZ: true,
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    return {
      id: user.id,
      username: user.username,
      coord: user.coordX !== null
        ? { x: user.coordX, y: user.coordY, z: user.coordZ }
        : null,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: '비밀번호가 변경되었습니다' };
  }

  async deleteMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: '계정이 삭제되었습니다' };
  }

  async getUserSongs(userId: string) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new NotFoundException('유저를 찾을 수 없습니다');

    const userSongs = await this.prisma.userSong.findMany({
      where: { userId },
      include: { song: true },
      orderBy: { savedAt: 'desc' },
    });

    return userSongs.map((us) => ({
      id: us.id,
      savedAt: us.savedAt,
      source: us.source,
      song: {
        id: us.song.id,
        title: us.song.title,
        artist: us.song.artist,
        coverUrl: us.song.coverUrl,
      },
    }));
  }
}
