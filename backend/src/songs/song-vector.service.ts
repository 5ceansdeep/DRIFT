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

const TAG_INDEX = new Map(TAGS.map((tag, i) => [tag, i]));
const VECTOR_SIZE = TAGS.length;

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
        return trackData.toptags.tag.map((t: any) => ({
          name: t.name.toLowerCase().trim(),
          count: Number(t.count),
        }));
      }
    } catch {}

    // 2차: 트랙 태그 없으면 artist.getTopTags로 fallback
    try {
      const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json`;
      const artistRes = await fetch(artistUrl);
      const artistData = await artistRes.json();

      if (artistData.toptags?.tag?.length > 0) {
        return artistData.toptags.tag.map((t: any) => ({
          name: t.name.toLowerCase().trim(),
          count: Number(t.count),
        }));
      }
    } catch {}

    return [];
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
        vector[index] = tag.count / maxCount;
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
    const tagNames = tags.map((t) => t.name);

    return { vector, tags: tagNames };
  }
}
