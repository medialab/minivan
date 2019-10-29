'use strict'

angular
  .module('app.explorer', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/explorer', {
        templateUrl: 'views/explorer.html',
        controller: 'ExplorerController'
      })
    }
  ])

  .controller('ExplorerController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)

    // No file location: redirect to test corpus.
    if ($scope.bundleLocation === undefined) {
      var test_file_location = dataLoader.encodeLocation('data/test00.json')
      // var test_file_location = dataLoader.encodeLocation('data/Eleonoras Network with tags v2.gexf')
      // var test_file_location = dataLoader.encodeLocation('data/SiS Words.gexf')
      $scope.bundleLocation = test_file_location
    }

    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.downloadNetwork = function() {
      var xml = Graph.library.gexf.write($scope.networkData.g)
      var blob = new Blob([xml], { type: 'text/gexf+xml;charset=utf-8' })
      saveAs(blob, $scope.networkData.title + '.gexf')
    }
  })
