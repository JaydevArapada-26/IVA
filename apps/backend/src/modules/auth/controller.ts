import { AuthService } from './service';
import type { LoginRequestDto } from './dto';

export class AuthController {
  private readonly service = new AuthService();

  async login(req: { body: LoginRequestDto }) {
    const res = await this.service.login(req.body);
    return {
      statusCode: 200,
      body: {
        status: 'ok',
        data: res,
      },
    };
  }
}
export const authController = new AuthController();
