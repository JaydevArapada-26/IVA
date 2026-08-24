import { SchemesService } from './service';
export class SchemesController {
  private readonly service = new SchemesService();
}
export const schemesController = new SchemesController();
