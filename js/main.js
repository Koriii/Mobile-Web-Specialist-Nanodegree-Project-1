let restaurants, neighborhoods, cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

DBHelper.storeIDB();

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  google.maps.event.addListener(self.map, "tilesloaded", () => {
      [].slice.apply(document.querySelectorAll('#map a')).forEach((item) => {
          item.setAttribute('tabindex','-1');
      });
  })
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.classList.add('lazyload');
  image.alt = 'Image of ' + restaurant.name + ' restaurant';
  image.setAttribute('src', '/img/spinner.gif');
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));

  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute("rel", restaurant.name);
  //more.setAttribute("tabindex", li_tabindex);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const star = document.createElement('span');
  star.innerHTML = '&#x2606;';
  star.setAttribute('id', 'star' + restaurant.id);
  star.setAttribute('class', 'star');
  star.setAttribute('onclick', `isFavorite(${restaurant.id})`);
  if (restaurant.is_favorite == 'true') {
    star.classList.add('selected');
  }
  li.append(star);

  return li
}

/**
  * Edits Restaurant with PUT request and will add it to the favorite
  */
isFavorite = (restaurantId) => {
  fetch(`http://localhost:1337/restaurants/${restaurantId}`)
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    favCheck(data.is_favorite)
  });

  favCheck = (isFav) => {
    if (isFav == 'true') {
      fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=false`, {
          method: "PUT",
      })
      .then(response => response.json())
      .catch(error => console.error(`Fetch Error =\n`, error))
      .then(response => console.log('false Success:', response.is_favorite));
      document.getElementById('star' + restaurantId).classList.remove('selected');;
    } else {
      fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=true`, {
          method: "PUT",
      })
      .then(response => response.json())
      .catch(error => console.error(`Fetch Error =\n`, error))
      .then(response => console.log('true Success:', response.is_favorite));
      document.getElementById('star' + restaurantId).classList.add('selected');
    }
  }
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
