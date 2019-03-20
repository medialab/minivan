'use strict'

angular
  .module('app.modalities-ranking', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/ranking/:attribute/modalities', {
        templateUrl: 'views/modalities-ranking.html',
        controller: 'ModalitiesRankingController',
        reloadOnSearch: false
      })
      $routeProvider.when('/ranking-size/:attribute/modalities', {
        templateUrl: 'views/modalities-ranking.html',
        controller: 'ModalitiesRankingController',
        reloadOnSearch: false
      })
      $routeProvider.when('/ranking-color/:attribute/modalities', {
        templateUrl: 'views/modalities-ranking.html',
        controller: 'ModalitiesRankingController',
        reloadOnSearch: false
      })
    }
  ])

  .controller('ModalitiesRankingController', function(
    $scope,
    $location,
    $timeout,
    $route,
    $routeParams,
    $mdSidenav,
    dataLoader,
    csvBuilder,
    scalesUtils,
    $filter,
    userCache
  ) {
    $scope.panel = $location.search().panel || 'map'
    $scope.search = $location.search().q
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.matrixDetailLevel = userCache.get('matrixDetailLevel', 1)
    $scope.modalityListDetailLevel = userCache.get('modalityListDetailLevel', 1)
    $scope.statsDetailLevel = userCache.get('statsDetailLevel', 1)
    $scope.decileMode = false
    $scope.selectedNode = null
    $scope.$watch('panel', updateLocationPath)
    $scope.$watch('search', updateLocationPath)
    $scope.$watch('modalitiesSelection', updateNodeFilter, true)
    $scope.$watch('matrixDetailLevel', updateMatrixDetailLevel)
    $scope.$watch('modalityListDetailLevel', updateModalityListDetailLevel)
    $scope.$watch('statsDetailLevel', updateStatsDetailLevel)
    $scope.$watch('decileMode', updateModalities, true)
    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
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
        updateModalities()
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

    $scope.downloadModalities = function() {
      var csv = csvBuilder.getRankingModalities($scope.modalities)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - Modalities of ' +
          $scope.attribute.name +
          '.csv'
      )
    }

    $scope.downloadStats = function() {
      var csv = d3.csvFormat($scope.distributionData)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(
        blob,
        $scope.networkData.title +
          ' - Distribution of ' +
          $scope.attribute.name +
          '.csv'
      )
    }

    $scope.downloadNodeList = function() {
      var csv = csvBuilder.getNodes($scope.nodeFilter)
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, $scope.networkData.title + ' - Nodes.csv')
    }

    function updateModalities() {
      if ($scope.networkData.loaded && $scope.attribute) {
        $scope.modalities = scalesUtils.buildModalities(
          $scope.attribute,
          $scope.decileMode
        )
        $scope.modalitiesSelection = {}
        $scope.modalities.forEach(function(mod) {
          $scope.modalitiesSelection[mod.value] = false
        })
        $scope.maxModCount = d3.max(
          $scope.modalities.map(function(mod) {
            return mod.count
          })
        )
      }
    }

    function updateNodeFilter() {
      if ($scope.attribute) {
        if (
          $scope.modalities.some(function(mod) {
            return $scope.modalitiesSelection[mod.value]
          })
        ) {
          $scope.nodeFilter = function(nid) {
            var nodeValue = $scope.networkData.g.getNodeAttribute(
              nid,
              $scope.attribute.id
            )
            var matchingModalities
            if ($scope.attribute.integer) {
              matchingModalities = $scope.modalities.filter(function(mod) {
                return nodeValue >= mod.min && nodeValue <= mod.max
              })
            } else {
              matchingModalities = $scope.modalities.filter(function(mod) {
                return (
                  (nodeValue >= mod.min && nodeValue < mod.max) ||
                  (mod.highest &&
                    nodeValue >= mod.min &&
                    nodeValue <= mod.max * 1.0000000001)
                )
              })
            }
            if (matchingModalities.length == 0) {
              console.error(
                '[Error] node ',
                nid,
                'cannot be found in the scale of ',
                $scope.attribute.name,
                nodeValue
              )
              return
            }
            if (matchingModalities.length > 1) {
              console.warn(
                'Node ',
                nid,
                'matches several modality ranges of ',
                $scope.attribute.name,
                matchingModalities
              )
            }
            return $scope.modalitiesSelection[matchingModalities[0].value]
          }
        } else {
          // All unchecked: show all
          $scope.nodeFilter = function() {
            return true
          }
        }

        // Node filter imprint (used in URLs)
        var arrayOfRanges = $scope.modalities
          .filter(function(mod) {
            return $scope.modalitiesSelection[mod.value]
          })
          .map(function(mod) {
            return [mod.min, mod.max]
          })
        // Note: here we could simplify the array of ranges
        $scope.nodeFilterImprint = JSON.stringify(arrayOfRanges)
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
