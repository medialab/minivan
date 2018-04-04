'use strict';

angular.module('app.modalities', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/att/:attribute/modalities', {
    templateUrl: 'views/modalities.html'
  , controller: 'ModalitiesController'
  , reloadOnSearch: false
  })
}])

.controller('ModalitiesController', function(
	$scope,
	$location,
	$timeout,
	$route,
	$routeParams,
	networkData,
	csvBuilder
) {
	$scope.panel = $location.search().panel || 'map'
	$scope.search = $location.search().q
	$scope.networkData = networkData
  $scope.$watch('panel', updateLocationPath)
  $scope.$watch('search', updateLocationPath)
  $scope.$watch('networkData.loaded', function(){
    if ($scope.networkData.loaded) {
      $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
      console.log('attribute', $scope.attribute)
    }
  })

	$scope.networkNodeClick = function(nid) {
    console.log('Click on', nid)
  }

  $scope.downloadGEXF = function() {
  	var xml = Graph.library.gexf.write($scope.networkData.g);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes()
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateLocationPath(){
  	$location.search('panel', $scope.panel || null)
  	$location.search('q', $scope.search || null)
  }
})
