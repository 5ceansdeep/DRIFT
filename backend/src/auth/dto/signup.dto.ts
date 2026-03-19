import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@drift.com' })
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email: string;

  @ApiProperty({ example: 'stargazer' })
  @IsString()
  @MinLength(2, { message: '이름은 2자 이상이어야 합니다' })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;
}
