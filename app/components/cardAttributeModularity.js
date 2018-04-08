'use strict';

angular.module('app.components.cardAttributeModularity', [])

.directive('cardAttributeModularity', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    templateUrl: 'components/cardAttributeModularity.html',
    scope: {
    	attId: '='
    },
    link: function($scope, el, attrs) {
    	var g = networkData.g
    	$scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
		}
  }
})