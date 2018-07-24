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
	networkData
) {
	$scope.networkData = networkData

	$scope.downloadNetwork = function() {
  	var xml = Graph.library.gexf.write($scope.networkData.g);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }
		
})
