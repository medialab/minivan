'use strict';

angular.module('app.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	dataLoader
) {
	$scope.bundleLocation = $routeParams.bundle

	// No file location: redirect to test corpus.
	if ($scope.bundleLocation === undefined) {
		var test_file_location = dataLoader.encodeLocation('data/BUNDLE - Sample Rio+20.json')
		$scope.bundleLocation = test_file_location
	}

	$scope.networkData = dataLoader.get($scope.bundleLocation)

	$scope.downloadNetwork = function() {
  	var xml = Graph.library.gexf.write($scope.networkData.g);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }
		
})
