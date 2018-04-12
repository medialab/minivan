'use strict';

/* Services */

angular.module('app.components.matrix', [])

.directive('matrix', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    templateUrl: 'components/matrix.html',
    scope: {
      onNodeClick: '=',
      onEdgeClick: '=',
      sizeAttId: '=',
      colorAttId: '=',
      nodeFilter: '=',
      selectedAttId:'='
    },
    link: function($scope, el, attrs) {
      $scope.headlineSize = 200
      $scope.cellSize = 16
    	$scope.networkData = networkData
      $scope.$watch('networkData.loaded', function(){
        if ($scope.networkData && $scope.networkData.loaded) {
          updateNodes()
          update()
        }
      })

      $scope.$watch('colorAttId', update)
      $scope.$watch('sizeAttId', update)
      $scope.$watch('selectedAttId', update)
      $scope.$watch('nodeFilter', updateNodes)

      // Scroll listening
      var scrollSource = el[0].querySelector('#scroll-source')
      scrollSource.addEventListener('scroll', function(e){
        var targetsX = el[0].querySelectorAll('.scroll-target-x')
        targetsX.forEach(function(n){
          n.childNodes[0].scrollLeft = Math.round(scrollSource.scrollLeft)
        })

        var targetsY = el[0].querySelectorAll('.scroll-target-y')
        targetsY.forEach(function(n){
          n.childNodes[0].scrollTop = Math.round(scrollSource.scrollTop)
        })
      })


      function updateNodes() {
        var g = $scope.networkData.g
        var nodeFilter = $scope.nodeFilter || function(d){return d}
        $scope.nodes = g.nodes()
          .filter(nodeFilter)

        if ($scope.selectedAttId) {
          if ($scope.att) {
            if ($scope.att.type == 'partition') {
              var modalitiesIndex = {}
              $scope.att.modalities.forEach(function(mod, i){
                modalitiesIndex[mod.value] = i
              })
              $scope.nodes.sort(function(a, b){
                var aModIndex = modalitiesIndex[g.getNodeAttribute(a, $scope.selectedAttId)]
                var bModIndex = modalitiesIndex[g.getNodeAttribute(b, $scope.selectedAttId)]
                return aModIndex - bModIndex
              })
            } else if ($scope.att.type == 'ranking-size' || $scope.att.type == 'ranking-color') {
              $scope.nodes.sort(function(a, b){
                var aValue = +g.getNodeAttribute(a, $scope.selectedAttId)
                var bValue = +g.getNodeAttribute(b, $scope.selectedAttId)
                return bValue - aValue
              })
            }
          }
        } else {
          $scope.nodes.sort(function(a, b){
            var alabel = g.getNodeAttribute(a, 'label')
            var blabel = g.getNodeAttribute(b, 'label')
            if (alabel > blabel) return 1
            else if (alabel < blabel) return -1
            return 0
          })
        }
      }

      function update() {
        $scope.att = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
        if ($scope.colorAttId) {
          var colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
          if (colorAtt.type == 'partition') {
            var colorByModality = {}
            colorAtt.modalities.forEach(function(m){
              colorByModality[m.value] = m.color
            })
            var colorScale = function(val) {
              return colorByModality[val] || '#999'
            }
            $scope.getColor = function(n) {
              return colorScale(n[$scope.colorAttId])
            }
          } else if (colorAtt.type == 'ranking-color') {
            var colorScale = scalesUtils.getColorScale(colorAtt.min, colorAtt.max, colorAtt.colorScale)
            var colorScale_string = function(val){ return colorScale(val).toString() }
            $scope.getColor = function(n){ return colorScale_string(n[$scope.colorAttId]) }
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
          var areaScale = scalesUtils.getAreaScale(sizeAtt.min, sizeAtt.max, sizeAtt.areaScaling.min, sizeAtt.areaScaling.max, sizeAtt.areaScaling.interpolation)
          var rScale = scalesUtils.getRScale()
          var rMax = rScale(1)
          $scope.getRadius = function(n) {
            return rScale(areaScale(n[$scope.sizeAttId])) * 20 / rMax
          }
        } else {
          $scope.getRadius = function(n) {
            return 16
          }
        }

        updateNodes()
      }


    }
  }
})

/*.directive('matrixSvg', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    templateUrl: 'components/matrix.html',
    scope: {
      onNodeClick: '=',
      onEdgeClick: '=',
      sizeAttId: '=',
      colorAttId: '=',
      nodeFilter: '=',
      selectedAttId:'='
    },
    link: function($scope, el, attrs) {
      $scope.headlineSize = 200
      $scope.cellSize = 16

      $scope.networkData = networkData
      $scope.$watch('networkData.loaded', function(){
        if ($scope.networkData && $scope.networkData.loaded) {
          updateNodes()
          update()
        }
      })

      $scope.$watch('colorAttId', update)
      $scope.$watch('sizeAttId', update)
      $scope.$watch('selectedAttId', update)
      $scope.$watch('nodeFilter', updateNodes)
      
      function updateNodes() {
        var g = $scope.networkData.g
        var nodeFilter = $scope.nodeFilter || function(d){return d}
        $scope.nodes = g.nodes()
          .filter(nodeFilter)
      }
    })
  }
})*/


