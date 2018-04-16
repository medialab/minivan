'use strict';

angular.module('app.print-matrix', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-matrix', {
    templateUrl: 'views/print-matrix.html'
  , controller: 'PrintMatrixController'
  })
}])

.controller('PrintMatrixController', function(
	$scope,
	$location,
	$timeout,
	networkData,
	scalesUtils
) {
	$scope.networkData = networkData

  $scope.selectedAttId = $location.search().att
  $scope.matrixDetailLevel = +$location.search().detail
  $scope.viewBox = {
    x: +$location.search().x,
    y: +$location.search().y,
    w: +$location.search().w,
    h: +$location.search().h,
  }
  
	$scope.$watch('networkData.loaded', function(){
		if ($scope.networkData && $scope.networkData.g) {
	    var g = $scope.networkData.g
	    update()
	  }
	})

	function update() {
    $scope.att = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
  }
})
