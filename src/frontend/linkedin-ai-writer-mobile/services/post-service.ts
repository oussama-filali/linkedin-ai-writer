import { request } from './api-client';

export type PostStatus = 'draft' | 'published' | 'blocked';
export type FactCheckStatus = 'pending' | 'passed' | 'flagged';

export interface FactCheckClaim {
  text: string;
  reason?: string;
  confidenceScore?: number;
  [key: string]: unknown;
}

export interface FactCheckResult {
  safe: boolean;
  warnings?: string[];
  recommendations?: string[];
  analysis?: {
    summary?: string;
    riskLevel?: string;
    needsVerification?: boolean;
    claims?: FactCheckClaim[];
    hashtags?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GeneratePostPayload {
  resume: string;
  objectif: string;
  ton: string;
  sujet?: string;
  userId?: string;
  meta?: {
    audience?: string;
    sector?: string;
    domain?: string;
    autoPublish?: boolean;
    notifyBefore?: boolean;
    slot?: string | null;
  };
}

interface GeneratePostApiResponse {
  id: number;
  post: string;
  factCheck: FactCheckResult | null;
  createdAt: string;
}

export interface HistoryRow {
  id: number;
  user_id: number | null;
  resume: string;
  objectif: string;
  ton: string;
  sujet: string | null;
  generated_post: string;
  improved_post: string | null;
  improvement_feedback: string | null;
  fact_check_result: FactCheckResult | null;
  is_safe: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface PostListItem {
  id: string;
  title: string;
  tone: string;
  status: PostStatus;
  createdAt: string;
  factCheckStatus: FactCheckStatus;
  summary: string;
  body: string;
  resume: string;
  objectif: string;
  sujet?: string | null;
  factCheck?: FactCheckResult | null;
}

export interface PostDetail {
  id: string;
  title: string;
  summary: string;
  body: string;
  tone: string;
  createdAt?: string;
  factCheck?: FactCheckResult | null;
  insights?: string[];
  hashtags?: string[];
  meta?: GeneratePostPayload['meta'];
}

export async function fetchPostsHistory(
  params?: { userId?: string; limit?: number; offset?: number },
  token?: string | null
) {
  const queryParts: string[] = [];
  if (params?.userId) queryParts.push(`userId=${encodeURIComponent(params.userId)}`);
  if (typeof params?.limit === 'number') queryParts.push(`limit=${params.limit}`);
  if (typeof params?.offset === 'number') queryParts.push(`offset=${params.offset}`);
  const query = queryParts.length ? `?${queryParts.join('&')}` : '';

  const rows = await request<HistoryRow[]>(`/posts/history${query}`, { token });
  return rows.map(mapHistoryRowToListItem);
}

export async function fetchPostById(id: string, token?: string | null) {
  const row = await request<HistoryRow>(`/posts/${id}`, { token });
  return mapHistoryRowToDetail(row);
}

export async function generatePost(payload: GeneratePostPayload, token?: string | null) {
  const body = {
    resume: payload.resume,
    objectif: payload.objectif,
    ton: payload.ton,
    sujet: payload.sujet,
    userId: payload.userId,
  };

  const response = await request<GeneratePostApiResponse>('/posts/generate', {
    method: 'POST',
    body,
    token,
  });

  return mapGeneratedPostToDetail(response, payload);
}

export async function improvePost(
  postId: string,
  feedback: string,
  token?: string | null
) {
  return request<{ post: string; factCheck: FactCheckResult | null }>('/posts/improve', {
    method: 'POST',
    body: { postId, feedback },
    token,
  });
}

export async function factCheckContent(content: string, token?: string | null) {
  return request<{ original: string; factCheck: FactCheckResult; improved?: string }>('/posts/check', {
    method: 'POST',
    body: { content },
    token,
  });
}

export function historyItemToDetail(item: PostListItem): PostDetail {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    body: item.body,
    tone: item.tone,
    createdAt: item.createdAt,
    factCheck: item.factCheck,
    insights: extractInsights(item.factCheck),
    hashtags: extractHashtags(item.factCheck),
  };
}

function mapHistoryRowToListItem(row: HistoryRow): PostListItem {
  const status: PostStatus = row.is_safe === false ? 'blocked' : 'published';
  const factCheckStatus: FactCheckStatus = row.fact_check_result
    ? row.fact_check_result.safe
      ? 'passed'
      : 'flagged'
    : 'pending';

  return {
    id: String(row.id),
    title: deriveTitle(row.sujet, row.generated_post),
    tone: row.ton,
    status,
    createdAt: row.created_at,
    factCheckStatus,
    summary: deriveSummary(row.objectif, row.generated_post),
    body: row.generated_post,
    resume: row.resume,
    objectif: row.objectif,
    sujet: row.sujet,
    factCheck: row.fact_check_result,
  };
}

function mapHistoryRowToDetail(row: HistoryRow): PostDetail {
  return historyItemToDetail(mapHistoryRowToListItem(row));
}

function mapGeneratedPostToDetail(
  response: GeneratePostApiResponse,
  payload: GeneratePostPayload
): PostDetail {
  return {
    id: String(response.id),
    title: deriveTitle(payload.sujet, response.post),
    summary: deriveSummary(payload.objectif, response.post),
    body: response.post,
    tone: payload.ton,
    createdAt: response.createdAt,
    factCheck: response.factCheck,
    insights: extractInsights(response.factCheck),
    hashtags: extractHashtags(response.factCheck),
    meta: payload.meta,
  };
}

function deriveTitle(sujet?: string | null, content?: string) {
  if (sujet?.trim()) {
    return sujet.trim();
  }
  if (content) {
    const firstSentence = content.split(/[.!?]/)[0];
    return firstSentence.trim().slice(0, 80) || 'Post LinkedIn';
  }
  return 'Post LinkedIn';
}

function deriveSummary(objectif?: string, content?: string) {
  if (objectif?.trim()) {
    return objectif.trim();
  }
  if (content) {
    return content.slice(0, 120);
  }
  return 'Brouillon généré par IA LinkedIn.';
}

function extractInsights(factCheck?: FactCheckResult | null) {
  const claims = factCheck?.analysis?.claims;
  if (!claims || claims.length === 0) return undefined;
  return claims.map((claim) => claim.text).filter(Boolean);
}

function extractHashtags(factCheck?: FactCheckResult | null) {
  const hashtags = factCheck?.analysis?.hashtags;
  if (Array.isArray(hashtags) && hashtags.length > 0) {
    return hashtags;
  }
  return undefined;
}
