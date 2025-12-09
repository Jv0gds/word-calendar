// Service Worker - 实现离线功能和应用缓存
// 版本号：每次更新文件时修改这个版本号，浏览器会重新缓存
const CACHE_NAME = 'word-calendar-v1.0.0';

// 需要缓存的文件列表
const urlsToCache = [
  '/',
  '/index.html',
  '/calendar.html',
  '/word_list.html',
  '/style.css',
  '/script.js',
  '/calendar.js',
  '/word_list.js',
  '/manifest.json'
];

// ==========================================
// 安装事件 - Service Worker 首次安装时触发
// ==========================================
self.addEventListener('install', event => {
  console.log('[Service Worker] 正在安装...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 正在缓存应用文件...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] ✅ 所有文件已缓存成功!');
      })
      .catch(error => {
        console.error('[Service Worker] ❌ 缓存失败:', error);
      })
  );
  
  // 强制新的 Service Worker 立即激活
  self.skipWaiting();
});

// ==========================================
// 激活事件 - 新的 Service Worker 激活时触发
// ==========================================
self.addEventListener('activate', event => {
  console.log('[Service Worker] 正在激活...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本的缓存
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
  
  // 立即控制所有页面（不需要刷新）
  return self.clients.claim();
});

// ==========================================
// 拦截请求 - 实现离线功能的核心逻辑
// ==========================================
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 策略：缓存优先（Cache First）
        // 如果缓存中有，直接返回缓存的资源
        if (cachedResponse) {
          console.log('[Service Worker] 📦 从缓存加载:', event.request.url);
          return cachedResponse;
        }
        
        // 缓存中没有，从网络获取
        console.log('[Service Worker] 🌐 从网络加载:', event.request.url);
        
        return fetch(event.request)
          .then(response => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应（因为响应流只能使用一次）
            const responseToCache = response.clone();
            
            // 将新获取的资源添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] ✅ 已缓存新资源:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] ❌ 网络请求失败:', error);
            
            // 网络失败时，尝试返回离线页面
            return caches.match('/index.html');
          });
      })
  );
});

// ==========================================
// 消息事件 - 接收来自页面的消息
// ==========================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // 收到跳过等待的消息，立即激活新的 Service Worker
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // 清除所有缓存
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('[Service Worker] 🗑️ 所有缓存已清除');
        // 通知页面缓存已清除
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

// ==========================================
// 后台同步事件（可选功能）
// ==========================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-words') {
    console.log('[Service Worker] 🔄 后台同步单词数据...');
    event.waitUntil(
      // 这里可以添加数据同步逻辑
      // 比如将本地数据上传到服务器
      Promise.resolve()
    );
  }
});

// ==========================================
// 推送通知事件（可选功能）
// ==========================================
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

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击');
  event.notification.close();
  
  // 打开应用
  event.waitUntil(
    clients.openWindow('/')
  );
});