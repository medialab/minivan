'use strict'

angular
  .module('app.print-modalities-partition', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-modalities-partition', {
        templateUrl: 'views/print-modalities-partition.html',
        controller: 'PrintModalitiesPartitionController'
      })
    }
  ])

  .controller('PrintModalitiesPartitionController', function(
    $scope,
    $location,
    $routeParams,
    dataLoader
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.printMode = true
    $scope.attributeId = $location.search().att

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]
        $scope.maxModCount = d3.max(
          Object.values($scope.attribute.modalities).map(function(mod) {
            return mod.count
          })
        )
      }
    })

    $scope.modalityListDetailLevel = $location.search().detail || 1
    if (
      $scope.modalityListDetailLevel != 1 &&
      $scope.modalityListDetailLevel != 2 &&
      $scope.modalityListDetailLevel != 3
    ) {
      $scope.modalityListDetailLevel = 1
    }
  })
