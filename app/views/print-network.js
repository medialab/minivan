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
	
})
