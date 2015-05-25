(function(angular) {
  var app = angular.module('rekord.services', ['LocalForageModule', 'angularUUID2']);
})(angular);

//(function(angular) {
//  var app = angular.module('rekord.services'),
//      trackingService,
//      TRACKING_KEY_NAME;
//
//  CONFIG_KEY_NAME = 'settings.config';
//
//  TRACKING_KEY_NAME = 'tracking.dailies';
//
//  trackingService = [
//    'rekordData',
//    trackingServiceFn
//  ];
//
//  app.factory('trackingService', trackingServiceFn);
//
//  function trackingServiceFn($localForage, uuid) {
//      var self, rekordDataService;
//
//      self = rekordDataService = {
//        getData: getAllData,
//
//        getDailies: getDailies,
//        saveDaily: saveDaily,
//
//        getTracking: getTracking,
//        saveTracking: saveTracking,
//
//        getConfig: getConfig,
//        saveConfig: saveConfig,
//        init: init,
//
//        clearAll: clearAll,
//        hasData: hasData
//      };
//
//      return self;
//
//      function getAllData() {
//        var self = rekordDataService, dataLoads;
//
//        dataLoads = [
//          self.getConfig(),
//          self.getDailies(),
//          self.getTracking()
//        ];
//
//        return Promise.all(dataLoads)
//          .then(composeData);
//
//        function composeData(results) {
//          return {
//            config: results[0],
//            dailies: results[1],
//            tracking: results[2]
//          };
//        }
//      }
//
//      function getConfig() {
//        return $localForage.getItem(CONFIG_KEY_NAME);
//      }
//
//      function saveConfig(config) {
//        return saveData($localForage, CONFIG_KEY_NAME, config);
//      }
//
//      function init(config) {
//        var saves = [
//          saveConfig(config),
//          $localForage.setItem(DAILIES_KEY_NAME, []),
//          $localForage.setItem(TRACKING_KEY_NAME, {})
//        ];
//
//        return Promise.all([saves])
//          .then(getAllData);
//      }
//
//      function getDailies() {
//        return $localForage.getItem(DAILIES_KEY_NAME);
//      }
//
//      function saveDaily(dailyData) {
//        return rekordDataService.getDailies()
//          .then(_.partialRight(updateStore,  dailyData, uuid.newguid))
//          .then(_.partial(saveData, $localForage, DAILIES_KEY_NAME));
//      }
//
//      function getTracking() {
//        return $localForage.getItem(TRACKING_KEY_NAME);
//      }
//
//      function saveTracking(trackData) {
//        return rekordDataService.getTracking()
//          .then(_.partial(updateStore, trackData))
//          .then(_.partial(saveData, $localForage, TRACKING_KEY_NAME));
//      }
//
//      function clearAll() {
//        return $localForage.clear();
//      }
//
//      function hasData() {
//        return $localForage.length()
//          .then(checkLength);
//
//        function checkLength(len) {
//          return len !== 0;
//        }
//      }
//
//
//    function updateStore(existing, target, createID) {
//      var isNew = !target.id, foundIndex;
//
//      if (isNew) {
//        target.id = createID();
//        existing.push(target);
//        return existing;
//      }
//
//      foundIndex = _.findIndex(existing, { id: target.id });
//      if (foundIndex < 0) {
//        existing.push(target);
//        return existing;
//      }
//
//      existing[foundIndex] = target;
//      return existing;
//    }
//
//    function saveData($localForage, keyName, data) {
//      return $localForage.setItem(keyName, data);
//    }
//  }
//
//})(angular);


