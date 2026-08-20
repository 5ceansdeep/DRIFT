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

/**
 * 동일 좌표(=동일 song_vector) 곡 분리용 오프셋 (±0.06 범위).
 * 원래 ±0.001이었는데, 프론트 Galaxy 뷰가 시각화를 위해 좌표에 60배
 * 스케일(POSITION_SCALE)을 곱하는 걸 감안하면 ±0.06까지 되어야 화면상
 * ±3.6 유닛(다른 클러스터 사이 최소 간격과 비슷한 수준)로 실제로 구분되어
 * 보인다. 태그가 적어 song_vector가 겹치는 곡이 많을수록(예: 빈 벡터,
 * 동일 장르 태그) 이 오프셋이 없으면 여러 곡이 별 하나로 겹쳐 보인다.
 */
const jitter = () => (Math.random() - 0.5) * 0.12;

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

    // 전체 곡 좌표 업데이트. song_vector가 같은(또는 거의 같은) 곡은 투영
    // 좌표도 같아지므로, 매번 무조건 작은 jitter를 더해 겹치지 않게 한다
    // (겹치는 좌표만 골라서 jitter하려면 전체 대상 O(n²) 근접 비교가 필요해
    // 배보다 배꼽이 큼 — 그냥 항상 살짝 흔드는 쪽이 간단하고 충분히 안전하다:
    // 실제로 다른 벡터인 곡들은 이미 jitter 폭보다 훨씬 멀리 떨어져 있다).
    for (const song of songs) {
      const [x, y, z] = this.project(song.songVector as number[]);
      await this.prisma.song.update({
        where: { id: song.id },
        data: { coordX: x + jitter(), coordY: y + jitter(), coordZ: z + jitter() },
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

  /**
   * 곡이 새로 생성/song_vector가 채워질 때(SongsService.archive) 호출 —
   * 다음 refit을 기다리지 않고 그 자리에서 즉시 좌표를 배정한다.
   * 모델이 아직 없으면(곡 3개 미만) 스킵 — 이후 refit이 처음 모델을
   * 학습하면서 이 곡의 좌표도 같이 채워준다.
   */
  async updateSongCoords(
    songId: string,
    songVector: number[],
  ): Promise<{ coordX: number; coordY: number; coordZ: number } | null> {
    if (songVector.length === 0 || !this.model) return null;
    const [x, y, z] = this.project(songVector);
    const coord = { coordX: x + jitter(), coordY: y + jitter(), coordZ: z + jitter() };
    await this.prisma.song.update({ where: { id: songId }, data: coord });
    return coord;
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
