import { SmsRepository } from './repository';
export class SmsService {
  private readonly repo = new SmsRepository();
}
