'use strict';

angular.module('app.print-attributes', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-attributes/:detailLevel', {
    templateUrl: 'views/print-attributes.html'
  , controller: 'PrintAttributesController'
  })
}])

.controller('PrintAttributesController', function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	networkData
) {
	$scope.networkData = networkData
	$scope.printMode = true
	$scope.attributeListDetailLevel = $routeParams.detailLevel
	if ($routeParams.detailLevel != 1 && $routeParams.detailLevel != 2 && $routeParams.detailLevel != 3) {
		$routeParams.detailLevel = 1
	}

	$scope.print = function() {
		window.print()
	}
})
