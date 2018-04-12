'use strict';

angular.module('app.modalities-ranking', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/ranking/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
  $routeProvider.when('/ranking-size/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
  $routeProvider.when('/ranking-color/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
}])

.controller('ModalitiesRankingController', function(
	$scope,
	$location,
	$timeout,
	$route,
	$routeParams,
	networkData,
	csvBuilder,
  scalesUtils,
  $filter
) {
	$scope.panel = $location.search().panel || 'map'
	$scope.search = $location.search().q
	$scope.networkData = networkData
  $scope.statsDetailLevel = 1
  $scope.modalityListDetailLevel = 1
  $scope.decileMode = false
  $scope.$watch('panel', updateLocationPath)
  $scope.$watch('search', updateLocationPath)
  $scope.$watch('modalitiesSelection', updateNodeFilter, true)
  $scope.$watch('decileMode', updateModalities, true)
  $scope.$watch('networkData.loaded', function(){
    if ($scope.networkData.loaded) {
      $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
      if ($scope.attribute.type !== 'ranking-size' && $scope.attribute.type !== 'ranking-color') {
        console.error('[ERROR] The type of attribute "' + $scope.attribute.name + '" is not "ranking-size" or "ranking-color".', $scope.attribute)
      }
      updateModalities()
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
    var csv = csvBuilder.getRankingModalities($scope.modalities)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Modalities of " + $scope.attribute.name + ".csv");
  }

  $scope.downloadStats = function() {
    var csv = d3.csvFormat($scope.distributionData)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Distribution of " + $scope.attribute.name + ".csv");
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes($scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateModalities() {
    if ($scope.networkData.loaded && $scope.attribute) {
      $scope.modalities = scalesUtils.buildModalities($scope.attribute, $scope.decileMode)
      $scope.modalitiesSelection = {}
      $scope.modalities.forEach(function(mod){ $scope.modalitiesSelection[mod.value] = false })
      $scope.maxModCount = d3.max($scope.modalities.map(function(mod){ return mod.count }))
    }
  }

  function updateNodeFilter() {
    if ($scope.attribute) {
      if ($scope.modalities.some(function(mod){ return $scope.modalitiesSelection[mod.value]})) {
        $scope.nodeFilter = function(nid){
          var nodeValue = $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
          var matchingModalities
          if ($scope.attribute.integer) {
            matchingModalities = $scope.modalities.filter(function(mod){
              return (nodeValue >= mod.min && nodeValue <= mod.max)
            })
          } else {
            matchingModalities = $scope.modalities.filter(function(mod){
              return (nodeValue >= mod.min && nodeValue < mod.max)
                || (mod.highest && nodeValue >= mod.min && nodeValue <= mod.max * 1.0000000001)
            })
          }
          if (matchingModalities.length == 0) {
            console.error('[Error] node ', nid, 'cannot be found in the scale of ', $scope.attribute.name, nodeValue)
            return
          }
          if (matchingModalities.length > 1) {
            console.warn('Node ', nid, 'matches several modality ranges of ', $scope.attribute.name, matchingModalities)
          }
          return $scope.modalitiesSelection[matchingModalities[0].value]
        }
      } else {
        // All unchecked: show all
        $scope.nodeFilter = function(){ return true }
      }

      // Node filter imprint (used in URLs)
      $scope.nodeFilterImprint = $scope.modalities
        .map(function(mod){
          return $scope.modalitiesSelection[mod.value]
        })
        .join(',')
    }
  }

  function updateLocationPath() {
  	$location.search('panel', $scope.panel || null)
  	$location.search('q', $scope.search || null)
  }
})
