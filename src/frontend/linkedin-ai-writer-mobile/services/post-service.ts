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

export interface ProfileSummary {
  /**
   * Type de profil anonymisé (étudiant, freelance, salarié, manager, reconversion, etc.)
   */
  role?: string;
  /**
   * Secteur ou domaine principal (sans nom d'entreprise spécifique)
   */
  sector?: string;
  /**
   * Niveau d'expérience approximatif (débutant, intermédiaire, confirmé...)
   */
  experienceLevel?: string;
  /**
   * Type d'audience principale (pairs, clients potentiels, recruteurs, etc.)
   */
  targetAudience?: string;
  /**
   * Préférences de style (sobre, direct, chaleureux, etc.)
   */
  preferredStyle?: string;
  /**
   * Résumé libre du contexte / parcours (texte saisi dans l'app)
   */
  summary?: string;
}

/** Type de post (entonnoir) tel qu'exposé par GET /api/posts/types */
export interface PostType {
  type: string;
  label: string;
  needsComment: boolean;
}

/** Source réelle attachée à une info factuelle du post */
export interface PostSource {
  claim: string;
  source: string;
  url: string;
  rating?: string;
}

export interface GeneratePostPayload {
  /**
   * Type de post choisi (storytelling | performance | reponse_commentaire | conseil).
   * Pilote l'entonnoir côté backend.
   */
  type: string;
  /** Résumé/contexte libre saisi par l'utilisateur (le "qui parle"). */
  resume: string;
  /** Ce que la personne veut dire (champ libre principal). */
  objectif: string;
  ton?: string;
  sujet?: string;
  userId?: string;
  /** Commentaire à répondre (uniquement pour type reponse_commentaire). */
  comment?: string;
  /** Profil structuré anonymisé envoyé à l'IA (RGPD-friendly). */
  profile?: ProfileSummary;
}

interface GeneratePostApiResponse {
  id: number;
  post: string;
  type: string;
  isAiGenerated: boolean;
  sources: PostSource[];
  hashtags: string[];
  hasUnsourcedClaims: boolean;
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
  post_type: string | null;
  is_ai_generated: boolean | null;
  sources: PostSource[] | null;
  hashtags: string[] | null;
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
  type?: string | null;
  sources?: PostSource[];
  hashtags?: string[];
  factCheck?: FactCheckResult | null;
}

export interface PostDetail {
  id: string;
  title: string;
  summary: string;
  body: string;
  tone: string;
  type?: string;
  isAiGenerated?: boolean;
  sources?: PostSource[];
  createdAt?: string;
  factCheck?: FactCheckResult | null;
  insights?: string[];
  hashtags?: string[];
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

export async function fetchPostTypes(token?: string | null) {
  return request<PostType[]>('/posts/types', { token });
}

export async function generatePost(payload: GeneratePostPayload, token?: string | null) {
  const body = {
    type: payload.type,
    resume: payload.resume,
    objectif: payload.objectif,
    ton: payload.ton,
    sujet: payload.sujet,
    comment: payload.comment,
    userId: payload.userId,
    profile: payload.profile,
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
    type: item.type ?? undefined,
    sources: item.sources ?? [],
    createdAt: item.createdAt,
    factCheck: item.factCheck,
    insights: extractInsights(item.factCheck),
    // Hashtags sauvegardés (sans le '#', l'affichage le rajoute).
    hashtags: (item.hashtags ?? []).map((h) => h.replace(/^#/, '')),
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
    type: row.post_type,
    sources: row.sources ?? [],
    hashtags: row.hashtags ?? [],
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
    tone: payload.ton ?? payload.type,
    type: response.type,
    isAiGenerated: response.isAiGenerated,
    sources: response.sources ?? [],
    createdAt: response.createdAt,
    factCheck: response.factCheck,
    insights: extractInsights(response.factCheck),
    // Hashtags : on retire le '#' (l'écran preview le rajoute à l'affichage).
    hashtags: (response.hashtags ?? []).map((h) => h.replace(/^#/, '')),
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
