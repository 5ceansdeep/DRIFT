"""
DRIFT - Last.fm 인기 차트 기반 곡 풀 수집 스크립트
chart.getTopTracks로 인기곡을 가져와 song_vector 생성 후 DB에 저장
"""

import os
import time
import uuid
import numpy as np
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

API_KEY = os.getenv('Lastfm_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

# ──────────────────────────────────────────
# song-vector.service.ts와 동일한 태그 차원 (75개)
# ──────────────────────────────────────────

TAGS = [
    # 장르
    'rock', 'pop', 'electronic', 'hip-hop', 'indie', 'alternative', 'jazz',
    'classical', 'metal', 'punk', 'folk', 'country', 'blues', 'r&b', 'soul',
    'reggae', 'funk', 'dance', 'house', 'techno', 'trance', 'ambient',
    'k-pop', 'j-pop', 'latin',
    # 서브장르
    'indie rock', 'indie pop', 'alt-rock', 'synth-pop', 'post-punk',
    'dream pop', 'shoegaze', 'new wave', 'grunge', 'emo',
    'trap', 'rap', 'edm', 'dubstep', 'drum and bass',
    'disco', 'garage rock', 'psychedelic', 'progressive rock',
    'singer-songwriter', 'acoustic', 'ballad',
    # 무드/분위기
    'chill', 'sad', 'happy', 'energetic', 'romantic', 'dark',
    'melancholy', 'upbeat', 'aggressive', 'dreamy', 'atmospheric',
    'mellow', 'emotional', 'beautiful', 'fun', 'party',
    # 시대/스타일
    '80s', '90s', '00s', 'retro', 'modern', 'experimental', 'lo-fi',
    # 특성
    'female vocalists', 'male vocalists', 'instrumental',
    'love', 'summer', 'night',
    'korean', 'japanese', 'british', 'american',
]

TAG_NORMALIZE = {
    'kpop': 'k-pop', 'jpop': 'j-pop',
    'hiphop': 'hip-hop', 'hip hop': 'hip-hop',
    'rnb': 'r&b', 'r and b': 'r&b',
    'lo fi': 'lo-fi', 'lofi': 'lo-fi',
    'synth pop': 'synth-pop', 'synthpop': 'synth-pop',
    'alt rock': 'alt-rock', 'alternative rock': 'alt-rock',
    'post punk': 'post-punk', 'dream-pop': 'dream pop',
    'indie-rock': 'indie rock', 'indie-pop': 'indie pop',
    'drum n bass': 'drum and bass', 'dnb': 'drum and bass',
    'female vocals': 'female vocalists', 'male vocals': 'male vocalists',
    'prog rock': 'progressive rock', 'singer songwriter': 'singer-songwriter',
    'electronica': 'electronic', 'chillout': 'chill', 'chill out': 'chill',
    'melancholic': 'melancholy', "80's": '80s', "90's": '90s', "00's": '00s',
}

TAG_INDEX = {tag: i for i, tag in enumerate(TAGS)}


def normalize_tag(raw):
    return TAG_NORMALIZE.get(raw, raw)


def fetch_top_tracks(page=1, limit=50):
    """Last.fm 글로벌 인기 차트 조회"""
    url = (
        f'https://ws.audioscrobbler.com/2.0/'
        f'?method=chart.getTopTracks&api_key={API_KEY}&format=json&page={page}&limit={limit}'
    )
    res = requests.get(url, timeout=10)
    data = res.json()
    return data.get('tracks', {}).get('track', [])


def fetch_tags(artist, title):
    """track.getTopTags → 없으면 artist.getTopTags fallback"""
    try:
        url = (
            f'https://ws.audioscrobbler.com/2.0/'
            f'?method=track.getTopTags&artist={requests.utils.quote(artist)}'
            f'&track={requests.utils.quote(title)}&api_key={API_KEY}&format=json'
        )
        data = requests.get(url, timeout=10).json()
        tags = data.get('toptags', {}).get('tag', [])
        if tags:
            return [{'name': normalize_tag(t['name'].lower().strip()), 'count': int(t['count'])} for t in tags]
    except Exception:
        pass

    try:
        url = (
            f'https://ws.audioscrobbler.com/2.0/'
            f'?method=artist.getTopTags&artist={requests.utils.quote(artist)}'
            f'&api_key={API_KEY}&format=json'
        )
        data = requests.get(url, timeout=10).json()
        tags = data.get('toptags', {}).get('tag', [])
        if tags:
            return [{'name': normalize_tag(t['name'].lower().strip()), 'count': int(t['count'])} for t in tags]
    except Exception:
        pass

    return []


def tags_to_vector(tags):
    """태그 리스트 → 75차원 벡터"""
    vector = [0.0] * len(TAGS)
    if not tags:
        return vector
    max_count = max((t['count'] for t in tags), default=1) or 1
    for tag in tags:
        idx = TAG_INDEX.get(tag['name'])
        if idx is not None:
            score = tag['count'] / max_count
            vector[idx] = max(vector[idx], score)
    return vector


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def song_exists(conn, title, artist):
    cur = conn.cursor()
    cur.execute('SELECT id FROM songs WHERE title = %s AND artist = %s', (title, artist))
    row = cur.fetchone()
    cur.close()
    return row is not None


def insert_song(conn, title, artist, genre_tags, song_vector):
    cur = conn.cursor()
    cur.execute(
        '''
        INSERT INTO songs (id, title, artist, genre_tags, song_vector, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT DO NOTHING
        ''',
        (str(uuid.uuid4()), title, artist, genre_tags, song_vector),
    )
    cur.close()


def main():
    conn = get_connection()

    total_pages = 5   # 50곡 × 5페이지 = 최대 250곡
    saved = 0
    skipped = 0

    for page in range(1, total_pages + 1):
        tracks = fetch_top_tracks(page=page, limit=50)
        print(f'\n[페이지 {page}] {len(tracks)}곡 조회')

        for track in tracks:
            title = track.get('name', '').strip()
            artist = track.get('artist', {}).get('name', '').strip()

            if not title or not artist:
                continue

            if song_exists(conn, title, artist):
                skipped += 1
                continue

            tags = fetch_tags(artist, title)
            vector = tags_to_vector(tags)
            genre_tags = [t['name'] for t in tags[:10]]

            insert_song(conn, title, artist, genre_tags, vector)
            saved += 1
            print(f'  저장: {artist} - {title} (태그 {len(genre_tags)}개)')

            time.sleep(0.25)  # Last.fm API rate limit 대비

    conn.commit()
    conn.close()
    print(f'\n완료: {saved}곡 저장, {skipped}곡 스킵 (이미 존재)')


if __name__ == '__main__':
    main()
