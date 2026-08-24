import { QueueJobService } from './service';
export class QueueJobController {
  private readonly service = new QueueJobService();
}
export const queueJobController = new QueueJobController();