// TRACKING SERVICE
(function(angular) {
  var app = angular.module('rekord.services'),
      TRACKING_KEY_NAME,
      trackingService;

  TRACKING_KEY_NAME = 'tracking.dailies';

  trackingService = [
    'rekordData',
    trackingServiceFn
  ];

  app.factory('trackingService', trackingService);

  function getTrackingId(date) {
    if (!angular.isDate(date)) throw Error('Invalid tracking date: ' + date);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function newRecord(incoming) {
    return _.pick(incoming, ['id', 'count', 'notes']);
  }

  function updatedRecord(original, incoming) {
    var updated = _.clone(original);

    updated.count = incoming.count +
      (_.isNumber(original.count) ? original.count : 0);

    return updated;
  }

  function trackingServiceFn(rekordData) {
    return {
      load: loadTracking,
      loadByDate: loadTrackingByDate,
      save: saveByDate,
      init: init
    };

    function loadTracking() {
      return rekordData.load(TRACKING_KEY_NAME);
    }

    function loadTrackingByDate(date) {
      return loadTracking()
        .then(function getByTrackingId(trackingData) {
          var data = trackingData[getTrackingId(date)];
          return _.isUndefined(data) ? {} : data;
        });
    }

    function saveByDate(date, trackData) {
      return loadTrackingByDate(data)
        .then(_.partial(updateTracking, trackData))
        .then(_.partial(rekordData.store, TRACKING_KEY_NAME))
        .catch(function trackingSaveError(err) {
          console.log('Tracking save error.', err);
          alert('Tracking error: [' + err.message + '] ' + message.stack);
        });

      function updateTracking(incoming, existing) {
        var found = existing[incoming.id];

        existing[incoming.id] = !found ?
          newRecord(incoming) :
          updatedRecord(found, incoming);
      }
    }

    function init() {
      return rekordData.store(TRACKING_KEY_NAME, {});
    }
  }

})(angular);

// DAILIES SERVICE
(function(angular) {
  var app = angular.module('rekord.services'),
      dailiesService,
      DAILIES_KEY_NAME;

  DAILIES_KEY_NAME = 'settings.dailies';

  dailiesService = [
    'rekordData',
    dailiesServiceFn
  ];

  app.factory('dailiesService', dailiesService);

  function dailiesServiceFn(rekordData) {
    var self;

    self = {
      load: loadDailies,
      loadOne: loadOneDaily,
      store: storeDaily,
      init: init
    };

    return self;

    function loadDailies() {
      return rekordData.load(DAILIES_KEY_NAME)
        .then(function(results) {
          return results || [];
        });
    }

    function loadOneDaily(id) {
      return self.load()
        .then(function findById(results) {
          return _.find(results, { id: id });
        });
    }

    function storeDaily(daily) {
      var isNew = daily.id ? false : true,
          existingIndex,
          existing;

      daily.id = isNew ? rekordData.createGuid() : daily.id;

      return self.load()
        .then(addToCollection)
        .then(_.partial(rekordData.store, DAILIES_KEY_NAME));

      function addToCollection(dailies) {
        var target = _.pick(daily, ['id', 'name', 'unit']);

        if (isNew) {
          dailies.push(target);
          return dailies
        }

        existingIndex = _.findIndex(dailies, { id: daily.id });

        if (existingIndex > 0) {
          throw new Error('Updating an item that doesn\'t exist:', 'daily', daily.id);
        }

        existing = dailies[existingIndex];

        dailies[existingIndex] = _.assign(existing, target);

        return dailies;
      }
    }

    function init() {
      return rekordData.store(DAILIES_KEY_NAME, []);
    }
  }

})(angular);

// CONFIG SERVICE
(function(angular) {
  var CONFIG_KEY_NAME, configService;

  CONFIG_KEY_NAME = 'settings.config';

  configService = [
    'rekordData',
    configServiceFn
  ];

  angular.module('rekord.services')
    .factory('configService', configService);

  function configServiceFn(rekordData) {
    var self, _initialized;

    _initialized = null;

    self = {
      load: loadConfig,
      save: saveConfig,
      isInitialized: isInitialized,
      dbInfo: rekordData.dbInfo
    };

    return self;

    function loadConfig() {
      return rekordData.load(CONFIG_KEY_NAME);
    }

    function saveConfig(config) {
      return self.load()
        .then(_.partial(updateConfig, config))
        .then(save);

      function updateConfig(incoming, existing) {
        console.log('updateConfig', incoming, existing);
        var updated = existing ? _.clone(existing) : {};

        debugger

        return _.assign(updated, incoming);;
      }

      function save(config) {
        console.log(CONFIG_KEY_NAME, config);
        return rekordData.store(CONFIG_KEY_NAME, config);
      }
    }

    function isInitialized() {
      if (_initialized === true) {
        return Promise.resolve(true);
      }

      return self.load()
        .then(checkData);

      function checkData(config) {
        _initialized = config && _.has(config, 'email');
        return _initialized;
      }
    }

  }

})(angular);

// REKORD DATA
(function(angular) {
  var app = angular.module('rekord.services'),
      rekordData;

  rekordData = [
    '$localForage',
    'uuid2',
    rekordDataFn
  ];

  app.factory('rekordData', rekordData);

  function rekordDataFn($localForage, uuid) {
    var self;

    self = {
      load: loadData,
      store: storeData,
      clearAll: clearAll,
      createGuid: uuid.newguid,
      dbInfo: getDBInfo
    };

    return self;

    function loadData(key) {
      return $localForage.getItem(key)
    }

    function storeData(key, value) {
      return $localForage.setItem(key, value);
    }

    function clearAll() {
      return $localForage.clear();
    }

    function getDBInfo() {
      var getKeys = $localForage.keys(),
          getSize = $localForage.length();

      return Promise.all([getKeys, getSize])
        .then(formatInfo);

      function formatInfo(dbInfo) {
        return {
          keys: dbInfo[0],
          size: dbInfo[1]
        };
      }
    }
  }

})(angular);
