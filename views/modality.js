'use strict'

angular
  .module('app.modality', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/partition/:attribute/modality/', {
        templateUrl: 'views/modality.html',
        controller: 'ModalityController',
        reloadOnSearch: false
      })
    }
  ])

  .controller('ModalityController', function(
    $scope,
    $location,
    $timeout,
    $route,
    $routeParams,
    $mdSidenav,
    dataLoader,
    csvBuilder,
    userCache,
    remarkableNodes
  ) {
    $scope.panel = $location.search().panel || 'map'
    $scope.search = $location.search().q
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.matrixDetailLevel = userCache.get('matrixDetailLevel', 1)
    $scope.modalityListDetailLevel = userCache.get('modalityListDetailLevel', 1)
    $scope.statsDetailLevel = userCache.get('statsDetailLevel', 1)
    $scope.selectedNode = null
    $scope.statsTopCut
    $scope.sortedNodes
    $scope.$watch('panel', updateLocationPath)
    $scope.$watch('search', updateLocationPath)
    $scope.$watch('matrixDetailLevel', updateMatrixDetailLevel)
    $scope.$watch('modalityListDetailLevel', updateModalityListDetailLevel)
    $scope.$watch('statsDetailLevel', updateStatsDetailLevel)
    $scope.$watch('statsDetailLevel', buildAllSortedNodes)
    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
        $scope.modality = Object.values($scope.attribute.modalities).filter(
          function(mod) {
            return mod.value == $location.search().m
          }
        )[0]
        $scope.modalityFlow =
          $scope.attribute.modalities[$scope.modality.value].flow[
            $scope.modality.value
          ]
        if ($scope.attribute.type !== 'partition') {
          console.error(
            '[ERROR] The type of attribute "' +
              $scope.attribute.name +
              '" is not "partition".',
            $scope.attribute
          )
        }
        updateNodeFilter()
        buildAllSortedNodes()
      }
    })

    $scope.networkNodeClick = function(nid) {
      console.log('Click on', nid)
      $scope.selectedNode = $scope.networkData.g.getNodeAttributes(nid)
      $mdSidenav('node-sidenav').open()
    }

    $scope.downloadGEXF = function() {
      var xml = Graph.library.gexf.write($scope.getRenderer().graph)
      var blob = new Blob([xml], { type: 'text/gexf+xml;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title + ' - ' + $scope.modality.value + '.gexf'
      )
    }

    $scope.downloadMatrix = function() {
      var csv = csvBuilder.getAdjacencyMatrix(
        $scope.attribute.id,
        $scope.nodeFilter
      )
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - Adjacency Matrix - ' +
          $scope.modality.value +
          '.csv'
      )
    }

    $scope.downloadStats = function() {
      // Density
      var density
      if (g.type == 'directed') {
        density = Graph.library.metrics.density.directedDensity(
          $scope.modality.count,
          $scope.modalityFlow.count
        )
      } else if (g.type == 'undirected') {
        density = Graph.library.metrics.density.undirectedDensity(
          $scope.modality.count,
          $scope.modalityFlow.count
        )
      } else if (g.type == 'mixed') {
        density = Graph.library.metrics.density.mixedDensity(
          $scope.modality.count,
          $scope.modalityFlow.count
        )
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
      mdLines.push(
        '\nInternal: ' +
          $scope.attribute.modalities[$scope.modality.value]
            .internalNormalizedDensity
      )
      mdLines.push(
        '\nExternal: ' +
          $scope.attribute.modalities[$scope.modality.value]
            .externalNormalizedDensity
      )
      mdLines.push('\n')
      mdLines.push('\n## Inbound vs. Outbound connectivity')
      mdLines.push('\n')
      mdLines.push('\n### Number of links')
      mdLines.push(
        '\nInbound links:  ' +
          $scope.attribute.modalities[$scope.modality.value].inboundEdges
      )
      mdLines.push(
        '\nOutbound links: ' +
          $scope.attribute.modalities[$scope.modality.value].outboundEdges
      )
      mdLines.push('\n')
      mdLines.push('\n### Normalized density (ND)')
      mdLines.push(
        '\nInbound ND:  ' +
          $scope.attribute.modalities[$scope.modality.value]
            .inboundNormalizedDensity
      )
      mdLines.push(
        '\nOutbound ND: ' +
          $scope.attribute.modalities[$scope.modality.value]
            .outboundNormalizedDensity
      )
      mdLines.push('\n')
      mdLines.push('\n## Connectivity Balance Breakdown')
      mdLines.push(
        '\nWhich other modalities cite and are cited by ' +
          $scope.modality.value +
          '.'
      )
      mdLines.push(
        '\nExpressed both in number of links and normalized density (ND).'
      )
      mdLines.push('\n')
      mdLines.push('\nNote: tab separated, can be copy-pasted in a spreadsheet')
      mdLines.push('\n')
      mdLines.push(
        '\nOther modality\tEdges to original modality\tND to original modality\tEdges from original modality\tND from original modality'
      )
      var sortedValues = Object.values($scope.attribute.modalities)
        .slice(0)
        .sort(function(v1, v2) {
          return (
            $scope.attribute.modalities[v2].nodes -
            $scope.attribute.modalities[v1].nodes
          )
        })
      sortedValues
        .filter(function(v2) {
          return v2 != $scope.modality.value
        })
        .map(function(v2) {
          return {
            label: v2,
            ndToVal:
              $scope.attribute.modalities[v2].flow[$scope.modality.value].nd,
            linksToVal:
              $scope.attribute.modalities[v2].flow[$scope.modality.value].count,
            ndFromVal:
              $scope.attribute.modalities[$scope.modality.value].flow[v2].nd,
            linksFromVal:
              $scope.attribute.modalities[$scope.modality.value].flow[v2].count
          }
        })
        .forEach(function(d) {
          mdLines.push(
            '\n' +
              d.label +
              '\t' +
              d.linksToVal +
              '\t' +
              d.ndToVal +
              '\t' +
              d.linksFromVal +
              '\t' +
              d.ndFromVal +
              ''
          )
        })
      mdLines.push('\n')
      mdLines.push('\n## Remarkable nodes')
      mdLines.push('\n')
      if ($scope.sortedNodes.inside.citedFromInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' ENDO-CITED - Nodes of original modality most cited from original modality'
        )
        $scope.sortedNodes.inside.citedFromInside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges from original modality: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.inside.citedFromOutside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXO-CITED - Nodes of original modality most cited from other modalities'
        )
        $scope.sortedNodes.inside.citedFromOutside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges from other modalities: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.inside.pointingToInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' ENDO-CITING - Nodes of original modality most pointing to original modality'
        )
        $scope.sortedNodes.inside.pointingToInside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges to original modality: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.inside.pointingToOutside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXO-CITING - Nodes of original modality most pointing to other modalities'
        )
        $scope.sortedNodes.inside.pointingToOutside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges to other modalities: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.inside.connectedInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' ENDO-CONNECTED - Nodes of original modality most tied to original modality'
        )
        $scope.sortedNodes.inside.connectedInside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges with original modality: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.inside.connectedOutside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXO-CONNECTED - Nodes of original modality most tied to other modalities'
        )
        $scope.sortedNodes.inside.connectedOutside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nEdges with other modalities: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.outside.citedFromInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXTERNAL-TARGETS - Nodes of other modalities most cited from original modality'
        )
        $scope.sortedNodes.outside.citedFromInside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nModality:   ' + d.node[$scope.attribute.id])
          mdLines.push('\nEdges from original modality: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.outside.pointingToInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXTERNAL-SOURCES - Nodes of other modalities most pointing to original modality'
        )
        $scope.sortedNodes.outside.pointingToInside.forEach(function(d) {
          mdLines.push('\n')
          mdLines.push('\nNode label: ' + d.node.label)
          mdLines.push('\nModality:   ' + d.node[$scope.attribute.id])
          mdLines.push('\nEdges to original modality: ' + d.score)
        })
        mdLines.push('\n')
      }
      if ($scope.sortedNodes.outside.connectedInside.length > 0) {
        mdLines.push('\n')
        mdLines.push(
          '\n### Top ' +
            $scope.statsTopCut +
            ' EXTERNAL-NEIGHBORS - Nodes of other modalities most tied to original modality'
        )
        $scope.sortedNodes.outside.connectedInside.forEach(function(d) {
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

      var blob = new Blob(mdLines, { type: 'text;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - Statistics of ' +
          $scope.attribute.name +
          ' = ' +
          $scope.modality.value +
          '.txt'
      )
    }

    $scope.downloadNodeList = function() {
      var csv = csvBuilder.getNodes($scope.nodeFilter, $scope.attribute.id)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - ' +
          $scope.modality.value +
          ' - Nodes.csv'
      )
    }

    function buildAllSortedNodes() {
      if (!$scope.attribute && !$scope.modality) {
        return
      }

      $scope.statsTopCut = $scope.statsDetailLevel > 1 ? 10 : 3
      $scope.sortedNodes = remarkableNodes.getData(
        $scope.attribute,
        $scope.modality,
        $scope.statsTopCut
      )
    }

    function updateNodeFilter() {
      if ($scope.attribute) {
        $scope.nodeFilter = function(nid) {
          return (
            $scope.modality.value ==
            $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
          )
        }

        // Node filter imprint (used in URLs)
        $scope.nodeFilterImprint = Object.values($scope.attribute.modalities)
          .map(function(mod) {
            return mod.value == $scope.modality.value
          })
          .join(',')
      }
    }

    function updateLocationPath() {
      $location.search('panel', $scope.panel || null)
      $location.search('q', $scope.search || null)
    }

    function updateMatrixDetailLevel() {
      userCache.set('matrixDetailLevel', $scope.matrixDetailLevel)
    }
    function updateModalityListDetailLevel() {
      userCache.set('modalityListDetailLevel', $scope.modalityListDetailLevel)
    }
    function updateStatsDetailLevel() {
      userCache.set('statsDetailLevel', $scope.statsDetailLevel)
    }
  })
