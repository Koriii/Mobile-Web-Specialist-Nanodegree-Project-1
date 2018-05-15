const dbPromise = idb.open('restaurants', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants');
  }
})
 
const idbKeyval = {
  get(key, idb) {
    return dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').get(key);
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(val, key);
      return tx.complete;
    });
  },
  delete(key) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').delete(key);
      return tx.complete;
    });
  },
  clear() {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').clear();
      return tx.complete;
    });
  },
  keys() {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants');
      const keys = [];
      const store = tx.objectStore('restaurants');
 
      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // openKeyCursor isn't supported by Safari, so we fall back
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });
      return tx.complete.then(() => keys);
    });
  }
};