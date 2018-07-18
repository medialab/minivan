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
      $scope.modalityFlow = $scope.attribute.data.modalityFlow[$scope.modality.value][$scope.modality.value]
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
    console.log('$scope.attribute', $scope.attribute)
    console.log('$scope.modality', $scope.modality)
    // Density
    var density
    if (g.type == 'directed') {
      density = Graph.library.metrics.density.directedDensity($scope.modality.count, $scope.modalityFlow.count)
    } else if(g.type == 'undirected') {
      density = Graph.library.metrics.density.undirectedDensity($scope.modality.count, $scope.modalityFlow.count)
    } else if(g.type == 'mixed') {
      density = Graph.library.metrics.density.mixedDensity($scope.modality.count, $scope.modalityFlow.count)
    }

    var mdLines = []
    mdLines.push('# Modality statistics')
    mdLines.push('\n')
    mdLines.push('\nAttribute: ' + $scope.attribute.name)
    mdLines.push('\nModality:  ' + $scope.modality.value)
    mdLines.push('\n')
    mdLines.push('\n## Profile of the modality subgraph')
    mdLines.push('\n')
    mdLines.push('\nNodes:   ' + $scope.modality.count)
    mdLines.push('\nEdges:   ' + $scope.modalityFlow.count)
    mdLines.push('\nDensity: ' + density)
    mdLines.push('\nNormalized internal density: ' + $scope.modalityFlow.nd)
    mdLines.push('\n')
    mdLines.push('\n## Internal vs. External connectivity')
    mdLines.push('\n')
    mdLines.push('\nInternal: ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].internalNDensity)
    mdLines.push('\nExternal: ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].externalNDensity)
    mdLines.push('\n')
    mdLines.push('\n## Inbound vs. Outbound connectivity')
    mdLines.push('\n')
    mdLines.push('\n### Number of links')
    mdLines.push('\nInbound links:  ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].inboundLinks)
    mdLines.push('\nOutbound links: ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].outboundLinks)
    mdLines.push('\n')
    mdLines.push('\n### Normalized density (ND)')
    mdLines.push('\nInbound ND:  ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].inboundNDensity)
    mdLines.push('\nOutbound ND: ' + $scope.attribute.data.modalitiesIndex[$scope.modality.value].outboundNDensity)
    mdLines.push('\n')
    mdLines.push('\n## Connectivity Balance Breakdown')
    mdLines.push('\nWhich other modalities cite and are cited by ' + $scope.modality.value + '.')
    mdLines.push('\nExpressed both in number of links and normalized density (ND).')
    mdLines.push('\n')
    mdLines.push('\nNote: tab separated, can be copy-pasted in a spreadsheet')
    mdLines.push('\n')
    mdLines.push('\nOther modality\tEdges to original modality\tND to original modality\tEdges from original modality\tND from original modality')
    var sortedValues = $scope.attribute.data.modalities.slice(0).sort(function(v1, v2){
      return $scope.attribute.data.modalitiesIndex[v2].nodes - $scope.attribute.data.modalitiesIndex[v1].nodes
    })
    sortedValues
      .filter(function(v2){ return v2 != $scope.modality.value })
      .map(function(v2){
        return {
          label: v2,
          ndToVal: $scope.attribute.data.modalityFlow[v2][$scope.modality.value].nd,
          linksToVal: $scope.attribute.data.modalityFlow[v2][$scope.modality.value].count,
          ndFromVal: $scope.attribute.data.modalityFlow[$scope.modality.value][v2].nd,
          linksFromVal: $scope.attribute.data.modalityFlow[$scope.modality.value][v2].count
        }
      })
      .forEach(function(d){
        mdLines.push('\n' + d.label + '\t' + d.linksToVal + '\t' + d.ndToVal + '\t' + d.linksFromVal + '\t' + d.ndFromVal + '')
      })
    mdLines.push('\n')
    mdLines.push('\n## Remarkable nodes')
    mdLines.push('\n')
    if ($scope.sortedNodes.inside.citedFromInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' ENDO-CITED - Nodes of original modality most cited from original modality')
      $scope.sortedNodes.inside.citedFromInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges from original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.inside.citedFromOutside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXO-CITED - Nodes of original modality most cited from other modalities')
      $scope.sortedNodes.inside.citedFromOutside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges from other modalities: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.inside.pointingToInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' ENDO-CITING - Nodes of original modality most pointing to original modality')
      $scope.sortedNodes.inside.pointingToInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges to original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.inside.pointingToOutside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXO-CITING - Nodes of original modality most pointing to other modalities')
      $scope.sortedNodes.inside.pointingToOutside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges to other modalities: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.inside.connectedInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' ENDO-CONNECTED - Nodes of original modality most tied to original modality')
      $scope.sortedNodes.inside.connectedInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges with original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.inside.connectedOutside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXO-CONNECTED - Nodes of original modality most tied to other modalities')
      $scope.sortedNodes.inside.connectedOutside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nEdges with other modalities: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.outside.citedFromInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXTERNAL-TARGETS - Nodes of other modalities most cited from original modality')
      $scope.sortedNodes.outside.citedFromInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nModality:   ' + d.node[$scope.attribute.id])
        mdLines.push('\nEdges from original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.outside.pointingToInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXTERNAL-SOURCES - Nodes of other modalities most pointing to original modality')
      $scope.sortedNodes.outside.pointingToInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nModality:   ' + d.node[$scope.attribute.id])
        mdLines.push('\nEdges to original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    if ($scope.sortedNodes.outside.connectedInside.length > 0) {
      mdLines.push('\n')
      mdLines.push('\n### Top ' + $scope.statsTopCut + ' EXTERNAL-NEIGHBORS - Nodes of other modalities most tied to original modality')
      $scope.sortedNodes.outside.connectedInside.forEach(function(d){
        mdLines.push('\n')
        mdLines.push('\nNode label: ' + d.node.label)
        mdLines.push('\nModality:   ' + d.node[$scope.attribute.id])
        mdLines.push('\nEdges edges with original modality: ' + d.score)
      })
      mdLines.push('\n')
    }
    mdLines.push('\n')
    mdLines.push('\n')
    mdLines.push('\n')
    mdLines.push('\n')
    mdLines.push('\n')

    var blob = new Blob(mdLines, {'type':'text;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Statistics of " + $scope.attribute.name + " = " + $scope.modality.value + ".txt");
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
