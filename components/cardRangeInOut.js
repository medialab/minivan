'use strict'

angular
  .module('app.components.cardRangeInOut', [])

  .directive('cardRangeInOut', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardRangeInOut.html',
      scope: {
        attId: '=',
        range: '=',
        subgraph: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.attribute = dataLoader.get().nodeAttributesIndex[$scope.attId]
      }
    }
  })

  .directive('rangeInOutChart', function($timeout, dataLoader) {
    return {
      restrict: 'A',
      scope: {
        subgraph: '=',
        printMode: '=',
        modalityValue: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('subgraph', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.subgraph !== undefined) {
            $timeout(function() {
              el.html('')
              drawValueInboundOutbound(d3.select(el[0]))
            })
          }
        }

        function drawValueInboundOutbound(container) {
          var g = dataLoader.get().g
          var sg = $scope.subgraph
          var sgIndex = {}
          var inboundCount = 0
          var outboundCount = 0
          sg.nodes().forEach(function(nid) {
            sgIndex[nid] = true
          })
          g.edges().forEach(function(eid) {
            if (
              sgIndex[g.source(eid)] &&
              sgIndex[g.target(eid)] === undefined
            ) {
              outboundCount++
            } else if (
              sgIndex[g.source(eid)] === undefined &&
              sgIndex[g.target(eid)]
            ) {
              inboundCount++
            }
          })

          var data = [
            {
              label: 'INBOUND',
              count: inboundCount
            },
            {
              label: 'OUTBOUND',
              count: outboundCount
            }
          ]

          var barHeight = 32
          var margin = { top: 24, right: 120, bottom: 24, left: 120 }
          var width =
            container.node().getBoundingClientRect().width -
            margin.left -
            margin.right
          var height = barHeight * data.length

          var x = d3.scaleLinear().range([0, width])

          var y = d3
            .scaleBand()
            .rangeRound([0, height])
            .padding(0.05)

          var xAxis = d3.axisBottom().scale(x)

          var yAxis = d3.axisLeft().scale(y)

          var svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr(
              'transform',
              'translate(' + margin.left + ',' + margin.top + ')'
            )

          x.domain([
            0,
            Math.max(
              0.01,
              d3.max(data, function(d) {
                return d.count
              })
            )
          ])
          y.domain(
            data.map(function(d) {
              return d.label
            })
          )

          svg
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '9px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          svg
            .append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'rgba(0, 0, 0, 0.5)')

          var bar = svg
            .selectAll('bar')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar')

          bar
            .append('rect')
            .style('fill', 'rgba(120, 120, 120, 0.5)')
            .attr('x', 0)
            .attr('y', function(d) {
              return y(d.label)
            })
            .attr('width', function(d) {
              return x(Math.max(0, d.count))
            })
            .attr('height', y.bandwidth())

          bar
            .append('text')
            .attr('x', function(d) {
              return 6 + x(Math.max(0, d.count))
            })
            .attr('y', function(d) {
              return y(d.label) + 18
            })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.count + ' links'
            })
        }
      }
    }
  })
