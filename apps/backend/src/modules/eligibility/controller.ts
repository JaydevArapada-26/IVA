import { EligibilityService } from './service';
export class EligibilityController {
  private readonly service = new EligibilityService();
}
export const eligibilityController = new EligibilityController();
