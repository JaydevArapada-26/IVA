import { PriorityService } from './service';
export class PriorityController {
  private readonly service = new PriorityService();
}
export const priorityController = new PriorityController();
