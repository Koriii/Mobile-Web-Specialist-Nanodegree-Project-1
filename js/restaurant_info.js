let restaurant;
let review;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      google.maps.event.addListener(restaurant, "tilesloaded", function(){
        [].slice.apply(document.querySelectorAll('#map a')).forEach(function(item) {
            item.setAttribute('tabindex','-1');
        });
      })
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      DBHelper.fetchReviewsById(id, (error, reviews) => {
        const review = [];
        for (const item of reviews) {
          if (item.restaurant_id == restaurant.id) {
            review.push(item)
          }
        }
        fillReviewsHTML(review);     
      });
      fillRestaurantHTML();
      callback(null, restaurant, review)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (review = self.review) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!review) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
    let i = 0

  const ul = document.getElementById('reviews-list');
  review.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

reviewForm = (restaurant = self.restaurant) => {
  const nameInput = document.getElementById('name-input').value;
  const ratingInput = document.getElementById('rating-input').value;
  const reviewInput = document.getElementById('review-input').value;

  let formData = new FormData();
  formData.append('restaurant_id', parseInt(restaurant.id));
  formData.append('name', nameInput);
  formData.append('rating', ratingInput);
  formData.append('comments', reviewInput);

  let ConvertedJSON = {};
  for (const [key, value] of formData.entries())
  {
      ConvertedJSON[key] = value;
  }

  if (formData.get('restaurant_id') && formData.get('name') && formData.get('rating') && formData.get('comments')) {
      addReview(ConvertedJSON);
      return formData;
  } else {
    alert('error')
  }
}

// -------------------------------------------------------------------------------------------
addReview = (data) => {
  let offline_obj = {
    name: 'addReview',
    data: JSON.stringify(data),
    object_type: 'review'
  };

  // check if online
  if (!navigator.online && (offline_obj.name == 'addReview')) {
    sendDataOffline(offline_obj);
    return;
  }
  // reviewSend == formData
}

sendDataOffline = (offline_obj) => {
  console.log('Offline OBJ', offline_obj);
  localStorage.setItem('data', JSON.stringify(offline_obj.data));
  console.log(`Local storage: ${offline_obj.object_type} stored`);

  window.addEventListener('online', (event) => {
    console.log('Browser online again!');
    let data = JSON.parse(localStorage.getItem('data'));

    [...document.querySelectorAll(".reviews_offline")]
    .forEach(el => {
      el.classList.remove('reviews_offline');
      el.querySelector('offline_label').remove()
    });
    if (data !== null) {
      if (offline_obj.name === 'addReview') {
        postReview(offline_obj.data);
        console.log('Data sent');
      }

      localStorage.removeItem('data');
      console.log(`Local storage: ${offline_obj.object_type} removed`)
    }
  });
}

/**
 * Create post request to the server with the body of the form
 */
postReview = () => {
  fetch('http://localhost:1337/reviews/', {
    method: 'POST',
    body: reviewForm()
  }).then(
    response => response.json()
  ).catch(
    error => console.error(`Fetch Error =\n`, error)
  ).then(
    response => console.log('Success:', response)
  );
};

/**
 * Create PUT request to make a restaurant favorite boiiiii
 */
deleteReview = (reviewId) => {
  fetch('http://localhost:1337/reviews/' + reviewId, {
    method: 'DELETE'
  }).then(
    response => response.json()
  ).catch(
    error => console.error(`Fetch Error =\n`, error)
  ).then(
    response => console.log('Success:', response)
  );
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const name = document.createElement('b');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('span');
  date.innerHTML = review.createdAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const postDelete = document.createElement('button');
  postDelete.setAttribute('onclick', 'deleteReview(' + review.id +')');
  postDelete.classList.add('delete-review'); 
  postDelete.innerHTML= 'X';
  li.appendChild(postDelete);

  return li;
}

updateValue = (val) => {
  document.getElementById('rating-output').value = val;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}