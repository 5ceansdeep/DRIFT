import { Injectable } from '@nestjs/common';

// Last.fm에서 자주 등장하는 태그를 그대로 벡터 차원으로 사용
const TAGS = [
  // 장르
  'rock', 'pop', 'electronic', 'hip-hop', 'indie', 'alternative', 'jazz',
  'classical', 'metal', 'punk', 'folk', 'country', 'blues', 'r&b', 'soul',
  'reggae', 'funk', 'dance', 'house', 'techno', 'trance', 'ambient',
  'k-pop', 'j-pop', 'latin',
  // 서브장르
  'indie rock', 'indie pop', 'alt-rock', 'synth-pop', 'post-punk',
  'dream pop', 'shoegaze', 'new wave', 'grunge', 'emo',
  'trap', 'rap', 'edm', 'dubstep', 'drum and bass',
  'disco', 'garage rock', 'psychedelic', 'progressive rock',
  'singer-songwriter', 'acoustic', 'ballad',
  // 무드/분위기
  'chill', 'sad', 'happy', 'energetic', 'romantic', 'dark',
  'melancholy', 'upbeat', 'aggressive', 'dreamy', 'atmospheric',
  'mellow', 'emotional', 'beautiful', 'fun', 'party',
  // 시대/스타일
  '80s', '90s', '00s', 'retro', 'modern', 'experimental', 'lo-fi',
  // 특성
  'female vocalists', 'male vocalists', 'instrumental',
  'love', 'summer', 'night',
  'korean', 'japanese', 'british', 'american',
];

// Last.fm 태그 표기 차이 정규화
const TAG_NORMALIZE: Record<string, string> = {
  'kpop': 'k-pop',
  'jpop': 'j-pop',
  'hiphop': 'hip-hop',
  'hip hop': 'hip-hop',
  'rnb': 'r&b',
  'r and b': 'r&b',
  'lo fi': 'lo-fi',
  'lofi': 'lo-fi',
  'synth pop': 'synth-pop',
  'synthpop': 'synth-pop',
  'alt rock': 'alt-rock',
  'alternative rock': 'alt-rock',
  'post punk': 'post-punk',
  'dream-pop': 'dream pop',
  'indie-rock': 'indie rock',
  'indie-pop': 'indie pop',
  'drum n bass': 'drum and bass',
  'dnb': 'drum and bass',
  'female vocals': 'female vocalists',
  'male vocals': 'male vocalists',
  'prog rock': 'progressive rock',
  'singer songwriter': 'singer-songwriter',
  'electronica': 'electronic',
  'chillout': 'chill',
  'chill out': 'chill',
  'melancholic': 'melancholy',
  "80's": '80s',
  "90's": '90s',
  "00's": '00s',
};

const TAG_INDEX = new Map(TAGS.map((tag, i) => [tag, i]));
const VECTOR_SIZE = TAGS.length;

// iTunes primaryGenreName → TAGS 매핑
const ITUNES_GENRE_MAP: Record<string, string[]> = {
  'k-pop': ['k-pop', 'korean'],
  'korean pop': ['k-pop', 'korean'],
  'j-pop': ['j-pop', 'japanese'],
  'pop': ['pop'],
  'rock': ['rock'],
  'alternative': ['alternative'],
  'alternative & punk': ['alternative', 'punk'],
  'hip-hop/rap': ['hip-hop', 'rap'],
  'hip-hop': ['hip-hop', 'rap'],
  'electronic': ['electronic'],
  'electronica/dance': ['electronic', 'dance'],
  'dance': ['dance'],
  'edm': ['edm', 'electronic'],
  'jazz': ['jazz'],
  'classical': ['classical'],
  'metal': ['metal'],
  'punk': ['punk'],
  'folk': ['folk'],
  'country': ['country'],
  'blues': ['blues'],
  'r&b/soul': ['r&b', 'soul'],
  'r&b': ['r&b'],
  'soul': ['soul'],
  'reggae': ['reggae'],
  'funk': ['funk'],
  'indie pop': ['indie pop', 'indie'],
  'indie rock': ['indie rock', 'indie'],
  'singer/songwriter': ['singer-songwriter'],
  'latin': ['latin'],
  'ambient': ['ambient'],
  'easy listening': ['chill', 'mellow'],
  'house': ['house', 'electronic'],
  'techno': ['techno', 'electronic'],
  'trance': ['trance', 'electronic'],
  'dubstep': ['dubstep', 'electronic'],
  'trap': ['trap', 'hip-hop'],
  'instrumental': ['instrumental'],
  'acoustic': ['acoustic'],
};

@Injectable()
export class SongVectorService {
  /**
   * Last.fm API로 곡의 태그를 가져옴
   */
  async fetchTags(title: string, artist: string): Promise<{ name: string; count: number }[]> {
    const apiKey = process.env.Lastfm_API_KEY;

    // 1차: track.getTopTags
    try {
      const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${apiKey}&format=json`;
      const trackRes = await fetch(trackUrl);
      const trackData = await trackRes.json();

      if (trackData.toptags?.tag?.length > 0) {
        return trackData.toptags.tag.map((t: any) => {
          const raw = t.name.toLowerCase().trim();
          return { name: TAG_NORMALIZE[raw] ?? raw, count: Number(t.count) };
        });
      }
    } catch {}

    // 2차: 트랙 태그 없으면 artist.getTopTags로 fallback
    try {
      const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json`;
      const artistRes = await fetch(artistUrl);
      const artistData = await artistRes.json();

      if (artistData.toptags?.tag?.length > 0) {
        return artistData.toptags.tag.map((t: any) => {
          const raw = t.name.toLowerCase().trim();
          return { name: TAG_NORMALIZE[raw] ?? raw, count: Number(t.count) };
        });
      }
    } catch {}

    // 3차: iTunes primaryGenreName 폴백
    try {
      return await this.fetchItunesGenreTags(title, artist);
    } catch {}

    return [];
  }

  /**
   * iTunes API에서 장르 조회 → TAGS 형식으로 변환
   */
  private async fetchItunesGenreTags(
    title: string,
    artist: string,
  ): Promise<{ name: string; count: number }[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=song&limit=5`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results?.length) return [];

    const genre = (data.results[0].primaryGenreName ?? '').toLowerCase().trim();
    const mapped = ITUNES_GENRE_MAP[genre] ?? [];

    return mapped.map((name) => ({ name, count: 100 }));
  }

  /**
   * Last.fm 태그 → song_vector 변환 (태그 이름 그대로 매칭)
   */
  tagsToVector(tags: { name: string; count: number }[]): number[] {
    const vector = new Array(VECTOR_SIZE).fill(0);

    if (tags.length === 0) return vector;

    const maxCount = Math.max(...tags.map((t) => t.count), 1);

    for (const tag of tags) {
      const index = TAG_INDEX.get(tag.name);

      if (index !== undefined) {
        const score = tag.count / maxCount;
        vector[index] = Math.max(vector[index], score);
      }
    }

    return vector;
  }

  /**
   * 곡 제목/아티스트 → song_vector 생성
   */
  async generateSongVector(title: string, artist: string): Promise<{ vector: number[]; tags: string[] }> {
    const tags = await this.fetchTags(title, artist);
    const vector = this.tagsToVector(tags);
    const tagNames = [...new Set(tags.map((t) => t.name))];

    return { vector, tags: tagNames };
  }
}
