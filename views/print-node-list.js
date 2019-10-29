'use strict'

angular
  .module('app.print-node-list', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-node-list', {
        templateUrl: 'views/print-node-list.html',
        controller: 'PrintNodeListController'
      })
    }
  ])

  .controller('PrintNodeListController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.colorAttId = $location.search().color
    $scope.sizeAttId = $location.search().size
    $scope.selectedAttId = $location.search().att

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData && $scope.networkData.g) {
        var g = $scope.networkData.g
        $scope.nodes = g.nodes().slice(0)
        scalesUtils.sortNodes($scope.nodes)
        $scope.nodes = $scope.nodes.map(function(nid) {
          return g.getNodeAttributes(nid)
        })
        update()
      }
    })

    function update() {
      $scope.att = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
      if ($scope.colorAttId) {
        var colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
        if (colorAtt.type == 'partition') {
          var colorByModality = {}
          Object.values(colorAtt.modalities).forEach(function(m) {
            colorByModality[m.value] = m.color
          })
          var colorScale = function(val) {
            return colorByModality[val] || '#999'
          }
          $scope.getColor = function(n) {
            return colorScale(n[$scope.colorAttId])
          }
        } else if (colorAtt.type == 'ranking-color') {
          var colorScale = scalesUtils.getColorScale(
            colorAtt.min,
            colorAtt.max,
            colorAtt.colorScale
          )
          var colorScale_string = function(val) {
            return colorScale(val).toString()
          }
          $scope.getColor = function(n) {
            return colorScale_string(n[$scope.colorAttId])
          }
        } else {
          console.error('Unknown color attribute type:', colorAtt.type)
        }
      } else {
        $scope.getColor = function(n) {
          return '#999'
        }
      }

      if ($scope.sizeAttId) {
        var sizeAtt = $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
        var areaScale = scalesUtils.getAreaScale(
          sizeAtt.min,
          sizeAtt.max,
          sizeAtt.areaScaling.min,
          sizeAtt.areaScaling.max,
          sizeAtt.areaScaling.interpolation
        )
        var rScale = scalesUtils.getRScale()
        var rMax = rScale(1)
        $scope.getRadius = function(n) {
          return (rScale(areaScale(n[$scope.sizeAttId])) * 20) / rMax
        }
      } else {
        $scope.getRadius = function(n) {
          return 16
        }
      }
    }
  })
