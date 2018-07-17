'use strict';

angular.module('app.components.cardModalitySummary', [])

.directive('cardModalitySummary', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    templateUrl: 'components/cardModalitySummary.html',
    scope: {
      attId: '=',
      modValue: '=',
      detailLevel: '=',
      printMode: '='
    },
    link: function($scope, el, attrs) {
      var g = networkData.g
      $scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
      $scope.modality = $scope.attribute.modalitiesIndex[$scope.modValue]
      $scope.modalityFlow = $scope.attribute.data.modalityFlow[$scope.modValue][$scope.modValue]
      // Density
      if (g.type == 'directed') {
        $scope.density = Graph.library.metrics.density.directedDensity($scope.modality.count, $scope.modalityFlow.count)
      } else if(g.type == 'undirected') {
        $scope.density = Graph.library.metrics.density.undirectedDensity($scope.modality.count, $scope.modalityFlow.count)
      } else if(g.type == 'mixed') {
        $scope.density = Graph.library.metrics.density.mixedDensity($scope.modality.count, $scope.modalityFlow.count)
      }
	  }
  }
})