'use strict'

angular
  .module('app.components.cardDensity', [])

  .directive('cardDensity', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardDensity.html',
      scope: {
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        var g = $scope.networkData.g
        $scope.density = Graph.library.metrics.density(g)
      }
    }
  })
