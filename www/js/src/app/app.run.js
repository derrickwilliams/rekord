(function(angular) {

  angular.module('starter')
    .run(starterRun);

  function starterRun($ionicPlatform, $rootScope, $state, rekordData) {

    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleLightContent();
      }
    });

    $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams){
        console.log('stateChangeStart', event, toState, toParams, fromState, fromParams);
      })
  }

})(angular);
