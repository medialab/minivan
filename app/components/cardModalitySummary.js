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
	  }
  }
})