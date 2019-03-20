'use strict'

angular
  .module('app.print-attributes', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-attributes', {
        templateUrl: 'views/print-attributes.html',
        controller: 'PrintAttributesController'
      })
    }
  ])

  .controller('PrintAttributesController', function(
    $scope,
    $location,
    $routeParams,
    dataLoader
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.printMode = true

    $scope.attributeListDetailLevel = $location.search().detail || 1
    if (
      $scope.attributeListDetailLevel != 1 &&
      $scope.attributeListDetailLevel != 2 &&
      $scope.attributeListDetailLevel != 3
    ) {
      $scope.attributeListDetailLevel = 1
    }
  })
