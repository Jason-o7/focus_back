import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  password: string;

  @IsString()
  @Length(3, 30)
  username: string;
}
