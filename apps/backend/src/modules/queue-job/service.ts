import { QueueJobRepository } from './repository';
export class QueueJobService {
  private readonly repo = new QueueJobRepository();
}
