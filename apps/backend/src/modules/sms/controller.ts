import { SmsService } from './service';
export class SmsController {
  private readonly service = new SmsService();
}
export const smsController = new SmsController();
