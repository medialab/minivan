'use strict'

/* Services */

angular
  .module('app.components.nodeMinimap', [])

  .directive('nodeMinimap', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">...</small>',
      scope: {
        node: '=',
        printMode: '=',
        large: '@?'
      },
      link: function($scope, el, attrs) {
        $scope.$watch('node', redraw, true)
        $scope.$watch('printMode', redraw, true)
        $scope.large = false

        /*window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })*/

        var g = dataLoader.get().g

        var container = el[0]

        function redraw() {
          $timeout(function() {
            container.innerHTML = ''

            var settings = {}

            // Canvas size
            settings.save_at_the_end = false
            settings.oversampling = $scope.printMode ? 4 : 1
            settings.width = container.offsetWidth
            settings.height = container.offsetHeight
            settings.margin = 2.5

            // Nodes
            settings.background_node_size = 1.2
            settings.highlighted_node_size = 2.5
            settings.background_node_color = $scope.large
              ? 'rgba(180, 180, 180, 1)'
              : 'rgba(180, 180, 180, .2)'
            settings.highlighted_node_color = '#000'

            var i
            var x
            var y
            var d
            var width = settings.oversampling * settings.width
            var height = settings.oversampling * settings.height
            var margin = settings.oversampling * settings.margin
            var background_node_size =
              settings.oversampling * settings.background_node_size
            var highlighted_node_size =
              settings.oversampling * settings.highlighted_node_size
            var scales = scalesUtils.getXYScales(width, height, margin)
            var xScale = scales[0]
            var yScale = scales[1]

            // Create the canvas
            container.innerHTML =
              '<div style="width:' +
              settings.width +
              '; height:' +
              settings.height +
              ';"><canvas width="' +
              width +
              '" height="' +
              height +
              '" style="width: 100%;"></canvas></div>'
            var canvas = container.querySelector('canvas')
            var ctx = canvas.getContext('2d')

            // Draw each node
            g.nodes().forEach(function(nid) {
              var n = g.getNodeAttributes(nid)

              ctx.lineCap = 'round'
              ctx.lineJoin = 'round'

              ctx.beginPath()
              ctx.arc(
                xScale(n.x),
                yScale(n.y),
                background_node_size,
                0,
                2 * Math.PI,
                false
              )
              ctx.lineWidth = 0
              ctx.fillStyle = settings.background_node_color
              ctx.shadowColor = 'transparent'
              ctx.fill()
            })

            // Highlighted node
            if ($scope.node) {
              ctx.beginPath()
              ctx.arc(
                xScale($scope.node.x),
                yScale($scope.node.y),
                highlighted_node_size,
                0,
                2 * Math.PI,
                false
              )
              ctx.lineWidth = 0
              ctx.fillStyle = settings.highlighted_node_color
              ctx.shadowColor = 'transparent'
              ctx.fill()
            }
          })
        }
      }
    }
  })
