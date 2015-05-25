(function(angular) {

  angular.module('starter')
    .config(starterConfig);

  function starterConfig($stateProvider, $urlRouterProvider, $localForageProvider, $ionicConfigProvider) {
    $localForageProvider.config({
      name        : 'rekord', // name of the database and prefix for your data, it is "lf" by default
      storeName   : 'rekord', // name of the table
      description : 'Daily activity counter.'
    });

    $ionicConfigProvider.views.maxCache(0);

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
      .state('init', {
        url: '/init',
        templateUrl: 'templates/init.html',
        controller: 'InitCtrl as vm',
        resolve: {
          checkData: function(configService, $state) {
            return configService.isInitialized()
              .then(function checkData(hasData) {
                if (hasData) $state.go('tab.dash');
              });
          }
        }
      })

      .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html",
        resolve: {
          checkData: function(configService, $state) {
            return configService.isInitialized()
              .then(function checkData(hasData) {
                if (!hasData) $state.go('init');
              });
          }
        }
      })

      // Each tab has its own nav history stack:

      .state('tab.dash', {
        url: '/dash',
        resolve: {
          dailiesData: function(dailiesService) {
            return dailiesService.load()
              .catch(handleLoadError);

              function handleLoadError(err) {
                console.log('Could not load dailies.', err);
                throw err;
              }
          },
          configData: function(configService) {
            return configService.load();
          },
          dbInfo: function(configService) {
            return configService.dbInfo();
          }
        },
        views: {
          'tab-dash': {
            templateUrl: 'templates/tab-dash.html',
            controller: 'DashCtrl as vm'
          }
        }
      })

      .state('tab.dailies', {
        url: '/dailies',
        resolve: {
          trackingData: function(rekordData) {
            return rekordData.getTracking();
          },
          dailiesData: function(rekordData) {
            return rekordData.getDailies();
          }
        },
        views: {
          'tab-dailies': {
            templateUrl: 'templates/tab-dailies.html',
            controller: 'DailiesCtrl as vm'
          }
        }
      })

      .state('tab.results', {
        url: '/results',
        resolve: {
          dailiesData: function(rekordData) {
            return rekordData.getDailies();
          }
        },
        views: {
          'tab-results': {
            templateUrl: 'templates/tab-results.html',
            controller: 'ResultsCtrl as vm'
          }
        }
      })

      .state('tab.results-details', {
        url: '/results/:itemId',
        views: {
          'tab-results': {
            templateUrl: 'templates/tab-results-details.html',
            controller: 'ResultsDetailsCtrl as vm'
          }
        }
      })

      .state('tab.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            templateUrl: 'templates/tab-settings.html',
            controller: 'SettingsCtrl as vm'
          }
        }
      })

      .state('tab.settings-list', {
        url: '/settings/list',
        resolve: {
          dailiesData: function(rekordData) {
            return rekordData.getDailies();
          }
        },
        views: {
          'tab-settings': {
            templateUrl: 'templates/tab-settings-list.html',
            controller: 'SettingsListCtrl as vm'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/dash');

  }

})(angular);
