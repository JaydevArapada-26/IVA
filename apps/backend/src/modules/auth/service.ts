import { AuthRepository } from './repository';
import type { LoginRequestDto, LoginResponseDto } from './dto';

export class AuthService {
  private readonly repo = new AuthRepository();

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    return {
      token: 'jwt-auth-session-token',
      userId: 'mock-user-id',
    };
  }
}
