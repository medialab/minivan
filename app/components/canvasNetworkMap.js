'use strict'

angular
  .module('app.components.canvasNetworkMap', [])

  .directive('canvasNetworkMap', function(
    $timeout,
    dataLoader,
    scalesUtils,
    layoutCache
  ) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">loading</small>',
      scope: {
        nodeColorAttId: '=',
        nodeSizeAttId: '=',
        nodeFilter: '=',
        hardFilter: '=',
        nodeSize: '=',
        labelSize: '=',
        sizedLabels: '=',
        coloredLabels: '=',
        oversampling: '=',
        showEdges: '=',
        curvedEdges: '=',
        clearEdgesAroundNodes: '=',
        x: '=',
        y: '=',
        ratio: '=',
        scales: '=',
        layoutCacheKey: '='
      },
      link: function($scope, el, attrs) {
        var redraw = debounce(_redraw, 100) // Prevents multiple triggers in a row
        $scope.networkData = dataLoader.get()

        $scope.$watch('nodeColorAttId', redraw)
        $scope.$watch('nodeSizeAttId', redraw)
        $scope.$watch('oversampling', redraw)
        $scope.$watch('nodeSize', redraw)
        $scope.$watch('labelSize', redraw)
        $scope.$watch('sizedLabels', redraw)
        $scope.$watch('coloredLabels', redraw)
        $scope.$watch('clearEdgesAroundNodes', redraw)
        $scope.$watch('curvedEdges', redraw)
        $scope.$watch('showEdges', redraw)

        /*window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })*/

        var container = el[0]

        function _redraw() {
          // Postpone if network data not loaded
          if (!$scope.networkData.loaded) {
            $timeout(redraw, 500)
            return
          }

          // Redraw waiting message
          $timeout(function() {
            container.innerHTML =
              '<small style="opacity:0.5;">Refreshing...</small>'
          })

          // Actual redraw
          $timeout(function() {
            var settings = {}

            // Canvas size
            settings.save_at_the_end = false
            settings.oversampling = +$scope.oversampling || 1
            settings.width = container.offsetWidth
            settings.height = container.offsetHeight
            settings.margin = 3

            // Edges
            settings.draw_edges = !!$scope.showEdges
            settings.clear_edges_around_nodes = !!$scope.clearEdgesAroundNodes
            settings.edge_color = 'rgba(120, 120, 120, 1)'
            settings.edge_thickness = 0.06
            settings.curved_edges = !!$scope.curvedEdges

            // Nodes
            settings.draw_nodes = true
            settings.node_size = (+$scope.nodeSize || 10) / 10
            settings.node_stroke_width = 0 // Nodes white contour
            settings.default_node_color = d3.color('#999')
            settings.size_scale_emphasize = 2
            settings.node_halo_ratio = 4 * settings.node_size

            // Node labels
            settings.draw_labels = true
            settings.label_count = Infinity // Limit the number of visible labels
            settings.label_white_border_thickness =
              (2.5 * (+$scope.labelSize || 10)) / 10
            settings.sized_labels = !!$scope.sizedLabels
            settings.colored_labels = !!$scope.coloredLabels
            settings.label_font_min_size = (9 * (+$scope.labelSize || 10)) / 10
            settings.label_font_max_size = (18 * (+$scope.labelSize || 10)) / 10
            settings.label_font_family = 'Quicksand, sans-serif'
            settings.label_font_weight = 300
            settings.label_color_min_C = 0
            settings.label_color_max_C = 50
            settings.label_color_min_L = 2
            settings.label_color_max_L = 35

            var g = $scope.networkData.g.copy()
            container.innerHTML = ''

            // Hard filter
            var nodeFilter
            if ($scope.hardFilter) {
              g.nodes().forEach(function(nid) {
                if (!$scope.nodeFilter(nid)) {
                  g.dropNode(nid)
                }
              })

              nodeFilter = function(d) {
                return d
              }
            } else {
              nodeFilter =
                $scope.nodeFilter ||
                function(d) {
                  return d
                }
            }

            // Update positions from cache
            if ($scope.layoutCacheKey) {
              layoutCache.recall($scope.layoutCacheKey, g)
            }

            var i
            var x
            var y
            var d
            var width = settings.oversampling * settings.width
            var height = settings.oversampling * settings.height
            var margin = settings.oversampling * settings.margin
            var edge_thickness = settings.oversampling * settings.edge_thickness
            var node_size = settings.oversampling * settings.node_size
            var node_stroke_width =
              settings.oversampling * settings.node_stroke_width
            var node_halo_ratio =
              settings.oversampling * settings.node_halo_ratio
            var label_white_border_thickness =
              settings.oversampling * settings.label_white_border_thickness
            var label_font_min_size =
              settings.oversampling * settings.label_font_min_size
            var label_font_max_size =
              settings.oversampling * settings.label_font_max_size
            var xyScales = scalesUtils.getXYScales_camera(
              width,
              height,
              margin,
              +$scope.x,
              +$scope.y,
              +$scope.ratio,
              g
            )
            var xScale = xyScales[0]
            var yScale = xyScales[1]
            var rScale = scalesUtils.getRScale()
            var scales = {} // Collect scales to broadcast and inform the network map key

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

            // Colors
            var getColor
            if ($scope.nodeColorAttId) {
              var colorAtt =
                $scope.networkData.nodeAttributesIndex[$scope.nodeColorAttId]
              if (colorAtt.type == 'partition') {
                var colorByModality = {}
                Object.values(colorAtt.modalities).forEach(function(m) {
                  colorByModality[m.value] = m.color
                })
                var colorScale = function(val) {
                  return colorByModality[val] || '#000'
                }
                getColor = function(nid) {
                  return colorScale(g.getNodeAttribute(nid, colorAtt.id))
                }
                scales.colorScale = colorScale
              } else if (colorAtt.type == 'ranking-color') {
                var colorScale = scalesUtils.getColorScale(
                  colorAtt.min,
                  colorAtt.max,
                  colorAtt.colorScale
                )
                var colorScale_string = function(val) {
                  return colorScale(val).toString()
                }
                getColor = function(nid) {
                  return colorScale_string(g.getNodeAttribute(nid, colorAtt.id))
                }
                scales.colorScale = colorScale_string
              } else {
                getColor = function() {
                  return settings.default_node_color
                }
              }
            } else {
              getColor = function() {
                return settings.default_node_color
              }
            }

            // Nodes in the frame
            var nodesInTheFrame = g
              .nodes()
              .filter(nodeFilter)
              .filter(function(nid) {
                var n = g.getNodeAttributes(nid)
                var x = xScale(n.x)
                var y = yScale(n.y)
                return x >= 0 && x <= width && y >= 0 && y <= height
              })

            // Sizes
            var nodesDensity =
              nodesInTheFrame.length / (el[0].offsetWidth * el[0].offsetHeight)
            var standardArea = 0.01 / nodesDensity
            var getArea
            if ($scope.nodeSizeAttId) {
              var sizeAtt =
                $scope.networkData.nodeAttributesIndex[$scope.nodeSizeAttId]
              var areaScale = scalesUtils.getAreaScale(
                sizeAtt.min,
                sizeAtt.max,
                sizeAtt.areaScaling.min,
                sizeAtt.areaScaling.max,
                sizeAtt.areaScaling.interpolation
              )
              var areaScale_norm = function(val) {
                return (
                  (sizeAtt.areaScaling.max * areaScale(val) * standardArea) / 10
                )
              }
              getArea = function(nid) {
                return areaScale_norm(g.getNodeAttribute(nid, sizeAtt.id))
              }
              scales.areaScale = areaScale_norm
              scales.rFactor = node_size / settings.oversampling
            } else {
              // Trick: a barely visible size difference by degree
              // (helps hierarchizing node labels)
              getArea = function(nid) {
                return standardArea + 0.1 * Math.log(1 + g.degree(nid))
              }
            }

            // Compute areas once for all
            var areaIndex = {}
            g.nodes().forEach(function(nid) {
              areaIndex[nid] = getArea(nid)
            })

            // Paint a white background
            ctx.beginPath()
            ctx.rect(0, 0, width, height)
            ctx.fillStyle = 'white'
            ctx.fill()
            ctx.closePath()

            var vidIndex = {}
            if (settings.clear_edges_around_nodes) {
              // Get an index of nodes where ids are integers
              var nodesIndex = g.nodes().slice(0)
              nodesIndex.unshift(null) // We reserve 0 for "no closest"

              // Generate "voronoi ids" (vid)
              nodesIndex.forEach(function(nid, vid) {
                if (vid > 0) {
                  vidIndex[nid] = vid
                }
              })

              // Init a pixel map of integers for voronoi ids
              var vidPixelMap = new Int32Array(width * height)
              for (i in vidPixelMap) {
                vidPixelMap[i] = 0
              }

              // Init a pixel map of floats for distances
              var dPixelMap = new Float32Array(width * height)
              for (i in dPixelMap) {
                dPixelMap[i] = Infinity
              }

              // Compute the voronoi using the pixel map
              nodesInTheFrame.forEach(function(nid) {
                var n = g.getNodeAttributes(nid)
                var nx = xScale(n.x)
                var ny = yScale(n.y)
                var nsize = rScale(areaIndex[nid])
                var nvid = vidIndex[nid]
                var node_halo_range = node_halo_ratio * rScale(standardArea)
                var range = nsize * node_size + node_halo_range
                for (
                  x = Math.max(0, Math.floor(nx - range));
                  x <= Math.min(width, Math.floor(nx + range));
                  x++
                ) {
                  for (
                    y = Math.max(0, Math.floor(ny - range));
                    y <= Math.min(height, Math.floor(ny + range));
                    y++
                  ) {
                    var d = Math.sqrt(Math.pow(nx - x, 2) + Math.pow(ny - y, 2))
                    if (d < range) {
                      var dmod // A tweak of the voronoi: a modified distance in [0,1]
                      if (d <= nsize * node_size) {
                        // "Inside" the node
                        dmod = 0
                      } else {
                        // In the halo range
                        dmod = (d - nsize * node_size) / node_halo_range
                      }
                      i = x + width * y
                      var existingVid = vidPixelMap[i]
                      if (existingVid == 0) {
                        // 0 means there is no closest node
                        vidPixelMap[i] = nvid
                        dPixelMap[i] = dmod
                      } else {
                        // There is already a closest node. Edit only if we are closer.
                        if (dmod < dPixelMap[i]) {
                          vidPixelMap[i] = nvid
                          dPixelMap[i] = dmod
                        }
                      }
                    }
                  }
                }
              })

              // Convert distance map to a visually pleasant gradient
              var gradient = function(d) {
                return 0.5 + 0.5 * Math.cos(Math.PI - Math.pow(d, 2) * Math.PI)
              }
              for (i in dPixelMap) {
                dPixelMap[i] = gradient(dPixelMap[i])
              }
            }

            // Draw each edge
            if (settings.draw_edges) {
              g.edges()
                .filter(function(eid) {
                  return nodeFilter(g.source(eid)) && nodeFilter(g.target(eid))
                })
                .forEach(function(eid) {
                  var nsid = g.source(eid)
                  var ns = g.getNodeAttributes(nsid)
                  var nsx = xScale(ns.x)
                  var nsy = yScale(ns.y)
                  var nsvid = vidIndex[nsid]
                  var ntid = g.target(eid)
                  var nt = g.getNodeAttributes(ntid)
                  var ntx = xScale(nt.x)
                  var nty = yScale(nt.y)
                  var ntvid = vidIndex[ntid]
                  var d = Math.sqrt(
                    Math.pow(nsx - ntx, 2) + Math.pow(nsy - nty, 2)
                  )
                  var color = d3.color(settings.edge_color)

                  // Build path
                  var path = settings.curved_edges
                    ? getCurvedPath(nsx, nsy, ntx, nty)
                    : getLinePath(nsx, nsy, ntx, nty)

                  // Set opacity at each path point
                  path.forEach(function(p) {
                    var x = p[0]
                    var y = p[1]
                    var o
                    var pixi = Math.floor(x) + width * Math.floor(y)
                    if (
                      !settings.clear_edges_around_nodes ||
                      vidPixelMap[pixi] == nsvid ||
                      vidPixelMap[pixi] == ntvid ||
                      vidPixelMap[pixi] == 0
                    ) {
                      o = 1
                    } else {
                      o = dPixelMap[pixi]
                    }
                    p[2] = o
                  })

                  // Smoothe path
                  if (path.length > 5) {
                    for (i = 2; i < path.length - 2; i++) {
                      path[i][2] =
                        0.15 * path[i - 2][2] +
                        0.25 * path[i - 1][2] +
                        0.2 * path[i][2] +
                        0.25 * path[i + 1][2] +
                        0.15 * path[i + 2][2]
                    }
                  }

                  // Draw path
                  var lastp
                  var lastop
                  path.forEach(function(p, pi) {
                    if (lastp) {
                      color.opacity = p[2]
                      ctx.beginPath()
                      ctx.lineCap = 'round'
                      ctx.lineJoin = 'round'
                      ctx.strokeStyle = color.toString()
                      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
                      ctx.lineWidth = edge_thickness
                      ctx.moveTo(lastp[0], lastp[1])
                      ctx.lineTo(p[0], p[1])
                      ctx.stroke()
                      ctx.closePath()
                    }
                    lastp = p
                    lastop = color.opacity
                  })
                })
            }

            // Sort nodes
            var nodesBySize = nodesInTheFrame.slice(0)
            // We sort nodes by 1) size and 2) left to right
            nodesBySize.sort(function(naid, nbid) {
              var na = g.getNodeAttributes(naid)
              var nb = g.getNodeAttributes(nbid)
              var nasize = areaIndex[naid]
              var nbsize = areaIndex[nbid]
              if (nasize < nbsize) {
                return 1
              } else if (nasize > nbsize) {
                return -1
              } else if (na.x < nb.x) {
                return 1
              } else if (na.x > nb.x) {
                return -1
              }
              return 0
            })

            // Draw each node
            if (settings.draw_nodes) {
              nodesBySize.reverse() // Because we draw from background to foreground
              nodesBySize.forEach(function(nid) {
                var n = g.getNodeAttributes(nid)
                var nx = xScale(n.x)
                var ny = yScale(n.y)
                var nsize = rScale(getArea(nid))

                var color = getColor(nid)

                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

                ctx.beginPath()
                ctx.arc(
                  nx,
                  ny,
                  node_size * nsize + node_stroke_width,
                  0,
                  2 * Math.PI,
                  false
                )
                ctx.lineWidth = 0
                ctx.fillStyle = '#FFFFFF'
                ctx.shadowColor = 'transparent'
                ctx.fill()

                ctx.beginPath()
                ctx.arc(nx, ny, node_size * nsize, 0, 2 * Math.PI, false)
                ctx.lineWidth = 0
                ctx.fillStyle = color.toString()
                ctx.shadowColor = 'transparent'
                ctx.fill()
              })
              nodesBySize.reverse() // Put it back how it was
            }

            // Draw each label
            if (settings.draw_labels) {
              // Init a pixel map of int for bounding boxes
              var bbPixelMap = new Uint8Array(width * height)
              for (i in bbPixelMap) {
                bbPixelMap[i] = 0 // 1 means "occupied"
              }

              // Compute scale for labels
              var label_nodeSizeExtent = d3.extent(
                nodesBySize.map(function(nid) {
                  return rScale(areaIndex[nid])
                })
              )
              if (label_nodeSizeExtent[0] == label_nodeSizeExtent[1]) {
                label_nodeSizeExtent[0] *= 0.9
              }

              // Draw labels
              var labelDrawCount = settings.label_count
              nodesBySize.forEach(function(nid) {
                if (labelDrawCount > 0) {
                  var n = g.getNodeAttributes(nid)
                  var nx = xScale(n.x)
                  var ny = yScale(n.y)
                  var nsize = rScale(getArea(nid))

                  // Precompute the label
                  var color = settings.colored_labels
                    ? tuneColorForLabel(getColor(nid))
                    : d3.color('#666')
                  var fontSize = settings.sized_labels
                    ? Math.floor(
                        label_font_min_size +
                          ((nsize - label_nodeSizeExtent[0]) *
                            (label_font_max_size - label_font_min_size)) /
                            (label_nodeSizeExtent[1] - label_nodeSizeExtent[0])
                      )
                    : Math.floor(
                        0.6 * label_font_min_size + 0.4 * label_font_max_size
                      )

                  // Then, draw the label only if wanted
                  var labelCoordinates = {
                    x:
                      nx +
                      0.6 * label_white_border_thickness +
                      1.05 * node_size * nsize,
                    y: ny + 0.25 * fontSize
                  }

                  var label = n.label.replace(/^https*:\/\/(www\.)*/gi, '')

                  ctx.font =
                    settings.label_font_weight +
                    ' ' +
                    fontSize +
                    'px ' +
                    settings.label_font_family
                  ctx.lineWidth = label_white_border_thickness

                  // Bounding box
                  var bbox = getBBox(ctx, fontSize, labelCoordinates)
                  function getBBox(ctx, fontSize, labelCoordinates) {
                    return {
                      x: labelCoordinates.x,
                      y: labelCoordinates.y - 0.8 * fontSize,
                      width: ctx.measureText(label).width,
                      height: fontSize
                    }
                  }

                  // Test bounding box collision
                  var collision = false
                  for (x = Math.floor(bbox.x); x < bbox.x + bbox.width; x++) {
                    for (
                      y = Math.floor(bbox.y);
                      y < bbox.y + bbox.height;
                      y++
                    ) {
                      if (bbPixelMap[x + y * width] == 1) {
                        collision = true
                        break
                        break
                      }
                    }
                  }
                  if (!collision) {
                    // Update bounding box data
                    for (x = Math.floor(bbox.x); x < bbox.x + bbox.width; x++) {
                      for (
                        y = Math.floor(bbox.y);
                        y < bbox.y + bbox.height;
                        y++
                      ) {
                        bbPixelMap[x + y * width] = 1
                      }
                    }

                    // Update count
                    labelDrawCount--

                    // Draw
                    ctx.fillStyle = '#FFFFFF'
                    ctx.strokeStyle = '#FFFFFF'

                    ctx.fillText(label, labelCoordinates.x, labelCoordinates.y)
                    ctx.strokeText(
                      label,
                      labelCoordinates.x,
                      labelCoordinates.y
                    )
                    ctx.lineWidth = 0
                    ctx.fillStyle = color.toString()
                    ctx.fillText(label, labelCoordinates.x, labelCoordinates.y)
                  }
                }
              })
            }

            $scope.scales = scales

            function tuneColorForLabel(c) {
              var hcl = d3.hcl(c)
              hcl.c = Math.max(hcl.c, settings.label_color_min_C)
              hcl.c = Math.min(hcl.c, settings.label_color_max_C)
              hcl.l = Math.max(hcl.l, settings.label_color_min_L)
              hcl.l = Math.min(hcl.l, settings.label_color_max_L)
              return d3.color(hcl)
            }

            function getLinePath(nsx, nsy, ntx, nty) {
              var d = Math.sqrt(Math.pow(nsx - ntx, 2), Math.pow(nsy - nty, 2))
              var path = []
              for (i = 0; i < 1; i += 1 / d) {
                x = (1 - i) * nsx + i * ntx
                y = (1 - i) * nsy + i * nty
                path.push([x, y, 1])
              }
              return path
            }

            function getCurvedPath(nsx, nsy, ntx, nty) {
              var path = []
              var angle = Math.atan2(nty - nsy, ntx - nsx)
              var distance = Math.sqrt(
                (nsx - ntx) * (nsx - ntx) + (nsy - nty) * (nsy - nty)
              )
              var offset = 1 + 0.8 * Math.sqrt(distance)
              var ticks = interpolateValues(0, distance, distance / 3)
              var reverseTicks = ticks.slice(0).reverse()

              ticks.forEach(function(t) {
                path.push([
                  nsx +
                    Math.cos(angle) * t +
                    Math.cos(angle + Math.PI / 2) * centralLineCurve(t),
                  nsy +
                    Math.sin(angle) * t +
                    Math.sin(angle + Math.PI / 2) * centralLineCurve(t),
                  1
                ])
              })

              return path

              function centralLineCurve(X) {
                // Parabolic curve with given offset at center
                var a = 0,
                  c = (4 * offset) / (distance * distance),
                  b = -c * distance

                return a + b * X + c * X * X
              }

              function interpolateValues(
                min,
                max,
                intervalsCount,
                omitFirst,
                omitLast
              ) {
                var range = []
                for (var i = 0; i <= intervalsCount; i++) {
                  range.push(min + ((max - min) * i) / intervalsCount)
                }

                if (omitFirst) {
                  range.shift()
                }

                if (omitLast) {
                  range.pop()
                }

                return range
              }
            }
          }, 50)
        }

        function debounce(func, wait, immediate) {
          var timeout
          return function() {
            var context = this,
              args = arguments
            var later = function() {
              timeout = null
              if (!immediate) func.apply(context, args)
            }
            var callNow = immediate && !timeout
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)
            if (callNow) func.apply(context, args)
          }
        }
      }
    }
  })
