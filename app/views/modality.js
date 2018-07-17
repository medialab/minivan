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
      buildAllSortedNodes()
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
    saveAs(blob, $scope.networkData.title + " - " + $scope.modality.value + ".gexf");
  }

  $scope.downloadMatrix = function() {
    var csv = csvBuilder.getAdjacencyMatrix($scope.attribute.id, $scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Adjacency Matrix - " + $scope.modality.value + ".csv");
  }

  $scope.downloadStats = function() {
    
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes($scope.nodeFilter, $scope.attribute.id)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - " + $scope.modality.value + " - Nodes.csv");
  }

  // Stats top nodes
  $scope.statsTopCut
  $scope.sortedNodes = {
    inside: {
      citedFromInside: [],
      citedFromOutside: [],
      pointingToInside: [],
      pointingToOutside: [],
      connectedInside: [],
      connectedOutside: []
    },
    outside: {
      citedFromInside: [],
      citedFromOutside: [],
      pointingToInside: [],
      pointingToOutside: [],
      connectedInside: [],
      connectedOutside: []
    }
  }

  $scope.$watch('statsDetailLevel', buildAllSortedNodes)

  function buildAllSortedNodes(){
    if (!$scope.attribute && !$scope.modality) { return }
    var g = networkData.g
    $scope.statsTopCut = ($scope.statsDetailLevel > 1) ? (10) : (3)
    if (g.type == 'directed' || g.type == 'mixed') {
      $scope.sortedNodes.inside.citedFromInside = buildSortedNodes('INSIDE', 'CITED_FROM', 'INSIDE')
      $scope.sortedNodes.inside.citedFromOutside = buildSortedNodes('INSIDE', 'CITED_FROM', 'OUTSIDE')
      $scope.sortedNodes.inside.pointingToInside = buildSortedNodes('INSIDE', 'POINTING_TO', 'INSIDE')
      $scope.sortedNodes.inside.pointingToOutside = buildSortedNodes('INSIDE', 'POINTING_TO', 'OUTSIDE')
      $scope.sortedNodes.outside.citedFromInside = buildSortedNodes('OUTSIDE', 'CITED_FROM', 'INSIDE')
      // $scope.sortedNodes.outside.citedFromOutside = buildSortedNodes('OUTSIDE', 'CITED_FROM', 'OUTSIDE')
      $scope.sortedNodes.outside.pointingToInside = buildSortedNodes('OUTSIDE', 'POINTING_TO', 'INSIDE')
      // $scope.sortedNodes.outside.pointingToOutside = buildSortedNodes('OUTSIDE', 'POINTING_TO', 'OUTSIDE')
    }
    if (g.type == 'undirected' || g.type == 'mixed') {
      $scope.sortedNodes.inside.connectedInside = buildSortedNodes('INSIDE', 'CONNECTED', 'INSIDE')
      $scope.sortedNodes.inside.connectedOutside = buildSortedNodes('INSIDE', 'CONNECTED', 'OUTSIDE')
      $scope.sortedNodes.outside.connectedInside = buildSortedNodes('OUTSIDE', 'CONNECTED', 'INSIDE')
      // $scope.sortedNodes.outside.connectedOutside = buildSortedNodes('OUTSIDE', 'CONNECTED', 'OUTSIDE')
    }
  }

  function buildSortedNodes(pool, mode, extremity_pool) {
    var result = g.nodes()
    var pool_condition
    var extremity_pool_condition

    // Filter pool
    if (pool == 'INSIDE') {
      pool_condition = function(nid) {
        return g.getNodeAttribute(nid, $scope.attribute.id) == $scope.modality.value
      }
    } else {
      pool_condition = function(nid) {
        return g.getNodeAttribute(nid, $scope.attribute.id) != $scope.modality.value
      }
    }
    result = result.filter(function(nid){
      return pool_condition(nid)
    })

    // Results items
    result = result.map(function(nid){
      return {
        id: nid,
        node: g.getNodeAttributes(nid)
      }
    })

    // Compute edge scores
    if (extremity_pool == 'INSIDE') {
      extremity_pool_condition = function(nid) {
        return g.getNodeAttribute(nid, $scope.attribute.id) == $scope.modality.value
      }
    } else {
      extremity_pool_condition = function(nid) {
        return g.getNodeAttribute(nid, $scope.attribute.id) != $scope.modality.value
      }
    }
    if (mode == 'CITED_FROM') {
      result.forEach(function(item){
        item.score = g.inEdges(item.id)
          .filter(function(eid){
            return extremity_pool_condition(g.source(eid))
          })
          .length
      })
    } else if (mode == 'POINTING_TO') {
      result.forEach(function(item){
        item.score = g.outEdges(item.id)
          .filter(function(eid){
            return extremity_pool_condition(g.target(eid))
          })
          .length
      })
    } else {
      result.forEach(function(item){
        item.score = g.edges(item.id)
          .filter(function(eid){
            return extremity_pool_condition(g.opposite(eid))
          })
          .length
      })
    }
    result = result.filter(function(item){ return item.score > 0 }) // Ignore if 0 edges
    result.sort(function(a, b){
      return b.score - a.score
    })

    if (result.length > $scope.statsTopCut) {
      result = result.filter(function(item, i){
        return i < $scope.statsTopCut || item.score == result[$scope.statsTopCut - 1].score
      })
    }
    return result
  }

  // Other functions

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
