"""
DRIFT - 곡 UMAP 좌표 계산 스크립트
song_vector(75D) → 3D 좌표로 차원 축소하여 DB 업데이트 (별 위치)
"""

import os
import numpy as np
import psycopg2
from umap import UMAP
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def fetch_song_vectors(conn):
    """song_vector가 있는 곡들 조회"""
    cur = conn.cursor()
    cur.execute("SELECT id, song_vector FROM songs WHERE song_vector != '{}'")
    rows = cur.fetchall()
    cur.close()
    return [(row[0], row[1]) for row in rows]


def update_song_coords(conn, song_id, x, y, z):
    cur = conn.cursor()
    cur.execute(
        "UPDATE songs SET coord_x = %s, coord_y = %s, coord_z = %s WHERE id = %s",
        (x, y, z, song_id),
    )
    cur.close()


def compute_umap(vectors, metric='euclidean'):
    """UMAP 차원 축소 75D → 3D"""
    umap = UMAP(
        n_components=3,
        n_neighbors=min(15, len(vectors) - 1),
        min_dist=0.1,
        metric=metric,
        random_state=42,
    )
    return umap.fit_transform(np.array(vectors))


def main():
    conn = get_connection()

    song_data = fetch_song_vectors(conn)

    if len(song_data) < 2:
        print(f'[곡] {len(song_data)}개 — UMAP 계산 불가 (최소 2개 필요)')
        conn.close()
        return

    song_ids = [s[0] for s in song_data]
    vectors = [s[1] for s in song_data]

    print(f'[곡] {len(song_ids)}개 벡터 로드 완료')

    # euclidean: 값 크기 차이 반영
    coords = compute_umap(vectors, metric='euclidean')

    # --- cosine 버전 (패턴 기반 비교) ---
    # coords = compute_umap(vectors, metric='cosine')

    for i, song_id in enumerate(song_ids):
        update_song_coords(conn, song_id, float(coords[i][0]), float(coords[i][1]), float(coords[i][2]))

    conn.commit()
    conn.close()

    print(f'[곡] {len(song_ids)}개 좌표 업데이트 완료')
    for i, song_id in enumerate(song_ids):
        print(f'  {song_id[:8]}... → ({coords[i][0]:.3f}, {coords[i][1]:.3f}, {coords[i][2]:.3f})')


if __name__ == '__main__':
    main()
