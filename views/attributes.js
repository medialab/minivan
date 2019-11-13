'use strict'

angular
  .module('app.attributes', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/attributes', {
        templateUrl: 'views/attributes.html',
        controller: 'AttributesController',
        reloadOnSearch: false
      })
    }
  ])

  .controller('AttributesController', function(
    $scope,
    $location,
    $timeout,
    $route,
    $routeParams,
    $mdSidenav,
    dataLoader,
    csvBuilder,
    userCache
  ) {
    $scope.panel = $location.search().panel || 'map'
    $scope.search = $location.search().q
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.attributeListDetailLevel = userCache.get(
      'attributeListDetailLevel',
      1
    )
    $scope.matrixDetailLevel = userCache.get('matrixDetailLevel', 1)
    $scope.statsDetailLevel = userCache.get('statsDetailLevel', 1)
    $scope.selectedAttId = undefined
    $scope.nodeSizeAttId = undefined
    $scope.nodeColorAttId = undefined
    $scope.sizePlusColor = false
    $scope.selectedNode = null
    $scope.attributeList = []
    $scope.$watch('panel', updateLocationPath)
    $scope.$watch('search', updateLocationPath)
    $scope.$watch('attributeListDetailLevel', updateAttributeListDetailLevel)
    $scope.$watch('matrixDetailLevel', updateMatrixDetailLevel)
    $scope.$watch('statsDetailLevel', updateStatsDetailLevel)

    // In a perfect world, the edge properties are displayed as well.
    $scope.$watch('selectedAttId', function(
      newSelectedAttId,
      oldSelectedAttId
    ) {
      if ($scope.selectedAttId) {
        var selectedAtt =
          $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
        if (selectedAtt) {
          if (
            selectedAtt.type == 'partition' ||
            selectedAtt.type == 'ranking-color'
          ) {
            $scope.nodeColorAttId = selectedAtt.id
            if (!$scope.sizePlusColor) {
              $scope.nodeSizeAttId = undefined
            }
          } else if (selectedAtt.type == 'ranking-size') {
            $scope.nodeSizeAttId = selectedAtt.id
            if (!$scope.sizePlusColor) {
              $scope.nodeColorAttId = undefined
            }
          }
        }
      } else {
        if (oldSelectedAttId) {
          // Remove previous selected att
          var oldSelectedAtt =
            $scope.networkData.nodeAttributesIndex[oldSelectedAttId]
          if (
            oldSelectedAtt.type == 'partition' ||
            oldSelectedAtt.type == 'ranking-color'
          ) {
            $scope.nodeColorAttId = undefined
          } else if (oldSelectedAtt.type == 'ranking-size') {
            $scope.nodeSizeAttId = undefined
          }
        }
        if ($scope.nodeColorAttId) {
          $scope.selectedAttId = $scope.nodeColorAttId
        } else if ($scope.nodeSizeAttId) {
          $scope.selectedAttId = $scope.nodeSizeAttId
        }
      }
    })

    $scope.$watch('nodeSizeAttId', function(newSizeAttId, oldSizeAttId) {
      if (newSizeAttId === undefined && $scope.selectedAttId == oldSizeAttId) {
        $scope.selectedAttId = undefined
      }
    })

    $scope.$watch('nodeColorAttId', function(newColorAttId, oldColorAttId) {
      if (
        newColorAttId === undefined &&
        $scope.selectedAttId == oldColorAttId
      ) {
        $scope.selectedAttId = undefined
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
      saveAs(blob, $scope.networkData.title + '.gexf')
    }

    $scope.downloadMatrix = function() {
      var csv = csvBuilder.getAdjacencyMatrix($scope.selectedAttId)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, $scope.networkData.title + ' - Adjacency Matrix.csv')
    }

    $scope.downloadAttributes = function() {
      var csv = csvBuilder.getAttributes()
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, $scope.networkData.title + ' - Attributes.csv')
    }

    $scope.downloadNodeList = function() {
      var csv = csvBuilder.getNodes()
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, $scope.networkData.title + ' - Nodes.csv')
    }

    function updateLocationPath() {
      $location.search('panel', $scope.panel || null)
      $location.search('q', $scope.search || null)
    }

    function updateAttributeListDetailLevel() {
      userCache.set('attributeListDetailLevel', $scope.attributeListDetailLevel)
    }
    function updateMatrixDetailLevel() {
      userCache.set('matrixDetailLevel', $scope.matrixDetailLevel)
    }
    function updateStatsDetailLevel() {
      userCache.set('statsDetailLevel', $scope.statsDetailLevel)
    }
  })
