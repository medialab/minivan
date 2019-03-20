'use strict'

angular
  .module('app.print-stats-modalities-ranking', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-stats-modalities-ranking', {
        templateUrl: 'views/print-stats-modalities-ranking.html',
        controller: 'PrintStatsModalitiesRankingController'
      })
    }
  ])

  .controller('PrintStatsModalitiesRankingController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.attributeId = $location.search().att
    $scope.statsDetailLevel = $location.search().detail || 1
    if ($scope.statsDetailLevel != 1 && $scope.statsDetailLevel != 2) {
      $scope.statsDetailLevel = 1
    }

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]

        var g = $scope.networkData.g
        $scope.nodes = g.nodes().map(function(nid) {
          return g.getNodeAttributes(nid)
        })

        update()
      }
    })

    function update() {}
  })
