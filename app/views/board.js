'use strict';

angular.module('app.board', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/board', {
    templateUrl: 'views/board.html'
  , controller: 'BoardController'
  })
}])

.controller('BoardController', function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	networkData
) {
	$scope.attributes = ['Nombre d\'habitants', 'Nombre de foyers', 'Superficie', 'Nombre d\'habitants', 'Nombre de foyers', 'Superficie', 'Nombre d\'habitants', 'Nombre de foyers', 'Superficie']
	
})
