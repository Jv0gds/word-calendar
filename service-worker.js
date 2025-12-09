// Service Worker - 改进版本，避免过度缓存HTML
const CACHE_NAME = 'word-calendar-v1.0.1'; // 更新版本号

// 需要缓存的静态资源（不包括HTML）
const STATIC_CACHE = [
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// HTML 文件使用网络优先策略
const HTML_FILES = [
  '/',
  '/index.html',
  '/calendar.html',
  '/word_list.html',
  '/all_words.html'
];

// JavaScript 文件使用缓存优先策略
const JS_FILES = [
  '/script.js',
  '/calendar.js',
  '/word_list.js',
  '/all_words.js'
];

// 安装事件
self.addEventListener('install', event => {
  console.log('[Service Worker] 正在安装...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存静态资源...');
        // 只缓存静态资源和JS文件
        return cache.addAll([...STATIC_CACHE, ...JS_FILES]);
      })
      .then(() => {
        console.log('[Service Worker] ✅ 安装成功!');
      })
      .catch(error => {
        console.error('[Service Worker] ❌ 安装失败:', error);
      })
  );
  
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('[Service Worker] 正在激活...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] ✅ 激活成功!');
    })
  );
  
  return self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  const requestURL = new URL(event.request.url);
  const path = requestURL.pathname;
  
  // HTML 文件：网络优先策略（避免显示旧版本）
  if (HTML_FILES.some(file => path.endsWith(file) || path === file)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('[Service Worker] 🌐 从网络加载 HTML:', path);
          // 克隆并缓存响应（用于离线时使用）
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] 📦 网络失败，使用缓存 HTML:', path);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // JS 和 CSS 文件：缓存优先策略
  if (path.endsWith('.js') || path.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] 📦 从缓存加载:', path);
            // 后台更新缓存
            fetch(event.request).then(response => {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response);
              });
            }).catch(() => {});
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            console.log('[Service Worker] 🌐 从网络加载:', path);
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
    return;
  }
  
  // 其他资源：缓存优先
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
      })
  );
});

// 消息事件
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('[Service Worker] 🗑️ 所有缓存已清除');
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_CLEARED'
            });
          });
        });
      })
    );
  }
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-words') {
    console.log('[Service Worker] 🔄 后台同步单词数据...');
    event.waitUntil(Promise.resolve());
  }
});

// 推送通知
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '别忘了学习今天的单词！',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('单词日历提醒', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击');
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});