import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type { SchemeCategoryDto, SchemeDetailDto, SchemeRecommendationDto, SchemeSummaryDto } from 'shared/contracts/schemes';
import { SchemeRepository } from '../../../db/repositories/scheme.repository';
import { loadBackendEnv } from '../../../config';
import { getRankedSchemesPage } from '../../../lib/priority/engine';
import { err, ok, requireCitizenUserId } from '../../../lib/http-responses';

interface SchemeSummaryRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string | null;
  readonly summary: string;
  readonly officialUrl: string;
  readonly isUrgent: boolean;
  readonly isVerified: boolean;
  readonly publicationStatus: string;
  readonly publishedAt: Date | null;
  readonly categoryName: string | null;
  readonly categorySlug: string | null;
  readonly departmentName: string | null;
}

function toSummaryDto(row: SchemeSummaryRow): SchemeSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ...(row.shortTitle ? { shortTitle: row.shortTitle } : {}),
    summary: row.summary,
    category: row.categoryName ?? 'Uncategorized',
    categorySlug: row.categorySlug ?? '',
    department: row.departmentName ?? 'Unknown Department',
    officialUrl: row.officialUrl,
    isUrgent: row.isUrgent,
    isVerified: row.isVerified,
    publicationStatus: row.publicationStatus,
    ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
  };
}

export const getSchemesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/schemes',
  summary: 'Retrieve published citizen schemes list',
  handler: async (req) => {
    const search = req.query.get('search') ?? undefined;
    const categorySlug = req.query.get('categorySlug') ?? undefined;
    const department = req.query.get('department') ?? undefined;
    const limitParam = req.query.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;
    const cursorParam = req.query.get('cursor');
    const offset = cursorParam ? Math.max(parseInt(cursorParam, 10) || 0, 0) : 0;

    const repo = new SchemeRepository();
    const rows = await repo.listPublished({
      limit,
      offset,
      ...(search ? { search } : {}),
      ...(categorySlug ? { categorySlug } : {}),
      ...(department ? { department } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const data = page.map(toSummaryDto);

    const body = {
      status: 'ok',
      data,
      ...(hasMore ? { meta: { nextCursor: String(offset + limit) } } : {}),
    };

    return {
      statusCode: 200,
      body: body as unknown as JsonValue,
    };
  },
};

interface MiniMaxResponseBody {
  readonly choices?: ReadonlyArray<{
    readonly message?: { readonly content?: string };
  }>;
}

interface GeminiResponseBody {
  readonly candidates?: ReadonlyArray<{
    readonly content?: { readonly parts?: ReadonlyArray<{ readonly text?: string }> };
  }>;
}

const FALLBACK_MATCH_REASON = 'This scheme may be relevant to your profile.';

async function callMiniMaxOnce(apiKey: string, model: string, apiUrl: string, prompt: string): Promise<string | undefined> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as MiniMaxResponseBody;
    return json.choices?.[0]?.message?.content?.trim();
  } catch {
    return undefined;
  }
}

async function callGeminiOnce(apiKey: string, model: string, prompt: string): Promise<{ text: string | undefined; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) return { status: response.status, text: undefined };
  const json = (await response.json()) as GeminiResponseBody;
  return { status: response.status, text: json.candidates?.[0]?.content?.parts?.[0]?.text };
}

async function callGeminiWithRetry(apiKey: string, model: string, prompt: string): Promise<string | undefined> {
  try {
    let result = await callGeminiOnce(apiKey, model, prompt);
    if (result.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await callGeminiOnce(apiKey, model, prompt);
    }
    return result.text?.trim();
  } catch {
    return undefined;
  }
}

async function generateMatchReasonsBatch(
  env: ReturnType<typeof loadBackendEnv>,
  items: ReadonlyArray<{ title: string; summary: string }>,
): Promise<string[]> {
  const fallback = items.map(() => FALLBACK_MATCH_REASON);
  if (items.length === 0) return fallback;

  const listBlock = items.map((item, i) => `${i + 1}. "${item.title}" — ${item.summary}`).join('\n');
  const prompt =
    `You are IVA, an assistant for Indian government welfare schemes. Below is a numbered list of ` +
    `${items.length} schemes already selected and ranked for this citizen by a separate deterministic ` +
    `system — do not reorder, filter, or judge them. For EACH scheme, in the same order, write ONE ` +
    `short friendly sentence (max 20 words) explaining why it's a good match, using ONLY the ` +
    `description given — do not invent facts.\n\n${listBlock}\n\n` +
    `Reply with ONLY a JSON array of ${items.length} strings, one per scheme in order, no other text.`;

  let text: string | undefined;
  if (env.minimaxApiKey.length > 0) {
    text = await callMiniMaxOnce(env.minimaxApiKey, env.minimaxModel, env.minimaxApiUrl, prompt);
  }
  if (!text && env.geminiApiKey.length > 0) {
    text = await callGeminiWithRetry(env.geminiApiKey, env.geminiModel, prompt);
  }
  if (!text) return fallback;

  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    return items.map((_, i) => {
      const value = parsed[i];
      return typeof value === 'string' && value.trim().length > 0 ? value.trim() : FALLBACK_MATCH_REASON;
    });
  } catch {
    return fallback;
  }
}

