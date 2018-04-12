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
      }


    }
  }
})


