import type { LoginResponseDto } from './dto';
import type { AuthSession } from './types';

export class AuthMapper {
  static toLoginResponse(session: AuthSession, token: string): LoginResponseDto {
    return {
      token,
      userId: session.userId,
    };
  }
}
