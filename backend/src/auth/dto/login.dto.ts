import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@drift.com' })
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
