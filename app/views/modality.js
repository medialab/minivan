'use strict';

angular.module('app.modality', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/partition/:attribute/modality/:modalityValue', {
    templateUrl: 'views/modality.html'
  , controller: 'ModalityController'
  , reloadOnSearch: false
  })
}])

.controller('ModalityController', function(
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
  $scope.matrixDetailLevel = 1
  $scope.modalityListDetailLevel = 1
  $scope.statsDetailLevel = 1
  $scope.$watch('panel', updateLocationPath)
  $scope.$watch('search', updateLocationPath)
  $scope.$watch('networkData.loaded', function(){
    if ($scope.networkData.loaded) {
      $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
      $scope.modality = $scope.attribute.modalities.filter(function(mod){return mod.value == $routeParams.modalityValue})[0]
      if ($scope.attribute.type !== 'partition') {
        console.error('[ERROR] The type of attribute "' + $scope.attribute.name + '" is not "partition".', $scope.attribute)
      }
      updateNodeFilter()
    }
  })
  
	$scope.networkNodeClick = function(nid) {
    console.log('Click on', nid)
  }

  $scope.downloadGEXF = function() {
    var g2 = $scope.networkData.g.copy()
    g2.dropNodes(g.nodes().filter(function(nid){ return !$scope.nodeFilter(nid) }))
  	var xml = Graph.library.gexf.write(g2);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }

  $scope.downloadMatrix = function() {
    var csv = csvBuilder.getAdjacencyMatrix($scope.attribute.id, $scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Adjacency Matrix.csv");
  }

  $scope.downloadStats = function() {
    
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes($scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateNodeFilter() {
    if ($scope.attribute) {
      $scope.nodeFilter = function(nid){
        return $scope.modality.value == $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
      }

      // Node filter imprint (used in URLs)
      $scope.nodeFilterImprint = $scope.attribute.modalities
        .map(function(mod){
          return mod.value == $scope.modality.value
        })
        .join(',')
    }
  }

  function updateLocationPath(){
  	$location.search('panel', $scope.panel || null)
  	$location.search('q', $scope.search || null)
  }
})
