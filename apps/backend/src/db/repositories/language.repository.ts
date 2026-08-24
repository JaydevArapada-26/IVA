import { asc, eq } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { languages } from '../schema/languages';

export class LanguageRepository extends BaseRepository<typeof languages> {
  constructor() {
    super(languages);
  }

  async listAll() {
    return this.db.select().from(this.table).orderBy(asc(this.table.sortOrder), asc(this.table.name));
  }

  async findById(id: string) {
    const rows = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    return rows[0];
  }

  async create(values: typeof languages.$inferInsert) {
    const [created] = await this.db.insert(languages).values(values).returning();
    if (!created) throw new Error('Failed to create language');
    return created;
  }

  async update(id: string, values: Partial<typeof languages.$inferInsert>) {
    const [updated] = await this.db
      .update(languages)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(languages.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(languages).where(eq(languages.id, id)).returning();
    return deleted;
  }
}
