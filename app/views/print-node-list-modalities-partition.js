'use strict'

angular
  .module('app.print-node-list-modalities-partition', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-node-list-modalities-partition', {
        templateUrl: 'views/print-node-list-modalities-partition.html',
        controller: 'PrintNodeListModalitiesPartitionController'
      })
    }
  ])

  .controller('PrintNodeListModalitiesPartitionController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.attributeId = $location.search().att

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]

        // Rebuild node filter
        $scope.modalitiesSelection = {}
        var modSelection = $location
          .search()
          .filter.split(',')
          .map(function(d) {
            return d == 'true'
          })
        Object.values($scope.attribute.modalities).forEach(function(mod, i) {
          $scope.modalitiesSelection[mod.value] = modSelection[i]
        })
        if (
          Object.values($scope.attribute.modalities).some(function(mod) {
            return $scope.modalitiesSelection[mod.value]
          })
        ) {
          $scope.nodeFilter = function(nid) {
            return $scope.modalitiesSelection[
              $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
            ]
          }
          $scope.modalityFilter = function(modValue) {
            return $scope.modalitiesSelection[modValue]
          }
        } else {
          // All unchecked: show all
          $scope.nodeFilter = function() {
            return true
          }
          $scope.modalityFilter = function() {
            return true
          }
        }

        var g = $scope.networkData.g
        $scope.nodes = g.nodes().filter($scope.nodeFilter)
        scalesUtils.sortNodes($scope.nodes, $scope.attributeId)
        $scope.nodes = $scope.nodes.map(function(nid) {
          return g.getNodeAttributes(nid)
        })

        update()
      }
    })

    function update() {
      var colorByModality = {}
      Object.values($scope.attribute.modalities).forEach(function(m) {
        colorByModality[m.value] = m.color
      })
      var colorScale = function(val) {
        return colorByModality[val] || '#999'
      }
      $scope.getColor = function(n) {
        return colorScale(n[$scope.attributeId])
      }

      $scope.getRadius = function(n) {
        return 16
      }
    }
  })
