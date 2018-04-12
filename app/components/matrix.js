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
        if ($scope.selectedAttId) {
          $scope.att = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
          // Color
          if ($scope.att.type == 'partition') {
            var colorByModality = {}
            $scope.att.modalities.forEach(function(m){
              colorByModality[m.value] = m.color
            })
            var colorScale = function(val) {
              return colorByModality[val] || '#999'
            }
            $scope.getColor = function(nid) {
              return colorScale($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId))
            }
          } else if ($scope.att.type == 'ranking-color') {
            var colorScale = scalesUtils.getColorScale($scope.att.min, $scope.att.max, $scope.att.colorScale)
            var colorScale_string = function(val){ return colorScale(val).toString() }
            $scope.getColor = function(nid){ return colorScale_string($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId)) }
          } else {
            $scope.getColor = function(nid) {
              return '#999'
            }
          }

          // Size
          if ($scope.att.type == 'ranking-size') {
            var areaScale = scalesUtils.getAreaScale($scope.att.min, $scope.att.max, $scope.att.areaScaling.min, $scope.att.areaScaling.max, $scope.att.areaScaling.interpolation)
            var rScale = scalesUtils.getRScale()
            var rMax = rScale(1)
            $scope.getRadius = function(nid) {
              return rScale(areaScale($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId))) * ($scope.cellSize/2 - 2) / rMax
            }
          } else {
            $scope.getRadius = function(nid) {
              return ($scope.cellSize/2 - 2)
            }
          }
        } else {
          $scope.getColor = function(nid) {
            return '#999'
          }
          $scope.getRadius = function(n) {
            return ($scope.cellSize/2 - 2)
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

.directive('matrixLine', function(
    networkData
  ){
    return {
      restrict: 'A',
      scope: {
        nodeId: '=',
        nodes: '=',
        printMode: '=',
        att: '=',
        getRadius: '=',
        getColor: '=',
        cellSize: '=',
        headlineSize: '='
      },
      templateUrl: 'components/matrixLine.html',
      link: function($scope, el, attrs) {
        $scope.$watch('nodeId', function(){
          $scope.node = networkData.g.getNodeAttributes($scope.nodeId)
          $scope.edges = $scope.nodes.map(function(nid){
            return networkData.g.edge($scope.nodeId, nid)
          })
        })
      }
    }
  })
