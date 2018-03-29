'use strict';

/* Services */

angular.module('app.components.nodeList', [])

.directive('nodeList', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    templateUrl: 'components/nodeList.html',
    scope: {
      colorAttId: '=',
      sizeAttId: '='
    },
    link: function($scope, el, attrs) {
    	$scope.networkData = networkData
      $scope.$watch('networkData', function(){
        if ($scope.networkData) {
          var g = $scope.networkData.g
          $scope.nodes = g.nodes().map(function(nid){
            return g.getNodeAttributes(nid)
          })
        }
      })
    }
  }
})
