import { ProfileRepository } from './repository';
export class ProfileService {
  private readonly repo = new ProfileRepository();
}
