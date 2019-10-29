'use strict'

/* Services */

angular
  .module('app.components.nodeAttributeMinimap', [])

  .directive('nodeAttributeMinimap', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">loading</small>',
      scope: {
        att: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.$watch('att', redraw, true)
        $scope.$watch('printMode', redraw, true)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        var g = dataLoader.get().g

        var container = el[0]

        function redraw() {
          $timeout(function() {
            container.innerHTML = ''

            var settings = {}

            // Canvas size
            settings.save_at_the_end = false
            settings.oversampling = $scope.printMode ? 8 : 2
            settings.width = container.offsetWidth
            settings.height = container.offsetHeight
            settings.margin = 3

            // Edges
            settings.draw_edges = g.size < 10000
            settings.edge_color = 'rgba(230, 230, 230, 0.6)'
            settings.edge_thickness = 0.6

            // Nodes
            settings.node_size = 1.5
            settings.size_scale_emphasize = 2

            var i
            var x
            var y
            var d
            var width = settings.oversampling * settings.width
            var height = settings.oversampling * settings.height
            var margin = settings.oversampling * settings.margin
            var edge_thickness = settings.oversampling * settings.edge_thickness
            var node_size = settings.oversampling * settings.node_size
            var scales = scalesUtils.getXYScales(width, height, margin)
            var xScale = scales[0]
            var yScale = scales[1]
            var rScale = scalesUtils.getRScale()

            // Create the canvas
            container.innerHTML =
              '<div style="width:' +
              settings.width +
              '; height:' +
              settings.height +
              ';"><canvas id="cnvs" width="' +
              width +
              '" height="' +
              height +
              '" style="width: 100%;"></canvas></div>'
            var canvas = container.querySelector('#cnvs')
            var ctx = canvas.getContext('2d')

            // Draw each edge
            if (settings.draw_edges) {
              g.edges().forEach(function(eid) {
                var ns = g.getNodeAttributes(g.source(eid))
                var nt = g.getNodeAttributes(g.target(eid))

                ctx.beginPath()
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.strokeStyle = settings.edge_color
                ctx.fillStyle = 'rgba(0, 0, 0, 0)'
                ctx.lineWidth = edge_thickness
                ctx.moveTo(xScale(ns.x), yScale(ns.y))
                ctx.lineTo(xScale(nt.x), yScale(nt.y))
                ctx.stroke()
                ctx.closePath()
              })
            }

            // Colors
            var getColor
            if ($scope.att.type == 'partition') {
              var colorsIndex = {}
              Object.values($scope.att.modalities).forEach(function(modality) {
                colorsIndex[modality.value] = modality.color
              })
              getColor = function(d) {
                return d3.color(colorsIndex[d] || '#999')
              }
            } else if ($scope.att.type == 'ranking-color') {
              getColor = scalesUtils.getColorScale(
                $scope.att.min,
                $scope.att.max,
                $scope.att.colorScale,
                $scope.att.invertScale,
                $scope.att.truncateScale
              )
            } else {
              getColor = function() {
                return d3.color('#000')
              }
            }

            // Sizes
            var getArea
            if ($scope.att.type == 'ranking-size') {
              getArea = scalesUtils.getAreaScale(
                $scope.att.min,
                $scope.att.max,
                $scope.att.areaScaling.min,
                $scope.att.areaScaling.max,
                $scope.att.areaScaling.interpolation
              )
            } else {
              getArea = function() {
                return Math.PI
              }
            }

            // Draw each node
            g.nodes().forEach(function(nid) {
              var n = g.getNodeAttributes(nid)

              ctx.lineCap = 'round'
              ctx.lineJoin = 'round'

              ctx.beginPath()
              ctx.arc(
                xScale(n.x),
                yScale(n.y),
                node_size *
                  ($scope.att.type == 'ranking-size'
                    ? settings.size_scale_emphasize
                    : 1) *
                  rScale(getArea(g.getNodeAttribute(nid, $scope.att.id))),
                0,
                2 * Math.PI,
                false
              )
              ctx.lineWidth = 0
              ctx.fillStyle = getColor(
                g.getNodeAttribute(nid, $scope.att.id)
              ).toString()
              ctx.shadowColor = 'transparent'
              ctx.fill()
            })

            // Save if needed
            /*if (settings.save_at_the_end) {
            canvas.toBlob(function(blob) {
                saveAs(blob, store.get('graphname') + "Heatmap.png");
            });
          }*/
          })
        }
      }
    }
  })
