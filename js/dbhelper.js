/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL + 'restaurants', {
    }).then(response => response.json()).then(data => {
      callback(null, data);
    }).catch(e => DBHelper.requestError(e, 'error'));
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    fetch(DBHelper.DATABASE_URL + 'reviews', {
    }).then(response => response.json()).then(data => {
      callback(null, data);
    }).catch(e => DBHelper.requestError(e, 'error'));
  }

  /**
   * fetch Error handler
   */
  static requestError(e, part) {
      console.log(e);
  }

  /**
   * IndexedDB fill
   */
  static storeIDB(id, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if(error) {
        callback(error, null);
      } else {
        for (const r in restaurants) {
          const restaurant = restaurants[r];
          if (restaurant) {
            idbKeyval.set(restaurant.id, restaurant);
          } else {
            callback('Restaurant does not exist', null);
          }
        }
      }
    });

    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null)
      } else {
        for (const r in reviews) {
          const review = reviews[r];
          if (review) {
            idbKeyval.set(review.id, review);
          } else {
            callback('Restaurant does not exist', null);
          }
        }    
      }
    });
  }

  static fetchReviewsById(id, callback) {
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        if (reviews) {
          callback(null, reviews);
        } else {
          callback('Review does not exist', null);
        } 
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let responsiveImg = (`/img/${restaurant.photograph}.webp`);
    if (responsiveImg.includes('undefined')) {
      return (`/img/NoImage.svg`);
    } else if (screenWidth < 480) {
      return [responsiveImg.slice(0, 5), 'm', responsiveImg.slice(5)].join('');
    } else if (screenWidth < 800) {
      return [responsiveImg.slice(0, 5), 's', responsiveImg.slice(5)].join('');
    } else {
      return (`/img/${restaurant.photograph}.webp`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
