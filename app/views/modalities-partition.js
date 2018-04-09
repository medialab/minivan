'use strict';

angular.module('app.modalities-partition', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/partition/:attribute/modalities', {
    templateUrl: 'views/modalities-partition.html'
  , controller: 'ModalitiesPartitionController'
  , reloadOnSearch: false
  })
}])

.controller('ModalitiesPartitionController', function(
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
  $scope.modalityListDetailLevel = 1
  $scope.statsDetailLevel = 1
  $scope.$watch('panel', updateLocationPath)
  $scope.$watch('search', updateLocationPath)
  $scope.$watch('modalitiesSelection', updateNodeFilter, true)
  $scope.$watch('networkData.loaded', function(){
    if ($scope.networkData.loaded) {
      $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
      console.log($scope.attribute)
      if ($scope.attribute.type !== 'partition') {
        console.error('[ERROR] The type of attribute "' + $scope.attribute.name + '" is not "partition".', $scope.attribute)
      }

      $scope.modalitiesSelection = {}
      $scope.attribute.modalities.forEach(function(mod){ $scope.modalitiesSelection[mod.value] = false })
      $scope.maxModCount = d3.max($scope.attribute.modalities.map(function(mod){ return mod.count }))
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

  $scope.downloadModalities = function() {
    var csv = csvBuilder.getModalities($scope.attribute.id)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Modalities of " + $scope.attribute.name + ".csv");
  }

  $scope.downloadStats = function() {
    var csv1 = csvBuilder.getModalityLinks($scope.attribute.id, $scope.modalitiesSelection)
    var blob = new Blob([csv1], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Links between modalities of " + $scope.attribute.name + ".csv");

    if ($scope.statsDetailLevel>1) {
      $timeout(function(){
        var csv2 = csvBuilder.getModalityNormalizedDensities($scope.attribute.id, $scope.modalitiesSelection)
        var blob = new Blob([csv2], {'type':'text/csv;charset=utf-8'});
        saveAs(blob, $scope.networkData.title + " - Norm densities between modalities of " + $scope.attribute.name + ".csv");
      }, 1000)
    }
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes($scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateNodeFilter() {
    if ($scope.attribute) {
      if ($scope.attribute.modalities.some(function(mod){ return $scope.modalitiesSelection[mod.value]})) {
        $scope.nodeFilter = function(nid){
          return $scope.modalitiesSelection[$scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)]
        }
      } else {
        // All unchecked: show all
        $scope.nodeFilter = function(){ return true }
      }

      // Node filter imprint (used in URLs)
      $scope.nodeFilterImprint = $scope.attribute.modalities
        .map(function(mod){
          return $scope.modalitiesSelection[mod.value]
        })
        .join(',')
    }
  }

  function updateLocationPath(){
  	$location.search('panel', $scope.panel || null)
  	$location.search('q', $scope.search || null)
  }
})
