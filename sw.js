const CACHE_NAME = 'restaurant-reviews-v1';


self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
    console.log(event);
    return cache.addAll([
      '/',
      'index.html',
      'restaurant.html',
      'css/styles.css',
      'js/main.js',
      'js/restaurant_info.js',
      'js/dbhelper.js',
      'http://localhost:1337/restaurants',
      ]);
    })
  );
});

self.addEventListener('fetch',  (event) => {
    event.respondWith(
        caches.match(event.request).then((res) =>{
            if(res){
                return res;
            }
            return requestBackend(event);
        })
    )
});

function requestBackend(event){
    var url = event.request.clone();
    return fetch(url).then(function(res){
        //if not a valid response send the error
        if(!res || res.status !== 200 || res.type !== 'basic'){
            return res;
        }

        var response = res.clone();

        caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, response);
        });

        return res;
    })
}

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function(keys){
        return Promise.all(keys.map(function(key, i){
            if(key !== CACHE_NAME){
                return caches.delete(keys[i]);
            }
        }))
    })
  )
});