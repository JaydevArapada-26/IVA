import { db } from '../connection';

export class BaseRepository<TTable extends Record<string, any>> {
  protected readonly db = db;

  constructor(protected readonly table: TTable) {}
}
