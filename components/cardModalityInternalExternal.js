'use strict'

angular
  .module('app.components.cardModalityInternalExternal', [])

  .directive('cardModalityInternalExternal', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardModalityInternalExternal.html',
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

  .directive('modalityInternalExternalChart', function($timeout) {
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
              drawValueInternalExternal(
                d3.select(el[0]),
                $scope.data,
                $scope.modalityValue
              )
            })
          }
        }

        function drawValueInternalExternal(container, attData, v) {
          var data = [
            {
              label: 'INTERNAL',
              nd: attData.modalities[v].internalNormalizedDensity,
              color: 'rgba(70, 220, 70, 0.3)'
            },
            {
              label: 'EXTERNAL',
              nd: attData.modalities[v].externalNormalizedDensity,
              color: 'rgba(220, 70, 70, 0.3)'
            }
          ]
          window.container = container
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
            d3.max(data, function(d) {
              return d.nd
            })
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
            .style('fill', function(d) {
              return d.color
            })
            .attr('x', 0)
            .attr('y', function(d) {
              return y(d.label)
            })
            .attr('width', function(d) {
              return x(Math.max(0, d.nd))
            })
            .attr('height', y.bandwidth())

          bar
            .append('text')
            .attr('x', function(d) {
              return 6 + x(Math.max(0, d.nd))
            })
            .attr('y', function(d) {
              return y(d.label) + 18
            })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '10px')
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .text(function(d) {
              return d.nd.toFixed(3) + ' norm. density'
            })
        }
      }
    }
  })
