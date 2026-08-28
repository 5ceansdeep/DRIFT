import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'My Sector', description: '구역 이름' })
  @IsString()
  name: string;

  @ApiProperty({ example: [-1.2, -0.5, -0.8], description: '바운딩 박스 최소 좌표 [x,y,z]' })
  @IsArray()
  @IsNumber({}, { each: true })
  boundsMin: number[];

  @ApiProperty({ example: [1.2, 0.5, 0.8], description: '바운딩 박스 최대 좌표 [x,y,z]' })
  @IsArray()
  @IsNumber({}, { each: true })
  boundsMax: number[];

  @ApiProperty({ example: ['song-id-1', 'song-id-2'], description: '구역에 담긴 곡 ID 목록' })
  @IsArray()
  @IsString({ each: true })
  trackIds: string[];
}
