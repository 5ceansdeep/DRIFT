import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PCA } from 'ml-pca';
import * as fs from 'fs';
import * as path from 'path';

interface PcaModel {
  means: number[];
  components: number[][];
  fittedAt: string;
}

const MODEL_PATH = path.join(process.cwd(), 'pca_model.json');

/** 동일 좌표 곡 분리용 미세 오프셋 (±0.001 범위) */
const jitter = () => (Math.random() - 0.5) * 0.002;

@Injectable()
export class PcaService {
  private readonly logger = new Logger(PcaService.name);
  private model: PcaModel | null = null;

  constructor(private prisma: PrismaService) {
    this.loadModel();
  }

  /**
   * 전체 곡 벡터로 PCA 학습 → 모델 저장 + 전체 곡/유저 좌표 업데이트
   * POST /universe/refit 또는 주기적 cron에서 호출
   */
  async fitAndUpdate(): Promise<{ songs: number; users: number }> {
    const allSongs = await this.prisma.song.findMany({
      select: { id: true, songVector: true },
    });

    const songs = allSongs.filter((s) => (s.songVector as number[]).length > 0);

    if (songs.length < 3) {
      this.logger.warn(`PCA 학습 불가: song_vector 있는 곡 ${songs.length}개`);
      return { songs: 0, users: 0 };
    }

    const vectors = songs.map((s) => s.songVector as number[]);

    const pca = new PCA(vectors);
    const ev = pca.getEigenvectors();
    const means = (pca.toJSON() as { means: number[] }).means;
    this.model = {
      means,
      components: [ev.getColumn(0), ev.getColumn(1), ev.getColumn(2)],
      fittedAt: new Date().toISOString(),
    };
    fs.writeFileSync(MODEL_PATH, JSON.stringify(this.model));
    this.logger.log(`PCA 모델 학습 완료: ${songs.length}개 곡`);

    // 전체 곡 좌표 업데이트 (동일 벡터 곡에 jitter 적용)
    const coordMap = new Map<string, { x: number; y: number; z: number }>();
    for (const song of songs) {
      const [x, y, z] = this.project(song.songVector as number[]);
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      let coord: { x: number; y: number; z: number };
      if (coordMap.has(key)) {
        coord = { x: x + jitter(), y: y + jitter(), z: z + jitter() };
      } else {
        coordMap.set(key, { x, y, z });
        coord = { x, y, z };
      }
      await this.prisma.song.update({
        where: { id: song.id },
        data: { coordX: coord.x, coordY: coord.y, coordZ: coord.z },
      });
    }

    // taste_vector 있는 유저 좌표 업데이트
    const allUsers = await this.prisma.user.findMany({
      select: { id: true, tasteVector: true },
    });
    const activeUsers = allUsers.filter((u) => (u.tasteVector as number[]).length > 0);
    for (const user of activeUsers) {
      const [x, y, z] = this.project(user.tasteVector as number[]);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { coordX: x, coordY: y, coordZ: z },
      });
    }

    this.logger.log(`좌표 업데이트 완료: 곡 ${songs.length}개, 유저 ${activeUsers.length}명`);
    return { songs: songs.length, users: activeUsers.length };
  }

  /**
   * 아카이브 시 호출 — 유저 taste_vector → 3D 좌표 업데이트
   * 모델이 없으면 스킵 (refit 전까지 좌표 없음)
   */
  async updateUserCoords(userId: string, tasteVector: number[]): Promise<void> {
    if (tasteVector.length === 0 || !this.model) return;
    const [x, y, z] = this.project(tasteVector);
    await this.prisma.user.update({
      where: { id: userId },
      data: { coordX: x, coordY: y, coordZ: z },
    });
  }

  /** 벡터 → [x, y, z] 투영 (모델 없으면 [0,0,0]) */
  project(vector: number[]): [number, number, number] {
    if (!this.model) return [0, 0, 0];
    const { means, components } = this.model;
    const centered = vector.map((v, i) => v - (means[i] ?? 0));
    return components.map((comp) =>
      comp.reduce((sum, c, i) => sum + c * (centered[i] ?? 0), 0),
    ) as [number, number, number];
  }

  private loadModel(): void {
    if (fs.existsSync(MODEL_PATH)) {
      this.model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
      this.logger.log(`PCA 모델 로드 완료 (학습일: ${this.model!.fittedAt})`);
    } else {
      this.logger.warn('PCA 모델 파일 없음 — POST /universe/refit 실행 필요');
    }
  }
}
