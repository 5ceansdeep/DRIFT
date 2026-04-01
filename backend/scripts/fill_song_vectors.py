"""
DRIFT - song_vector 없는 곡 일괄 벡터 채우기 스크립트
saveSongsToPool로 저장된 곡 (song_vector 비어있음) 을 Last.fm 태그로 채움
"""

import os
import sys
import time
import psycopg2
import requests
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

API_KEY = os.getenv('Lastfm_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

TAGS = [
    'rock', 'pop', 'electronic', 'hip-hop', 'indie', 'alternative', 'jazz',
    'classical', 'metal', 'punk', 'folk', 'country', 'blues', 'r&b', 'soul',
    'reggae', 'funk', 'dance', 'house', 'techno', 'trance', 'ambient',
    'k-pop', 'j-pop', 'latin',
    'indie rock', 'indie pop', 'alt-rock', 'synth-pop', 'post-punk',
    'dream pop', 'shoegaze', 'new wave', 'grunge', 'emo',
    'trap', 'rap', 'edm', 'dubstep', 'drum and bass',
    'disco', 'garage rock', 'psychedelic', 'progressive rock',
    'singer-songwriter', 'acoustic', 'ballad',
    'chill', 'sad', 'happy', 'energetic', 'romantic', 'dark',
    'melancholy', 'upbeat', 'aggressive', 'dreamy', 'atmospheric',
    'mellow', 'emotional', 'beautiful', 'fun', 'party',
    '80s', '90s', '00s', 'retro', 'modern', 'experimental', 'lo-fi',
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


def fetch_tags(artist, title):
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


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # song_vector가 비어있는 곡 조회
    cur.execute("SELECT id, title, artist FROM songs WHERE song_vector = '{}'")
    songs = cur.fetchall()
    print(f'song_vector 없는 곡: {len(songs)}개')

    updated = 0
    skipped = 0

    for song_id, title, artist in songs:
        tags = fetch_tags(artist, title)
        vector = tags_to_vector(tags)
        genre_tags = [t['name'] for t in tags[:10]]

        cur.execute(
            'UPDATE songs SET song_vector = %s, genre_tags = %s, updated_at = NOW() WHERE id = %s',
            (vector, genre_tags, song_id),
        )

        if any(v > 0 for v in vector):
            updated += 1
            print(f'  완료: {artist} - {title} (태그 {len(genre_tags)}개)')
        else:
            skipped += 1
            print(f'  태그없음: {artist} - {title}')

        time.sleep(0.25)

    conn.commit()
    cur.close()
    conn.close()
    print(f'\n완료: {updated}개 벡터 생성, {skipped}개 태그 없음')


if __name__ == '__main__':
    main()
