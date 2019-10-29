'use strict'

angular
  .module('app.print-stats-range', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-stats-range', {
        templateUrl: 'views/print-stats-range.html',
        controller: 'PrintStatsRangeController'
      })
    }
  ])

  .controller('PrintStatsRangeController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils,
    remarkableNodes
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.attributeId = $location.search().att
    $scope.rangeMin = $location.search().rangeMin
    $scope.rangeMax = $location.search().rangeMax
    $scope.detailLevel = $location.search().detail || 1
    if ($scope.detailLevel != 1 && $scope.detailLevel != 2) {
      $scope.detailLevel = 1
    }

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]
        if (
          $scope.attribute.type !== 'ranking-color' &&
          $scope.attribute.type !== 'ranking-size'
        ) {
          console.error(
            '[ERROR] The type of attribute "' +
              $scope.attribute.name +
              '" is not "ranking-size" or "ranking-color".',
            $scope.attribute
          )
        }

        // Node filter
        $scope.nodeFilter = function(nid) {
          var val = +$scope.networkData.g.getNodeAttribute(
            nid,
            $scope.attribute.id
          )
          return $scope.rangeMin <= val && val <= $scope.rangeMax
        }

        // Subgraph
        var g = networkData.g
        $scope.subgraph = g.copy()
        $scope.subgraph.nodes().forEach(function(nid) {
          if (!$scope.nodeFilter(nid)) {
            $scope.subgraph.dropNode(nid)
          }
        })
      }
    })
  })
