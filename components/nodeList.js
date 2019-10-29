'use strict'

/* Services */

angular
  .module('app.components.nodeList', [])

  .directive('nodeList', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'E',
      templateUrl: 'components/nodeList.html',
      scope: {
        search: '=',
        colorAttId: '=',
        sizeAttId: '=',
        nodeFilter: '=',
        selectedAttId: '=',
        onNodeClick: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        $scope.$watch('networkData.loaded', function() {
          if ($scope.networkData && $scope.networkData.loaded) {
            updateNodes()
            update()
          }
        })

        $scope.$watch('colorAttId', update)
        $scope.$watch('sizeAttId', update)
        $scope.$watch('selectedAttId', update)
        $scope.$watch('nodeFilter', updateNodes)

        $scope.click = function(nid) {
          if (typeof $scope.onNodeClick === 'function') {
            $scope.onNodeClick(nid)
          }
        }

        function updateNodes() {
          var g = $scope.networkData.g
          var nodeFilter =
            $scope.nodeFilter ||
            function(d) {
              return d
            }
          $scope.nodes = g.nodes().filter(nodeFilter)

          scalesUtils.sortNodes($scope.nodes, $scope.selectedAttId)

          $scope.nodes = $scope.nodes.map(function(nid) {
            return { nid: nid, data: g.getNodeAttributes(nid) }
          })
        }

        function update() {
          updateNodes()
          $scope.att =
            $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
          if ($scope.colorAttId) {
            var colorAtt =
              $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
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
                colorAtt.colorScale,
                colorAtt.invertScale,
                colorAtt.truncateScale
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
            var sizeAtt =
              $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
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
      }
    }
  })

  .directive('nodeListPic', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'components/nodeListPic.html',
      scope: {
        radius: '=',
        color: '='
      },
      link: function($scope, el, attrs) {
        /*var container = el[0]

      $scope.$watch('radius', redraw)
      $scope.$watch('color', redraw)

      // init
      redraw()

      function redraw() {
        $timeout(function(){
          container.innerHTML = '';

          var margin = {top: 0, right: 0, bottom: 0, left: 0},
              width = container.offsetWidth - margin.left - margin.right,
              height = container.offsetHeight - margin.top - margin.bottom;

          var svg = d3.select(container).append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
            .append('g')
              .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

          svg.append('circle')
              .attr('cx', width/2 )
              .attr('cy', height/2 )
              .attr('r', $scope.radius)
              .attr('fill', $scope.color)
        })
      }*/
      }
    }
  })
