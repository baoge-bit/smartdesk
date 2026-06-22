export function normalizeQuery(query: string): string {
  return query.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '');
}

export function containsChinese(query: string): boolean {
  return /[\u4e00-\u9fa5]/.test(query);
}

export function isPinyinLike(query: string): boolean {
  const normalized = normalizeQuery(query);
  return /^[a-z]+$/.test(normalized) && !containsChinese(query);
}