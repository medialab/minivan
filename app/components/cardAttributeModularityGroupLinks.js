'use strict'

angular
  .module('app.components.cardAttributeModularityGroupLinks', [])

  .directive('cardAttributeModularityGroupLinks', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardAttributeModularityGroupLinks.html',
      scope: {
        attId: '=',
        modalitiesSelection: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()

        $scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.attId]
        $scope.$watch(
          'modalitiesSelection',
          function() {
            $scope.hiddenModalities =
              d3.values($scope.modalitiesSelection).some(function(d) {
                return d
              }) &&
              d3.values($scope.modalitiesSelection).some(function(d) {
                return !d
              })
          },
          true
        )
      }
    }
  })

  .directive('modalityGroupToGroupEdgesCountChart', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        data: '=',
        printMode: '=',
        modalitiesSelection: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('modalitiesSelection', redraw, true)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined) {
            $timeout(function() {
              el.html('')
              drawFlowMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }

        function drawFlowMatrix(container, attData) {
          var modalities = Object.keys(attData.modalities).filter(function(
            mod
          ) {
            return $scope.modalitiesSelection[mod]
          })
          if (modalities.length == 0) {
            modalities = Object.keys(attData.modalities)
          }

          // Compute crossings
          var crossings = []
          var v1
          var v2
          modalities.forEach(function(v1) {
            modalities.forEach(function(v2) {
              crossings.push({
                v1: v1,
                v2: v2,
                count: attData.modalities[v1].flow[v2].count
              })
            })
          })

          // Rank modalities by count
          var sortedModalities = modalities.sort(function(v1, v2) {
            return attData.modalities[v2].nodes - attData.modalities[v1].nodes
          })
          var modalityRanking = {}
          sortedModalities.forEach(function(v, i) {
            modalityRanking[v] = i
          })

          // Draw SVG
          var maxR = 32
          var margin = {
            top: 120 + maxR,
            right: 24 + maxR,
            bottom: 24 + maxR,
            left: 180 + maxR
          }
          var width = 2 * maxR * (modalities.length - 1)
          var height = width // square space

          var x = d3.scaleLinear().range([0, width])

          var y = d3.scaleLinear().range([0, height])

          var size = d3.scaleLinear().range([0, 0.95 * maxR])
          var a = function(r) {
            return Math.PI * Math.pow(r, 2)
          }

          var r = function(a) {
            return Math.sqrt(a / Math.PI)
          }

          x.domain([0, modalities.length - 1])
          y.domain([0, modalities.length - 1])
          size.domain([
            0,
            d3.max(crossings, function(d) {
              return r(d.count)
            })
          ])

          var svg
          if ($scope.printMode) {
            var ratio = 610 / (width + margin.left + margin.right)
            svg = container
              .append('svg')
              .attr(
                'width',
                Math.floor(ratio * (width + margin.left + margin.right))
              )
              .attr(
                'height',
                Math.floor(ratio * (height + margin.top + margin.bottom))
              )
              .append('g')
              .attr(
                'transform',
                'scale(' +
                  ratio +
                  ', ' +
                  ratio +
                  ') translate(' +
                  margin.left +
                  ',' +
                  margin.top +
                  ')'
              )
          } else {
            svg = container
              .append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
              .attr(
                'transform',
                'translate(' + margin.left + ',' + margin.top + ')'
              )
          }

          // Horizontal lines
          svg
            .selectAll('line.h')
            .data(modalities)
            .enter()
            .append('line')
            .attr('class', 'h')
            .attr('x1', 0)
            .attr('y1', function(d) {
              return y(modalityRanking[d])
            })
            .attr('x2', width)
            .attr('y2', function(d) {
              return y(modalityRanking[d])
            })
            .style('stroke', 'rgba(220, 220, 220, 0.5)')
            .style('fill', 'rgba(255, 255, 255, 0.0)')

          // Vertical lines
          svg
            .selectAll('line.v')
            .data(modalities)
            .enter()
            .append('line')
            .attr('class', 'v')
            .attr('x1', function(d) {
              return x(modalityRanking[d])
            })
            .attr('y1', 0)
            .attr('x2', function(d) {
              return x(modalityRanking[d])
            })
            .attr('y2', height)
            .style('stroke', 'rgba(220, 220, 220, 0.5)')
            .style('fill', 'rgba(255, 255, 255, 0.0)')

          // Arrow
          var arr = svg
            .append('g')
            .attr('class', 'arrow')
            .style('stroke', 'rgba(0, 0, 0, 0.4)')
          arr
            .append('line')
            .attr('x1', -24 - maxR)
            .attr('y1', -24)
            .attr('x2', -24 - maxR)
            .attr('y2', -24 - maxR)
          arr
            .append('line')
            .attr('x1', -24 - maxR)
            .attr('y1', -24 - maxR)
            .attr('x2', -24)
            .attr('y2', -24 - maxR)
          arr
            .append('line')
            .attr('x1', -24)
            .attr('y1', -24 - maxR)
            .attr('x2', -24 - 6)
            .attr('y2', -24 - maxR - 6)
          arr
            .append('line')
            .attr('x1', -24)
            .attr('y1', -24 - maxR)
            .attr('x2', -24 - 6)
            .attr('y2', -24 - maxR + 6)

          // Horizontal labels
          svg
            .selectAll('text.h')
            .data(modalities)
            .enter()
            .append('text')
            .attr('class', 'h')
            .attr('x', -6 - maxR)
            .attr('y', function(d) {
              return y(modalityRanking[d]) + 3
            })
            .text(function(d) {
              return d
            })
            .style('text-anchor', 'end')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          // Vertical labels
          svg
            .selectAll('text.v')
            .data(modalities)
            .enter()
            .append('text')
            .attr('class', 'v')
            .attr('x', function(d) {
              return x(modalityRanking[d]) + 3
            })
            .attr('y', -6 - maxR)
            .text(function(d) {
              return d
            })
            .style('text-anchor', 'end')
            .style('writing-mode', 'vertical-lr')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          // Dots
          var dot = svg
            .selectAll('.dot')
            .data(crossings)
            .enter()
            .append('g')

          dot
            .append('circle')
            .attr('class', 'dot')
            .attr('r', function(d) {
              return size(r(d.count))
            })
            .attr('cx', function(d) {
              return x(modalityRanking[d.v2])
            })
            .attr('cy', function(d) {
              return y(modalityRanking[d.v1])
            })
            .style('fill', 'rgba(120, 120, 120, 0.3)')

          dot
            .append('text')
            .attr('x', function(d) {
              return x(modalityRanking[d.v2])
            })
            .attr('y', function(d) {
              return y(modalityRanking[d.v1]) + 4
            })
            .text(function(d) {
              return d.count
            })
            .style('text-anchor', 'middle')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 1.0)')
        }
      }
    }
  })

  .directive('modalityGroupToGroupNormalizedDensityChart', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        data: '=',
        printMode: '=',
        modalitiesSelection: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('modalitiesSelection', redraw, true)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined) {
            $timeout(function() {
              el.html('')
              drawNormalizedDensityMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }

        function drawNormalizedDensityMatrix(container, attData) {
          var modalities = Object.keys(attData.modalities).filter(function(
            mod
          ) {
            return $scope.modalitiesSelection[mod]
          })
          if (modalities.length == 0) {
            modalities = Object.keys(attData.modalities)
          }

          // Compute crossings
          var crossings = []
          var v1
          var v2
          modalities.forEach(function(v1) {
            modalities.forEach(function(v2) {
              crossings.push({
                v1: v1,
                v2: v2,
                nd: attData.modalities[v1].flow[v2].normalizedDensity
              })
            })
          })

          // Rank modalities by count
          var sortedModalities = modalities.sort(function(v1, v2) {
            return attData.modalities[v2].nodes - attData.modalities[v1].nodes
          })
          var modalityRanking = {}
          sortedModalities.forEach(function(v, i) {
            modalityRanking[v] = i
          })

          // Draw SVG
          var maxR = 32
          var margin = {
            top: 120 + maxR,
            right: 24 + maxR,
            bottom: 24 + maxR,
            left: 180 + maxR
          }
          var width = 2 * maxR * (modalities.length - 1)
          var height = width // square space

          var x = d3.scaleLinear().range([0, width])

          var y = d3.scaleLinear().range([0, height])

          var size = d3.scaleLinear().range([0, 0.95 * maxR])

          var a = function(r) {
            return Math.PI * Math.pow(r, 2)
          }

          var r = function(a) {
            return Math.sqrt(a / Math.PI)
          }

          x.domain([0, modalities.length - 1])
          y.domain([0, modalities.length - 1])
          size.domain([
            0,
            d3.max(crossings, function(d) {
              return r(Math.max(0, d.nd))
            })
          ])

          var svg
          if ($scope.printMode) {
            var ratio = 610 / (width + margin.left + margin.right)
            svg = container
              .append('svg')
              .attr(
                'width',
                Math.floor(ratio * (width + margin.left + margin.right))
              )
              .attr(
                'height',
                Math.floor(ratio * (height + margin.top + margin.bottom))
              )
              .append('g')
              .attr(
                'transform',
                'scale(' +
                  ratio +
                  ', ' +
                  ratio +
                  ') translate(' +
                  margin.left +
                  ',' +
                  margin.top +
                  ')'
              )
          } else {
            svg = container
              .append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
              .attr(
                'transform',
                'translate(' + margin.left + ',' + margin.top + ')'
              )
          }

          // Horizontal lines
          svg
            .selectAll('line.h')
            .data(modalities)
            .enter()
            .append('line')
            .attr('class', 'h')
            .attr('x1', 0)
            .attr('y1', function(d) {
              return y(modalityRanking[d])
            })
            .attr('x2', width)
            .attr('y2', function(d) {
              return y(modalityRanking[d])
            })
            .style('stroke', 'rgba(220, 220, 220, 0.5)')
            .style('fill', 'rgba(255, 255, 255, 0.0)')

          // Vertical lines
          svg
            .selectAll('line.v')
            .data(modalities)
            .enter()
            .append('line')
            .attr('class', 'v')
            .attr('x1', function(d) {
              return x(modalityRanking[d])
            })
            .attr('y1', 0)
            .attr('x2', function(d) {
              return x(modalityRanking[d])
            })
            .attr('y2', height)
            .style('stroke', 'rgba(220, 220, 220, 0.5)')
            .style('fill', 'rgba(255, 255, 255, 0.0)')

          // Arrow
          var arr = svg
            .append('g')
            .attr('class', 'arrow')
            .style('stroke', 'rgba(0, 0, 0, 0.4)')
          arr
            .append('line')
            .attr('x1', -24 - maxR)
            .attr('y1', -24)
            .attr('x2', -24 - maxR)
            .attr('y2', -24 - maxR)
          arr
            .append('line')
            .attr('x1', -24 - maxR)
            .attr('y1', -24 - maxR)
            .attr('x2', -24)
            .attr('y2', -24 - maxR)
          arr
            .append('line')
            .attr('x1', -24)
            .attr('y1', -24 - maxR)
            .attr('x2', -24 - 6)
            .attr('y2', -24 - maxR - 6)
          arr
            .append('line')
            .attr('x1', -24)
            .attr('y1', -24 - maxR)
            .attr('x2', -24 - 6)
            .attr('y2', -24 - maxR + 6)

          // Horizontal labels
          svg
            .selectAll('text.h')
            .data(modalities)
            .enter()
            .append('text')
            .attr('class', 'h')
            .attr('x', -6 - maxR)
            .attr('y', function(d) {
              return y(modalityRanking[d]) + 3
            })
            .text(function(d) {
              return d
            })
            .style('text-anchor', 'end')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          // Vertical labels
          svg
            .selectAll('text.v')
            .data(modalities)
            .enter()
            .append('text')
            .attr('class', 'v')
            .attr('x', function(d) {
              return x(modalityRanking[d]) + 3
            })
            .attr('y', -6 - maxR)
            .text(function(d) {
              return d
            })
            .style('text-anchor', 'end')
            .style('writing-mode', 'vertical-lr')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          // Dots
          var dot = svg
            .selectAll('.dot')
            .data(crossings)
            .enter()
            .append('g')

          dot
            .append('circle')
            .attr('class', 'dot')
            .attr('r', function(d) {
              return size(r(Math.max(0, d.nd)))
            })
            .attr('cx', function(d) {
              return x(modalityRanking[d.v2])
            })
            .attr('cy', function(d) {
              return y(modalityRanking[d.v1])
            })
            .style('fill', function(d) {
              if (d.v1 == d.v2) {
                return 'rgba(70, 220, 70, 0.3)'
              } else {
                return 'rgba(220, 70, 70, 0.3)'
              }
            })

          dot
            .append('text')
            .attr('x', function(d) {
              return x(modalityRanking[d.v2])
            })
            .attr('y', function(d) {
              return y(modalityRanking[d.v1]) + 4
            })
            .text(function(d) {
              return formatDensityNumber(d.nd)
            })
            .style('text-anchor', 'middle')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 1.0)')

          function formatDensityNumber(d) {
            if (d !== undefined) return d.toFixed(3)
            return NaN
          }
        }
      }
    }
  })
