import { AdminService } from './service';
export class AdminController {
  private readonly service = new AdminService();
}
export const adminController = new AdminController();
