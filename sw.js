---
layout: null
---

var urlsToCache = [];

var CACHE_NAME = 'thiru-blog-cache-v1';

// Cache posts
// Limits the number of posts that gets cached to 5
// Reads a piece of front-matter in each post that directs the second loop to the folder where the assets are held
{% for post in site.posts limit:5 %}
urlsToCache.push("{{ post.url }}");
{% for file in site.static_files %}
{% if file.path contains post.assets %}
urlsToCache.push("{{ file.path }}");
{% endif %}
{% endfor %}
{% endfor %}
// Cache pages
// Do nothing if it's either an AMP page (as these are served via Googles cache) or the blog page
// Fallback to the offline pages for these
{% for page in site.html_pages %}
urlsToCache.push("{{ page.url }}");
{% endfor %}

// Cache assets
// Removed assets/posts because I only want assets from the most recent posts getting cached
{% for file in site.static_files %}
urlsToCache.push("{{ file.path }}");
{% endfor %}

urlsToCache.push("/assets/css/main.css");

// Trim specified cache to max size
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(function(cache) {
    cache.keys().then(function(keys) {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

//self.addEventListener('message', event => {
  //if (event.data.command == 'trimCaches') {
  //  caches.open(CACHE_NAME).then(function(cache) {
  //    console.log(cache.keys());
  //  });
  //  trimCache(CACHE_NAME, 75);
  //}
//});

// Installation of service worker
self.addEventListener('install', function(event) {
  self.skipWaiting();
  // Perform install steps
  caches.open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME){
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return response;
        });
      });
    })
  );
});