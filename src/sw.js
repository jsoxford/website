var CACHE = 'v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll([
        '/css/main.css',
        '/images/members.jpg',
        '/codeofconduct/',
        '/'
      ]);
    })
  );
});


self.addEventListener('fetch', function(event) {
  event.respondWith(fetchAndCache(event));
});


function fetchAndCache(event) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(event.request).then(response => {
      var fetchResponse = fetch(event.request)
        .then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        .catch(function() {
          return response;
        });
      return fetchResponse;
    });
  });
}
