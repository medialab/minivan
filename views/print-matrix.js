'use strict'

angular
  .module('app.print-matrix', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-matrix', {
        templateUrl: 'views/print-matrix.html',
        controller: 'PrintMatrixController'
      })
    }
  ])

  .controller('PrintMatrixController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.selectedAttId = $location.search().att
    $scope.matrixDetailLevel = +$location.search().detail
    $scope.viewBox = {
      x: +$location.search().x,
      y: +$location.search().y,
      w: +$location.search().w,
      h: +$location.search().h
    }

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData && $scope.networkData.g) {
        update()
      }
    })

    function update() {
      $scope.attribute =
        $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]

      // Rebuild node filter
      // All unchecked / default: show all
      $scope.nodeFilter = function() {
        return true
      }
      $scope.modalityFilter = function() {
        return true
      }
      if ($scope.attribute && $scope.attribute.type == 'partition') {
        $scope.modalitiesSelection = {}
        var modSelection = ($location.search().filter || '')
          .split(',')
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
          var modalities = Object.values($scope.attribute.modalities).filter(
            function(mod) {
              return $scope.modalitiesSelection[mod.value]
            }
          )
          if (modalities.length == 1) {
            $scope.modality = modalities[0]
          }
        }
      } else if (
        $scope.attribute &&
        ($scope.attribute.type == 'ranking-size' ||
          $scope.attribute.type == 'ranking-color')
      ) {
        // Rebuild modalities
        $scope.modalities = scalesUtils.buildModalities($scope.attribute)

        // Rebuild node filter
        $scope.ranges = JSON.parse($location.search().filter)
        if ($scope.ranges.length > 0) {
          $scope.nodeFilter = function(nid) {
            var nodeValue = $scope.networkData.g.getNodeAttribute(
              nid,
              $scope.attribute.id
            )
            return $scope.ranges.some(function(range) {
              return nodeValue >= range[0] && nodeValue <= range[1]
            })
          }
        } else {
          // All unchecked: show all
          $scope.nodeFilter = function() {
            return true
          }
        }
      }

      var g = $scope.networkData.g
      $scope.nodes = g.nodes().filter($scope.nodeFilter)
      scalesUtils.sortNodes($scope.nodes, $scope.attributeId)
      $scope.nodes = $scope.nodes.map(function(nid) {
        return g.getNodeAttributes(nid)
      })
    }
  })
