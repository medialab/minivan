'use strict'

angular
  .module('app.home', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: 'views/home.html',
        controller: 'HomeController'
      })
    }
  ])

  .controller('HomeController', function($scope) {})
