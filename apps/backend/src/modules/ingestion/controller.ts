import { IngestionService } from './service';
export class IngestionController {
  private readonly service = new IngestionService();
}
export const ingestionController = new IngestionController();