export const getRecommendedSchemesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/schemes/recommended',
  summary:
    'Retrieve deterministically-ranked scheme matches for the signed-in citizen with AI match ' +
    'reasons. Accepts page (1-indexed, default 1), pageSize (default 8), and occupationOnly ' +
    '(restricts to schemes targeted at the citizen\'s occupation). Returns totalCount and hasNextPage.',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) return err('UNAUTHORIZED', 'A valid session token is required');

    const pageParam = req.query.get('page');
    const pageSizeParam = req.query.get('pageSize');
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const pageSize = pageSizeParam ? Math.min(Math.max(parseInt(pageSizeParam, 10) || 8, 1), 50) : 8;
    const occupationOnly = req.query.get('occupationOnly') === 'true';

    // getRankedSchemesPage handles caching: first call scores all schemes in one
    // bulk pass; subsequent page requests slice the cached list and hydrate only
    // pageSize rows from the DB.
    const { schemes: pageSchemes, totalCount, hasNextPage } = await getRankedSchemesPage(userId, page, pageSize, { occupationOnly });
    if (pageSchemes.length === 0) {
      return ok({ data: [], totalCount, hasNextPage: false } as unknown as JsonValue);
    }

    // Fetch display-only fields (summary, officialUrl, isVerified, categorySlug, department)
    // for just this page's schemes — one small query, never the full table.
    const repo = new SchemeRepository();
    const summaryRows = await repo.findSummariesByIds(pageSchemes.map((s) => s.schemeId));
    const summaryById = new Map(summaryRows.map((row) => [row.id, row]));

    const env = loadBackendEnv();
    const configured = env.minimaxApiKey.length > 0 || env.geminiApiKey.length > 0;
    const matchReasons = configured
      ? await generateMatchReasonsBatch(
          env,
          pageSchemes.map((s) => {
            const row = summaryById.get(s.schemeId);
            return { title: s.title, summary: row?.summary ?? '' };
          }),
        )
      : pageSchemes.map(() => FALLBACK_MATCH_REASON);


    const data: SchemeRecommendationDto[] = pageSchemes.flatMap((s, i) => {
      const row = summaryById.get(s.schemeId);
      if (!row) return [];
      return [
        {
          ...toSummaryDto(row),
          matchReason: matchReasons[i] ?? FALLBACK_MATCH_REASON,
          priorityScore: s.priorityScore,
        },
      ];
    });

    return ok({ data, totalCount, hasNextPage } as unknown as JsonValue);
  },
};

export const getSchemeCategoriesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/schemes/categories',
  summary: 'Retrieve scheme categories with published scheme counts',
  handler: async () => {
    const repo = new SchemeRepository();
    const rows = await repo.categoriesWithPublishedCounts();
    const data: SchemeCategoryDto[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      schemeCount: row.schemeCount,
    }));
    return ok(data as unknown as JsonValue);
  },
};

export const getSchemeBySlugRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/schemes/:slug',
  summary: 'Retrieve full scheme detail by slug',
  handler: async (req) => {
    const slug = req.params.slug;
    if (!slug) {
      return err('BAD_REQUEST', 'Scheme slug is required');
    }

    const repo = new SchemeRepository();
    const detail = await repo.findDetailBySlug(slug);
    if (!detail) {
      return err('NOT_FOUND', `No scheme found for slug "${slug}"`);
    }

    const { summary, scheme, benefits, documents, faqs, sources, tags } = detail;

    const dto: SchemeDetailDto = {
      ...toSummaryDto(summary),
      fullDescription: scheme.detailedDescription,
      ...(scheme.applicationUrl ? { applicationUrl: scheme.applicationUrl } : {}),
      benefits: benefits.map((b) => ({
        id: b.id,
        benefitType: b.benefitType,
        title: b.title,
        description: b.description,
        ...(b.valueText ? { valueText: b.valueText } : {}),
      })),
      documentsRequired: documents.map((d) => ({
        id: d.id,
        documentName: d.documentName,
        isMandatory: d.isMandatory,
      })),
      faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
      sources: sources.map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        sourceUrl: s.sourceUrl,
        ...(s.sourceTitle ? { sourceTitle: s.sourceTitle } : {}),
        verificationStatus: s.verificationStatus,
        ...(s.httpStatus !== null ? { httpStatus: s.httpStatus } : {}),
        ...(s.lastCheckedAt ? { lastCheckedAt: s.lastCheckedAt.toISOString() } : {}),
      })),
      tags: tags.length > 0 ? tags.map((t) => t.name) : (scheme.tags ?? []),
      ...(scheme.level ? { level: scheme.level } : {}),
      ...(scheme.state ? { state: scheme.state } : {}),
      ...(scheme.ministry ? { ministry: scheme.ministry } : {}),
      ...(scheme.beneficiaryType ? { beneficiaryType: scheme.beneficiaryType } : {}),
      ...(scheme.targetBeneficiaries ? { targetBeneficiaries: scheme.targetBeneficiaries } : {}),
      ...(scheme.benefitType ? { benefitType: scheme.benefitType } : {}),
      ...(scheme.categories && scheme.categories.length > 0 ? { categories: scheme.categories } : {}),
      ...(scheme.subCategories && scheme.subCategories.length > 0 ? { subCategories: scheme.subCategories } : {}),
      ...(scheme.benefits ? { benefitsText: scheme.benefits } : {}),
      ...(scheme.eligibility ? { eligibilityText: scheme.eligibility } : {}),
      ...(scheme.exclusions ? { exclusionsText: scheme.exclusions } : {}),
      ...(scheme.applicationMode ? { applicationMode: scheme.applicationMode } : {}),
      ...(scheme.applicationProcess ? { applicationProcess: scheme.applicationProcess } : {}),
      ...(scheme.documentsRequired ? { documentsRequiredText: scheme.documentsRequired } : {}),
      ...(scheme.references ? { referencesText: scheme.references } : {}),
      ...(scheme.schemeOpenDate ? { schemeOpenDate: new Date(scheme.schemeOpenDate).toISOString() } : {}),
      ...(scheme.schemeCloseDate ? { schemeCloseDate: new Date(scheme.schemeCloseDate).toISOString() } : {}),
      dbtScheme: scheme.dbtScheme,
    };

    return ok(dto as unknown as JsonValue);
  },
};
