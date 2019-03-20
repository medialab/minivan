'use strict'

angular
  .module('app.start', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/start', {
        templateUrl: 'views/start.html',
        controller: 'StartController'
      })
    }
  ])

  .controller('StartController', function(
    $scope,
    $location,
    $timeout,
    $routeParams
  ) {
    $scope.bundleUrl = ''

    $scope.getUrl = function(relative) {
      var url = $location[relative ? 'url' : 'absUrl']().replace(/\/start$/, '')

      url += '/explorer?bundle='
      url += encodeURIComponent($scope.bundleUrl)

      return url
    }

    $scope.start = function() {
      $location.url($scope.getUrl(true))
    }
  })
