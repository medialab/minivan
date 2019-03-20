'use strict'

angular
  .module('app.range', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/ranking/:attribute/range/:rangeMin/:rangeMax', {
        templateUrl: 'views/range.html',
        controller: 'RangeController',
        reloadOnSearch: false
      })
    }
  ])

  .controller('RangeController', function(
    $scope,
    $location,
    $timeout,
    $route,
    $routeParams,
    $filter,
    $mdSidenav,
    dataLoader,
    csvBuilder,
    remarkableNodes,
    userCache
  ) {
    $scope.panel = $location.search().panel || 'map'
    $scope.search = $location.search().q
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.matrixDetailLevel = userCache.get('matrixDetailLevel', 1)
    $scope.modalityListDetailLevel = userCache.get('modalityListDetailLevel', 1)
    $scope.statsDetailLevel = userCache.get('statsDetailLevel', 1)
    $scope.selectedNode = null

    $scope.$watch('panel', updateLocationPath)
    $scope.$watch('search', updateLocationPath)
    $scope.$watch('matrixDetailLevel', updateMatrixDetailLevel)
    $scope.$watch('modalityListDetailLevel', updateModalityListDetailLevel)
    $scope.$watch('statsDetailLevel', updateStatsDetailLevel)
    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
        $scope.rangeMin = +$routeParams.rangeMin
        $scope.rangeMax = +$routeParams.rangeMax
        if (
          $scope.attribute.type !== 'ranking-size' &&
          $scope.attribute.type !== 'ranking-color'
        ) {
          console.error(
            '[ERROR] The type of attribute "' +
              $scope.attribute.name +
              '" is not "ranking-size" or "ranking-color".',
            $scope.attribute
          )
        }
        updateNodeFilter()
        // Subgraph
        var g = $scope.networkData.g
        $scope.subgraph = g.copy()
        $scope.subgraph.nodes().forEach(function(nid) {
          if (!$scope.nodeFilter(nid)) {
            $scope.subgraph.dropNode(nid)
          }
        })
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
        $scope.networkData.title +
          ' - ' +
          $scope.attribute.id +
          ' - ' +
          $filter('number')($scope.rangeMin) +
          ' to ' +
          $filter('number')($scope.rangeMax) +
          '.gexf'
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
          $scope.attribute.id +
          ' - ' +
          $filter('number')($scope.rangeMin) +
          ' to ' +
          $filter('number')($scope.rangeMax) +
          '.csv'
      )
    }

    $scope.downloadNodeList = function() {
      var csv = csvBuilder.getNodes($scope.nodeFilter, $scope.attribute.id)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - ' +
          $scope.attribute.id +
          ' - ' +
          $filter('number')($scope.rangeMin) +
          ' to ' +
          $filter('number')($scope.rangeMax) +
          ' - Nodes.csv'
      )
    }

    function updateNodeFilter() {
      if ($scope.attribute) {
        $scope.nodeFilter = function(nid) {
          var val = +$scope.networkData.g.getNodeAttribute(
            nid,
            $scope.attribute.id
          )
          return $scope.rangeMin <= val && val <= $scope.rangeMax
        }

        // Node filter imprint (used in URLs)
        $scope.nodeFilterImprint = JSON.stringify([
          [$scope.rangeMin, $scope.rangeMax]
        ])
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
