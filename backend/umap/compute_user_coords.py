"""
DRIFT - UMAP 좌표 계산 스크립트
taste_vector(75D) → 3D 좌표로 차원 축소하여 DB 업데이트
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


def fetch_user_vectors(conn):
    """taste_vector가 있는 유저들 조회"""
    cur = conn.cursor()

    # 전체 유저 수 확인
    cur.execute("SELECT id, taste_vector FROM users")
    all_rows = cur.fetchall()
    print(f'전체 유저 수: {len(all_rows)}명')
    for row in all_rows:
        print(f'  id={row[0][:8]}... taste_vector 길이={len(row[1]) if row[1] else 0}')

    # taste_vector가 있는 유저만 필터
    rows = [(row[0], row[1]) for row in all_rows if row[1] and len(row[1]) > 0]
    cur.close()
    return rows


def update_user_coords(conn, user_id, x, y, z):
    """유저의 3D 좌표 업데이트"""
    cur = conn.cursor()
    cur.execute("""
        UPDATE users
        SET coord_x = %s, coord_y = %s, coord_z = %s
        WHERE id = %s
    """, (x, y, z, user_id))
    cur.close()


def compute_umap(vectors, metric='euclidean'):
    """UMAP 차원 축소 75D → 3D"""
    umap = UMAP(
        n_components=3,
        n_neighbors=min(15, len(vectors) - 1),  # 유저 수가 적을 때 대비
        min_dist=0.1,
        metric=metric,
        random_state=42,
    )
    return umap.fit_transform(np.array(vectors))


def main():
    conn = get_connection()

    # 1. DB에서 유저 벡터 조회
    user_data = fetch_user_vectors(conn)

    if len(user_data) < 3:
        print(f'유저 수가 {len(user_data)}명이라 UMAP 계산 불가 (최소 3명 필요) → 임시 랜덤 좌표 할당')
        for user_id, _ in user_data:
            x, y, z = float(np.random.uniform(-5, 5)), float(np.random.uniform(-5, 5)), float(np.random.uniform(-5, 5))
            update_user_coords(conn, user_id, x, y, z)
        conn.commit()
        conn.close()
        return

    user_ids = [u[0] for u in user_data]
    vectors = [u[1] for u in user_data]

    print(f'{len(user_ids)}명의 유저 벡터 로드 완료')

    # 2. UMAP 실행 (euclidean - 값 크기 차이 반영)
    coords = compute_umap(vectors, metric='euclidean')

    # --- cosine 버전 (패턴 기반 비교) ---
    # coords = compute_umap(vectors, metric='cosine')

    # 3. DB 업데이트
    for i, user_id in enumerate(user_ids):
        x, y, z = float(coords[i][0]), float(coords[i][1]), float(coords[i][2])
        update_user_coords(conn, user_id, x, y, z)

    conn.commit()
    conn.close()

    print(f'{len(user_ids)}명의 좌표 업데이트 완료')
    for i, user_id in enumerate(user_ids):
        print(f'  {user_id[:8]}... → ({coords[i][0]:.3f}, {coords[i][1]:.3f}, {coords[i][2]:.3f})')


if __name__ == '__main__':
    main()
