'use strict'

angular
  .module('app.components.cardRangeSummary', [])

  .directive('cardRangeSummary', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardRangeSummary.html',
      scope: {
        attId: '=',
        range: '=',
        subgraph: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.$watch('subgraph', function() {
          var g = $scope.subgraph
          $scope.attribute = dataLoader.get().nodeAttributesIndex[$scope.attId]
          $scope.density = Graph.library.metrics.density(g)
        })
      }
    }
  })
