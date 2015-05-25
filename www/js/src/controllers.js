function InitConfig(params) {
  return _.pick(params, ['email']);
}

angular.module('starter.controllers', [])

.controller('InitCtrl', function($scope, configService, dailysService, trackingService, rekordData, $state) {
  this.doSetup = function doSetup(setup) {
    if (!setup.email) return;

    var inits;

    inits = [
      configSave = configService.save(InitConfig(setup)),
      dailiesSave = dailiesService.init([]),
      trackingSave = trackingService.init({}),
    ];

    Promise.all(inits).then(goToDashboard);

    function goToDashboard() {
      $state.go('tab.dash');
    }
  };
})

.controller('DashCtrl', function(dailiesData, configData, dbInfo) {
  var self = this;

  self.countOfItemsTracked = dailiesData.length;
  self.today = new Date();

  self.dbInfo = JSON.stringify(dbInfo, null, 2);
  self.configData = JSON.stringify(configData, null, 2);
})

.controller('ResultsCtrl', function($ionicPopup, dailiesData) {
  var self = this;

  self.dailies = dailiesData;
  self.hasDailies = dailiesData.length > 0;

  self.countModalValue = null;

  self.loadCountModal = function(currentCount) {
    $ionicPopup.show({
      template: '<input type="number" ng-model="countModalValue">',
      title: 'How Many?',
      scope: self,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Add</b>',
          type: 'button-positive',
          onTap: function(e) {
            return self.countModalValue
          }
        }
      ]
    })
      .then(function(results) {
        console.log('popup results', results);
        self.countModalValue = null;
      });
  };
})

.controller('ResultsDetailsCtrl', function($scope) {
  console.log('details');
})

.controller('DailiesCtrl', function($scope, $ionicPopup, trackingData, dailiesData, $filter, rekordData) {
  var self = this;

  self.tracking = trackingData;
  self.dailies = prepareDailies(dailiesData, trackingData);
  self.hasDailies = self.dailies.length > 0;
  self.countModalValue = null;
  self.loadCountModal = loadCountModal;

  function prepareDailies(dailies, tracking) {
    var trackingId = $filter('date')(new Date(), 'ddMMyyyy'),
        todaysData = tracking[trackingId] || {};

    return _.map(dailies, function(dailyItem) {
      var itemTracking = todaysData[dailyItem.id];

      return {
        id: dailyItem.id,
        name: dailyItem.name,
        count: (itemTracking && itemTracking.count) || 0
      };
    });



  }

  function loadCountModal(daily) {
    var showConfig, addingCount = 0;

    $scope.modal = { count: null };
    showConfig = {
      template: '<input type="number" ng-model="modal.count">',
      title: 'How Many?',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Add</b>',
          type: 'button-positive',
          onTap: function(e) {
            return $scope.modal.count
          }
        }
      ]
    };

    $ionicPopup.show(showConfig)
      .then(function storeCount(count) {
        addingCount = count;
      })
      .then(rekordData.getTracking)
      .then(function updateTracking(tracking) {
        debugger
        // get todays tracking
        // find target item
        // increment count
        // restore
      });
  }
})

.controller('SettingsCtrl', function($ionicPopup, rekordData, $state) {
  var self = this;

  self.clearData = function clearData() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Destroy All Data',
      template: 'Are you sure? No take backs!'
    });

    confirmPopup.then(function(confirmed) {
      if (!confirmed) return;

      rekordData.clearAll()
        .then(function() {
          $state.go('init');
        })
        .catch(function() {
          alert('clear data error!');
        });
    })
  }
})

.controller('SettingsListCtrl', function($scope, $ionicPopup, dailiesData, rekordData) {
  var self = this;

  self.dailies = dailiesData;
  self.showNewDailyModal = showNewDailyModal;

  function showNewDailyModal() {
    var showConfig;

    $scope.newDaily = {
      name: '',
      unit: 'single'
    };

    showConfig = {
      template: '' +
      '<input type="text" ng-model="newDaily.name"><br />' +
      '<select ng-model="newDaily.unit">' +
      '<option value="single">single</option>' +
      '<option value="oz">ounce</option>' +
      '<option value="min">minute</option>' +
      '</select>',
      scope: $scope,
      title: 'New Daily Activity',
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Create</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.newDaily.name) e.preventDefault();
            return $scope.newDaily;
          }
        }
      ]
    };

    return $ionicPopup.show(showConfig)
      .then(handleNewDaily);
  }

  function handleNewDaily(newDaily) {
    rekordData.saveDaily(newDaily)
      .then(function updateList(dailies) {
        console.log('updating', dailies);
        self.dailies = dailies;
      });
  }

  function setEmptyNewDaily() {

  }

});
