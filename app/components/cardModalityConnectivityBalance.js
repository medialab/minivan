'use strict'

angular
  .module('app.components.cardModalityConnectivityBalance', [])

  .directive('cardModalityConnectivityBalance', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardModalityConnectivityBalance.html',
      scope: {
        attId: '=',
        modValue: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        var g = $scope.networkData.g
        $scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.attId]
        $scope.modality = $scope.attribute.modalities[$scope.modValue]
        $scope.modalityFlow =
          $scope.attribute.modalities[$scope.modValue].flow[$scope.modValue]
      }
    }
  })

  .directive('modalityBalanceChart', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        data: '=',
        printMode: '=',
        modalityValue: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('modalityValue', redraw, true)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined) {
            $timeout(function() {
              el.html('')
              drawValueSkewnessDistribution(
                d3.select(el[0]),
                $scope.data,
                $scope.modalityValue
              )
            })
          }
        }

        function drawValueSkewnessDistribution(container, attData, v) {
          var sortedValues = Object.keys(attData.modalities)
            .slice(0)
            .sort(function(v1, v2) {
              return attData.modalities[v2].count - attData.modalities[v1].count
            })

          var data = sortedValues
            .filter(function(v2) {
              return v2 != v
            })
            .map(function(v2) {
              return {
                label: v2,
                ndToVal: attData.modalities[v2].flow[v].normalizedDensity,
                linksToVal: attData.modalities[v2].flow[v].count,
                ndFromVal: attData.modalities[v].flow[v2].normalizedDensity,
                linksFromVal: attData.modalities[v].flow[v2].count
              }
            })

          var barHeight = 32
          var centerSpace = 32
          var margin = { top: 36, right: 180, bottom: 24, left: 180 }
          var width =
            container.node().getBoundingClientRect().width -
            margin.left -
            margin.right
          var height = barHeight * data.length

          var xl = d3.scaleLinear().range([width / 2 - centerSpace / 2, 0])
          var xr = d3.scaleLinear().range([width / 2 + centerSpace / 2, width])

          var y = d3
            .scaleBand()
            .rangeRound([0, height])
            .padding(0.05)

          var xlAxis = d3
            .axisBottom()
            .scale(xl)
            .ticks(3)

          var xrAxis = d3
            .axisBottom()
            .scale(xr)
            .ticks(3)

          var svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr(
              'transform',
              'translate(' + margin.left + ',' + margin.top + ')'
            )

          xl.domain([
            0,
            d3.max(data, function(d) {
              return Math.max(d.ndToVal, d.ndFromVal)
            })
          ])
          xr.domain([
            0,
            d3.max(data, function(d) {
              return Math.max(d.ndToVal, d.ndFromVal)
            })
          ])
          y.domain(
            data.map(function(d) {
              return d.label
            })
          )

          svg
            .append('g')
            .attr('class', 'xl axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xlAxis)
            .selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '9px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          svg
            .append('g')
            .attr('class', 'xr axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xrAxis)
            .selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '9px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          svg
            .append('line')
            .attr('x1', xl(0))
            .attr('y1', height)
            .attr('x2', xl(0))
            .attr('y2', 0)
            .style('stroke', 'rgba(0, 0, 0, 0.3)')

          svg
            .append('line')
            .attr('x1', xr(0))
            .attr('y1', height)
            .attr('x2', xr(0))
            .attr('y2', 0)
            .style('stroke', 'rgba(0, 0, 0, 0.3)')

          svg
            .append('text')
            .text('INBOUND')
            .attr('text-anchor', 'end')
            .attr('x', xl(0))
            .attr('y', -6)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          svg
            .append('text')
            .text('OUTBOUND')
            .attr('x', xr(0))
            .attr('y', -6)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          svg
            .append('text')
            .text('→ ' + v + ' →')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', -24)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          var bar = svg
            .selectAll('bar')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar')

          // Left
          bar
            .append('rect')
            .style('fill', 'rgba(120, 120, 120, 0.5)')
            .attr('x', function(d) {
              return xl(Math.max(0, d.ndToVal))
            })
            .attr('y', function(d) {
              return y(d.label)
            })
            .attr('width', function(d) {
              return xl(0) - xl(Math.max(0, d.ndToVal))
            })
            .attr('height', y.bandwidth())

          bar
            .append('text')
            .attr('x', function(d) {
              return xl(Math.max(0, d.ndToVal)) - 6
            })
            .attr('y', function(d) {
              return y(d.label) + 12
            })
            .attr('text-anchor', 'end')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.linksToVal + ' links'
            })

          bar
            .append('text')
            .attr('x', function(d) {
              return xl(Math.max(0, d.ndToVal)) - 6
            })
            .attr('y', function(d) {
              return y(d.label) + 24
            })
            .attr('text-anchor', 'end')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.ndToVal.toFixed(3) + ' nd.'
            })

          bar
            .append('text')
            .attr('x', function(d) {
              return xl(Math.max(0, d.ndToVal)) - 60
            })
            .attr('y', function(d) {
              return y(d.label) + 18
            })
            .attr('text-anchor', 'end')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')
            .text(function(d) {
              return d.label
            })

          // Right
          bar
            .append('rect')
            .style('fill', 'rgba(120, 120, 120, 0.5)')
            .attr('x', function(d) {
              return xr(0)
            })
            .attr('y', function(d) {
              return y(d.label)
            })
            .attr('width', function(d) {
              return xr(Math.max(0, d.ndFromVal)) - xr(0)
            })
            .attr('height', y.bandwidth())

          bar
            .append('text')
            .attr('x', function(d) {
              return xr(Math.max(0, d.ndFromVal)) + 6
            })
            .attr('y', function(d) {
              return y(d.label) + 12
            })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.linksFromVal + ' links'
            })

          bar
            .append('text')
            .attr('x', function(d) {
              return xr(Math.max(0, d.ndFromVal)) + 6
            })
            .attr('y', function(d) {
              return y(d.label) + 24
            })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.ndFromVal.toFixed(3) + ' nd.'
            })

          bar
            .append('text')
            .attr('x', function(d) {
              return xr(Math.max(0, d.ndFromVal)) + 60
            })
            .attr('y', function(d) {
              return y(d.label) + 18
            })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')
            .text(function(d) {
              return d.label
            })
        }
      }
    }
  })
