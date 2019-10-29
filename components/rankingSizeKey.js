'use strict'

/* Services */

angular
  .module('app.components.rankingSizeKey', [])

  .directive('rankingSizeKey', function($timeout, scalesUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/rankingSizeKey.html',
      scope: {
        att: '=',
        modalities: '=',
        modalityFilter: '=',
        scales: '='
      },
      link: function($scope, el, attrs) {
        $scope.elementSize = 30
      }
    }
  })

  .directive('rankingSizeKeyItem', function($timeout, scalesUtils) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">...</small>',
      scope: {
        modality: '=',
        scales: '='
      },
      link: function($scope, el, attrs) {
        var container = el[0]

        $scope.$watch('modality', redraw)
        $scope.$watch('scales', redraw)

        var rScale = scalesUtils.getRScale()

        // init
        redraw()

        function redraw() {
          if ($scope.modality && $scope.scales) {
            $timeout(function() {
              container.innerHTML = ''

              var margin = { top: 0, right: 0, bottom: 0, left: 0 },
                width = container.offsetWidth - margin.left - margin.right,
                height = container.offsetHeight - margin.top - margin.bottom

              var r =
                $scope.scales.rFactor *
                rScale($scope.scales.areaScale($scope.modality.average))

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
                .attr('cx', r < width / 2 ? width / 2 : width - r)
                .attr('cy', height / 2)
                .attr('r', r)
                .attr('fill', '#999')
            })
          }
        }
      }
    }
  })
