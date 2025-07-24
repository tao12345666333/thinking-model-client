// Utility to clear PWA cache and service worker

export async function clearAllCache() {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('Service worker unregistered:', registration);
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    console.log('All cache and storage cleared!');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

export async function hardRefresh() {
  await clearAllCache();
  
  // Force hard refresh
  if (typeof window !== 'undefined') {
    // Try different hard refresh methods
    if (window.location.reload) {
      window.location.reload(true); // Force reload
    } else {
      window.location.href = window.location.href;
    }
  }
}

// Debug function to check cache status
export async function checkCacheStatus() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Active caches:', cacheNames);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      console.log(`Cache ${cacheName} contains:`, requests.map(req => req.url));
    }
  }
  
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Active service workers:', registrations);
  }
}
