'use strict'

angular
  .module('app.print-node-list-modalities-ranking', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-node-list-modalities-ranking', {
        templateUrl: 'views/print-node-list-modalities-ranking.html',
        controller: 'PrintNodeListModalitiesRankingController'
      })
    }
  ])

  .controller('PrintNodeListModalitiesRankingController', function(
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

        // Rebuild modalities
        $scope.modalities = scalesUtils.buildModalities(
          $scope.attribute,
          $location.search().deciles == 'true'
        )
        $scope.modalityFilter = function() {
          return true
        } // Legend shows all sizes anyway

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
      /*var colorByModality = {}
    $scope.modalities.forEach(function(m){
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
    }*/

      if ($scope.attribute.type == 'ranking-color') {
        var colorScale = scalesUtils.getColorScale(
          $scope.attribute.min,
          $scope.attribute.max,
          $scope.attribute.colorScale
        )
        var colorScale_string = function(val) {
          return colorScale(val).toString()
        }
        $scope.getColor = function(n) {
          return colorScale_string(n[$scope.attribute.id])
        }
      } else {
        $scope.getColor = function(n) {
          return '#999'
        }
      }

      if ($scope.attribute.type == 'ranking-size') {
        var areaScale = scalesUtils.getAreaScale(
          $scope.attribute.min,
          $scope.attribute.max,
          $scope.attribute.areaScaling.min,
          $scope.attribute.areaScaling.max,
          $scope.attribute.areaScaling.interpolation
        )
        var rScale = scalesUtils.getRScale()
        var rMax = rScale(1)
        $scope.getRadius = function(n) {
          return (rScale(areaScale(n[$scope.attribute.id])) * 20) / rMax
        }
      } else {
        $scope.getRadius = function(n) {
          return 16
        }
      }
    }
  })
