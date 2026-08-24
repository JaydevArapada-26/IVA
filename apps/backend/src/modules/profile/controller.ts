import { ProfileService } from './service';
export class ProfileController {
  private readonly service = new ProfileService();
}
export const profileController = new ProfileController();
