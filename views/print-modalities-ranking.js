'use strict'

angular
  .module('app.print-modalities-ranking', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-modalities-ranking', {
        templateUrl: 'views/print-modalities-ranking.html',
        controller: 'PrintModalitiesRankingController'
      })
    }
  ])

  .controller('PrintModalitiesRankingController', function(
    $scope,
    $location,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.printMode = true
    $scope.attributeId = $location.search().att
    $scope.decileMode = $location.search().decile == 'true'

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]
        $scope.modalities = scalesUtils.buildModalities(
          $scope.attribute,
          $scope.decileMode
        )
        $scope.maxModCount = d3.max(
          $scope.modalities.map(function(mod) {
            return mod.count
          })
        )
      }
    })

    $scope.modalityListDetailLevel = $location.search().detail || 1
    if (
      $scope.modalityListDetailLevel != 1 &&
      $scope.modalityListDetailLevel != 2
    ) {
      $scope.modalityListDetailLevel = 1
    }
  })
