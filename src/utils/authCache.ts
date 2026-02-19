// src/utils/authCache.ts
interface AuthCache {
  roles: string[];
  affiliateId: number | null;
  timestamp: number;
  session: any;
}

class AuthCacheManager {
  private static readonly CACHE_KEY = 'ORG_auth_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getCache(): AuthCache | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data: AuthCache = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > this.CACHE_DURATION;
      
      return isExpired ? null : data;
    } catch {
      return null;
    }
  }

  static setCache(roles: string[], affiliateId: number | null, session: any): void {
    try {
      const cache: AuthCache = {
        roles,
        affiliateId,
        session,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache auth data:', error);
    }
  }

  static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear auth cache:', error);
    }
  }

  static shouldUseCache(session: any): boolean {
    const cache = this.getCache();
    return cache !== null && cache.session?.user?.id === session?.user?.id;
  }
}

export default AuthCacheManager;