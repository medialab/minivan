'use strict';

angular.module('app.components.cardModalityRemarkableNodes', [])

.directive('cardModalityRemarkableNodes', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    templateUrl: 'components/cardModalityRemarkableNodes.html',
    scope: {
      attId: '=',
      modValue: '=',
      topCut: '=',
      sortedNodes: '=',
      detailLevel: '=',
      printMode: '='
    },
    link: function($scope, el, attrs) {
      var g = networkData.g
      $scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
      $scope.modality = $scope.attribute.modalitiesIndex[$scope.modValue]
      $scope.modalityFlow = $scope.attribute.data.modalityFlow[$scope.modValue][$scope.modValue]
	  }
  }
})
