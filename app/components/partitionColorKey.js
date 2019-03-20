'use strict'

/* Services */

angular
  .module('app.components.partitionColorKey', [])

  .directive('partitionColorKey', function($timeout, scalesUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/partitionColorKey.html',
      scope: {
        att: '=',
        scales: '=',
        modalityFilter: '='
      },
      link: function($scope, el, attrs) {
        $scope.elementSize = 30
      }
    }
  })

  .directive('partitionColorKeyItem', function($timeout) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">...</small>',
      scope: {
        modality: '='
      },
      link: function($scope, el, attrs) {
        var container = el[0]

        $scope.$watch('modality', redraw)

        // init
        redraw()

        function redraw() {
          $timeout(function() {
            container.innerHTML = ''

            var margin = { top: 0, right: 0, bottom: 0, left: 0 },
              width = container.offsetWidth - margin.left - margin.right,
              height = container.offsetHeight - margin.top - margin.bottom

            var svg = d3
              .select(container)
              .append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
              .attr(
                'transform',
                'translate(' + margin.left + ',' + margin.top + ')'
              )

            svg
              .append('circle')
              .attr('cx', width / 2)
              .attr('cy', height / 2)
              .attr('r', container.offsetWidth / 2)
              .attr('fill', $scope.modality.color)
          })
        }
      }
    }
  })
