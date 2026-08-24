import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type { SavedSchemeDto } from 'shared/contracts/schemes';
import { SavedSchemeRepository } from '../../../db/repositories/saved-scheme.repository';
import { SchemeRepository } from '../../../db/repositories/scheme.repository';
import { err, ok, parseJsonBody, requireCitizenUserId } from '../../../lib/http-responses';

function formatDate(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  try { return d.toISOString(); } catch { return undefined; }
}

/**
 * GET /schemes/saved
 * Returns all schemes the signed-in citizen has saved, most recently saved first.
 */
export const getSavedSchemesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/schemes/saved',
  summary: 'List all schemes saved by the signed-in citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) return err('UNAUTHORIZED', 'A valid session token is required');

    const repo = new SavedSchemeRepository();
    const rows = await repo.listForUser(userId);

    const data: SavedSchemeDto[] = rows.map((row) => ({
      savedSchemeId: row.savedSchemeId,
      schemeId: row.schemeId,
      schemeSlug: row.schemeSlug,
      schemeTitle: row.schemeTitle ?? '',
      schemeSummary: row.schemeSummary ?? '',
      schemeOfficialUrl: row.schemeOfficialUrl ?? '',
      savedAt: formatDate(row.savedAt) ?? new Date().toISOString(),
    }));

    return ok(data as unknown as JsonValue);
  },
};

/**
 * POST /schemes/saved
 * Body: { schemeId: string }
 * Saves a scheme for the signed-in citizen. Idempotent.
 */
export const saveSchemeRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/schemes/saved',
  summary: 'Save a scheme for the signed-in citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) return err('UNAUTHORIZED', 'A valid session token is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const schemeId = typeof parsed.value.schemeId === 'string' ? parsed.value.schemeId.trim() : '';
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    // Verify the scheme exists before saving
    const schemeRepo = new SchemeRepository();
    const [scheme] = await schemeRepo.findById(schemeId);
    if (!scheme) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);

    const savedRepo = new SavedSchemeRepository();
    await savedRepo.save(userId, schemeId);

    return ok({ saved: true } as unknown as JsonValue);
  },
};

/**
 * DELETE /schemes/saved/:schemeId
 * Removes a saved scheme for the signed-in citizen. Idempotent.
 */
export const unsaveSchemeRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/schemes/saved/:schemeId',
  summary: 'Remove a saved scheme for the signed-in citizen',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) return err('UNAUTHORIZED', 'A valid session token is required');

    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId path parameter is required');

    const savedRepo = new SavedSchemeRepository();
    await savedRepo.unsave(userId, schemeId);

    return ok({ unsaved: true } as unknown as JsonValue);
  },
};
