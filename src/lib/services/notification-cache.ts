interface CachedNotificationsResponse {
  timestamp: number;
  data: unknown;
}

export const notificationsCache = new Map<
  string,
  CachedNotificationsResponse
>();

export function invalidateUserNotificationsCache(userId?: bigint | string) {
  if (userId) {
    for (const key of notificationsCache.keys()) {
      if (key.startsWith(userId.toString())) {
        notificationsCache.delete(key);
      }
    }
  } else {
    notificationsCache.clear();
  }
}
