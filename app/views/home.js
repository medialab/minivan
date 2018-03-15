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
	$scope.attributes = ['Nombre d\'habitants', 'Nombre de foyers', 'Superficie', 'Nombre d\'habitants', 'Nombre de foyers', 'Superficie', 'Nombre d\'habitants', 'Nombre de foyers', 'Superficie']
	
})
