'use strict';

angular.module('app.components.cardRangeSummary', [])

.directive('cardRangeSummary', function($timeout, networkData, scalesUtils){
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
      $scope.$watch('subgraph', function(){
        var g = $scope.subgraph
        $scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
        $scope.density = Graph.library.metrics.density(g)
      })
	  }
  }
})