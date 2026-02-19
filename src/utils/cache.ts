// src/utils/cache.ts
export const userRolesCache = new Map<string, { 
  roles: string[], 
  affiliate_id: number | null, 
  timestamp: number 
}>();