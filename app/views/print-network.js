'use strict';

angular.module('app.print-network', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-network/:colorAttId/:sizeAttId', {
    templateUrl: 'views/print-network.html'
  , controller: 'PrintNetworkController'
  })
}])

.controller('PrintNetworkController', function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	networkData
) {
	$scope.networkData = networkData
	if ($routeParams.colorAttId !== 'undefined') {
		$scope.colorAttId = $routeParams.colorAttId
	}
	if ($routeParams.sizeAttId !== 'undefined') {
		$scope.sizeAttId = $routeParams.sizeAttId
	}

	$scope.oversampling = 2
	
})
