import { AssistantService } from './service';
export class AssistantController {
  private readonly service = new AssistantService();
}
export const assistantController = new AssistantController();
