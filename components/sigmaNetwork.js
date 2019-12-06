'use strict'

/* Services */

angular
  .module('app.components.sigmaNetworkComponent', [])
  .directive('networkButtons', () => ({
    restrict: 'E',
    templateUrl: 'components/network-buttons.html'
  }))
  .directive('embedButtons', () => ({
    restrict: 'E',
    replace: true,
    templateUrl: 'components/embed-buttons.html',
    link: function($scope) {
      $scope.isOpen = $scope.$parent.$parent.$parent.blockGestures
      $scope.toggle = () => {
        $scope.isOpen = !$scope.isOpen
      }
    }
  }))
  .directive('sigmaNetwork', function(
    $timeout,
    dataLoader,
    scalesUtils,
    layoutCache,
    storage
  ) {
    return {
      restrict: 'E',
      templateUrl: 'components/sigmaNetwork.html',
      scope: {
        suspendLayout: '=', // Optional. Stops layout when suspendLayout becomes true
        startLayoutOnShow: '=', // Optional. Starts layout when suspendLayout becomes false
        startLayoutOnLoad: '=', // Optional. Default: true
        onNodeClick: '=',
        nodeColorAttId: '=',
        nodeSizeAttId: '=',
        edgeColorAttId: '=',
        edgeSizeAttId: '=',
        attRecheck: '=', // Optional. Just a trick: change it to check attributes again
        nodeFilter: '=', // Optional. Used to display only certain nodes (the others are present but muted)
        hardFilter: '=', // Optional. When enabled, hidden nodes are completely removed
        editableAttributes: '=', // Optional. Allows to unset color and size attributes (close buttons)
        getRenderer: '=',
        defaultZoomShowPercent: '=', // Optional. If set to n, camera centered to barycenter with n% nodes visible
        hideCommands: '=', // Optional
        rightCommands: '=', // Optional
        hideKey: '=', // Optional
        hideLabels: '=', // Optional
        enableLayout: '=',
        layoutCacheKey: '=', // Optional. Used to cache and recall layout.
        neverTooBig: '=' // Optional. When enabled, the warning nerver shows
      },
      link: function($scope, el) {
        var renderer
        var networkDisplayThreshold =
          storage.get('networkDisplayThreshold') || 2500

        $scope.networkData = dataLoader.get()
        $scope.nodesCount
        $scope.edgesCount
        $scope.tooBig = false
        $scope.loaded = false
        $scope.layout
        $scope.colorAtt
        $scope.sizeAtt
        $scope.barycentricDefaultCam

        $scope.stateOnSuspendLayout =
          $scope.startLayoutOnLoad === undefined || $scope.startLayoutOnLoad

        $scope.$watch('networkData.loaded', function() {
          if ($scope.networkData.loaded) {
            $scope.g = $scope.networkData.g.copy()
            $scope.loaded = true
            $scope.nodesCount = $scope.g.order
            $scope.edgesCount = $scope.g.size
            $scope.tooBig =
              !$scope.neverTooBig && $scope.nodesCount > networkDisplayThreshold
            updateNodeColorFilter()
            updateNodeSizeFilter()
            updateEdgeColorFilter()
            updateEdgeSizeFilter()
            updateNodeEdgeAppearance()
            refreshSigma()
          }
        })

        $scope.$watch('nodeColorAttId', function() {
          updateNodeColorFilter()
          $timeout(updateNodeEdgeAppearance, 120)
        })

        $scope.$watch('nodeSizeAttId', function() {
          updateNodeSizeFilter()
          $timeout(updateNodeEdgeAppearance, 120)
        })

        $scope.$watch('edgeColorAttId', function() {
          updateEdgeColorFilter()
          $timeout(updateNodeEdgeAppearance, 120)
        })

        $scope.$watch('edgeSizeAttId', function() {
          updateEdgeSizeFilter()
          $timeout(updateNodeEdgeAppearance, 120)
        })

        $scope.$watch('attRecheck', function() {
          updateNodeSizeFilter()
          updateEdgeSizeFilter()
          $timeout(updateNodeEdgeAppearance, 120)
        })

        $scope.$watch('onNodeClick', updateMouseEvents)

        $scope.$watch('suspendLayout', function() {
          if ($scope.layout === undefined) {
            return
          }
          if ($scope.suspendLayout === true) {
            $scope.stateOnSuspendLayout = $scope.layout.running
            $scope.stopLayout()
          } else if ($scope.suspendLayout === false) {
            if (
              $scope.startLayoutOnShow === true ||
              $scope.stateOnSuspendLayout
            ) {
              $scope.startLayout()
            }
          }
        })

        $scope.$watch('nodeFilter', updateNodeEdgeAppearance)

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold = $scope.nodesCount + 1
          storage.set('networkDisplayThreshold', networkDisplayThreshold)
          $scope.tooBig = false
          refreshSigma()
        }

        $scope.stopLayout = function() {
          if ($scope.layout === undefined) {
            return
          }
          $scope.layout.stop()
          if ($scope.layoutCacheKey) {
            layoutCache.store(
              $scope.layoutCacheKey,
              $scope.g,
              $scope.layout.running
            )
          }
        }

        $scope.startLayout = function() {
          if ($scope.layout === undefined) {
            return
          }
          $scope.layout.start()
        }

        $scope.restoreOriginalLayout = function() {
          // $scope.g = $scope.networkData.g.copy()
          layoutCache.clear($scope.layoutCacheKey)
          if ($scope.layout === undefined) {
            return
          }
          $scope.layout.stop()
          $scope.g.nodes().forEach(function(nid) {
            $scope.g.setNodeAttribute(
              nid,
              'x',
              $scope.networkData.g.getNodeAttribute(nid, 'x')
            )
            $scope.g.setNodeAttribute(
              nid,
              'y',
              $scope.networkData.g.getNodeAttribute(nid, 'y')
            )
          })
        }

        $scope.toggleFullscreen = function() {
          screenfull.toggle(el[0])
        }

        // These functions will be initialized at Sigma creation
        $scope.zoomIn = function() {}
        $scope.zoomOut = function() {}
        $scope.resetCamera = function() {}

        $scope.$on('$destroy', function() {
          if ($scope.layoutCacheKey) {
            layoutCache.store(
              $scope.layoutCacheKey,
              $scope.g,
              $scope.layout.running
            )
          }
          if ($scope.layout) {
            $scope.layout.kill()
          }
          if (renderer) {
            renderer.kill()
          }
        })

        /// Functions

        function updateNodeColorFilter() {
          if ($scope.g === undefined) return
          if ($scope.nodeColorAttId) {
            $scope.nodeColorAtt =
              $scope.networkData.nodeAttributesIndex[$scope.nodeColorAttId]
          } else {
            $scope.nodeColorAtt = undefined
          }
        }

        function updateNodeSizeFilter() {
          if ($scope.g === undefined) return
          if ($scope.nodeSizeAttId) {
            $scope.nodeSizeAtt =
              $scope.networkData.nodeAttributesIndex[$scope.nodeSizeAttId]
          } else {
            $scope.nodeSizeAtt = undefined
          }
        }

        function updateEdgeColorFilter() {
          if ($scope.g === undefined) return
          if ($scope.edgeColorAttId) {
            $scope.edgeColorAtt =
              $scope.networkData.edgeAttributesIndex[$scope.edgeColorAttId]
          } else {
            $scope.edgeColorAtt = undefined
          }
        }

        function updateEdgeSizeFilter() {
          if ($scope.g === undefined) return
          if ($scope.edgeSizeAttId) {
            $scope.edgeSizeAtt =
              $scope.networkData.edgeAttributesIndex[$scope.edgeSizeAttId]
          } else {
            $scope.edgeSizeAtt = undefined
          }
        }

        function updateNodeEdgeAppearance() {
          if ($scope.networkData.loaded) {
            var g = $scope.g

            var settings = {
              default_node_color: '#969390',
              default_node_color_muted: '#EEE',
              default_edge_color: '#DDD',
              default_edge_color_muted: '#FAFAFA'
            }

            // Filter
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
              var wasRunning = layoutCache.recall($scope.layoutCacheKey, g)
              if (
                wasRunning &&
                $scope.enableLayout &&
                $scope.layout &&
                !$scope.layout.running
              ) {
                $scope.startLayout()
              } else if (
                wasRunning == false &&
                $scope.layout &&
                $scope.layout.running
              ) {
                $scope.stopLayout()
              }
            }

            // Node size
            var nodesDensity =
              g.order / (el[0].offsetWidth * el[0].offsetHeight)
            var standardArea = 0.03 / nodesDensity
            var rScale = scalesUtils.getRScale()
            var getNodeSize
            if ($scope.nodeSizeAttId) {
              var nodeSizeAtt =
                $scope.networkData.nodeAttributesIndex[$scope.nodeSizeAttId]

              if (!nodeSizeAtt.areaScaling) {
                nodeSizeAtt.areaScaling = {
                  min: 10,
                  max: 100,
                  interpolation: 'linear'
                }
              }
              var areaScaleSize = scalesUtils.getAreaScale(
                nodeSizeAtt.min,
                nodeSizeAtt.max,
                nodeSizeAtt.areaScaling.min,
                nodeSizeAtt.areaScaling.max,
                nodeSizeAtt.areaScaling.interpolation
              )
              getNodeSize = function(nid) {
                return rScale(
                  (nodeSizeAtt.areaScaling.max *
                    areaScaleSize(g.getNodeAttribute(nid, nodeSizeAtt.key)) *
                    standardArea) /
                    10
                )
              }
            } else {
              // Trick: a barely visible size difference by degree
              // (helps hierarchizing node labels)
              getNodeSize = function(nid) {
                return rScale(standardArea + 0.1 * Math.log(1 + g.degree(nid)))
              }
            }

            // Node color
            var getNodeColor
            if ($scope.nodeColorAttId) {
              var nodeColorAtt =
                $scope.networkData.nodeAttributesIndex[$scope.nodeColorAttId]
              if (nodeColorAtt.type == 'partition') {
                getNodeColor = function(nid) {
                  return (
                    nodeColorAtt.modalities[
                      g.getNodeAttribute(nid, nodeColorAtt.key)
                    ].color || settings.default_edge_color
                  )
                }
              } else if (nodeColorAtt.type == 'ranking-color') {
                var colorScale = scalesUtils.getColorScale(
                  nodeColorAtt.min,
                  nodeColorAtt.max,
                  nodeColorAtt.colorScale,
                  nodeColorAtt.invertScale,
                  nodeColorAtt.truncateScale
                )
                getNodeColor = function(nid) {
                  const value = g.getNodeAttribute(nid, nodeColorAtt.key)
                  const color = colorScale(value).toString()
                  return color
                }
              } else {
                getNodeColor = function() {
                  return settings.default_node_color
                }
              }
            } else {
              getNodeColor = function() {
                return settings.default_node_color
              }
            }

            // Edge size
            var getEdgeSize
            var standardThickness = 1
            if ($scope.edgeSizeAttId) {
              var edgeSizeAtt =
                $scope.networkData.edgeAttributesIndex[$scope.edgeSizeAttId]
              if (!edgeSizeAtt.areaScaling) {
                edgeSizeAtt.areaScaling = {
                  min: 10,
                  max: 100,
                  interpolation: 'linear'
                }
              }
              var areaScale = scalesUtils.getAreaScale(
                edgeSizeAtt.min,
                edgeSizeAtt.max,
                edgeSizeAtt.areaScaling.min,
                edgeSizeAtt.areaScaling.max,
                edgeSizeAtt.areaScaling.interpolation
              )
              getEdgeSize = function(eid) {
                return (
                  (edgeSizeAtt.areaScaling.max *
                    areaScale(g.getEdgeAttribute(eid, edgeSizeAtt.key)) *
                    standardThickness) /
                  10
                )
              }
            } else {
              getEdgeSize = function(eid) {
                return 1
              }
            }

            // Edge color
            var getEdgeColor
            if ($scope.edgeColorAttId) {
              var edgeColorAtt =
                $scope.networkData.edgeAttributesIndex[$scope.edgeColorAttId]
              if (edgeColorAtt.type == 'partition') {
                getEdgeColor = function(eid) {
                  return (
                    edgeColorAtt.modalities[
                      g.getEdgeAttribute(eid, edgeColorAtt.key)
                    ].color || '#000'
                  )
                }
              } else if (edgeColorAtt.type == 'ranking-color') {
                if (!edgeColorAtt.areaScaling) {
                  edgeColorAtt.areaScaling = {
                    min: 10,
                    max: 100,
                    interpolation: 'linear'
                  }
                }
                var edgeColorScale = scalesUtils.getColorScale(
                  edgeColorAtt.min,
                  edgeColorAtt.max,
                  edgeColorAtt.colorScale,
                  edgeColorAtt.invertScale,
                  edgeColorAtt.truncateScale
                )
                getEdgeColor = function(eid) {
                  const value = g.getEdgeAttribute(eid, edgeColorAtt.key)
                  const color = edgeColorScale(value || 0)
                  return color.toString()
                }
              } else {
                getEdgeColor = function() {
                  return settings.default_edge_color
                }
              }
            } else {
              getEdgeColor = function() {
                return settings.default_edge_color
              }
            }

            // Default / muted
            g.nodes().forEach(function(nid) {
              g.setNodeAttribute(nid, 'z', 0)
              g.setNodeAttribute(
                nid,
                'size',
                Math.max(0.0000001, getNodeSize(nid))
              )
              g.setNodeAttribute(
                nid,
                'color',
                settings.default_node_color_muted
              )
            })

            // Color (using node filter)
            g.nodes()
              .filter(nodeFilter)
              .forEach(function(nid) {
                g.setNodeAttribute(nid, 'z', 1)
                g.setNodeAttribute(nid, 'color', getNodeColor(nid))
              })

            /// EDGES

            // Default / muted
            g.edges().forEach(function(eid) {
              g.setEdgeAttribute(eid, 'z', 0)
              g.setEdgeAttribute(eid, 'size', getEdgeSize(eid))
              g.setEdgeAttribute(
                eid,
                'color',
                settings.default_edge_color_muted
              )
            })

            // Color (using node filter)
            g.edges()
              .filter(function(eid) {
                return nodeFilter(g.source(eid)) && nodeFilter(g.target(eid))
              })
              .forEach(function(eid) {
                g.setEdgeAttribute(eid, 'z', 1)
                g.setEdgeAttribute(eid, 'color', getEdgeColor(eid))
              })
          }
        }

        function refreshSigma() {
          $timeout(function() {
            var settings = {}
            settings.default_ratio = 1.2
            settings.default_x = 0.5
            settings.default_y = 0.5

            var container = document.getElementById('sigma-div')
            if (!container) return
            container.innerHTML = ''
            renderer = new Sigma.WebGLRenderer($scope.g, container, {
              labelFont: 'Quicksand',
              labelWeight: '400',
              renderLabels: !$scope.hideLabels,
              zIndex: true
            })

            $scope.zoomIn = function() {
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ ratio: state.ratio / 1.5 })
            }

            $scope.zoomOut = function() {
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ ratio: state.ratio * 1.5 })
            }

            $scope.resetCamera = function() {
              var camera = renderer.getCamera()
              var state = camera.getState()
              if ($scope.barycentricDefaultCam) {
                camera.animate($scope.barycentricDefaultCam)
              } else {
                camera.animate({
                  ratio: settings.default_ratio,
                  x: settings.default_x,
                  y: settings.default_y
                })
              }
            }

            // Defaults to some unzoom
            var camera = renderer.getCamera()
            var state = camera.getState()
            if ($scope.defaultZoomShowPercent) {
              // If option enabled, compute the default view from barycenter
              var xyScales = getXYScales_camera(1, 1, 0.5, 0.5, 1)
              var xExtent = d3.extent($scope.g.nodes(), function(nid) {
                return $scope.g.getNodeAttribute(nid, 'x')
              })
              var yExtent = d3.extent($scope.g.nodes(), function(nid) {
                return $scope.g.getNodeAttribute(nid, 'y')
              })
              var xMean = (xExtent[0] + xExtent[1]) / 2
              var yMean = (yExtent[0] + yExtent[1]) / 2
              var sizeRatio = Math.max(
                xExtent[1] - xExtent[0],
                yExtent[1] - yExtent[0]
              )
              var xScale = d3
                .scaleLinear()
                .range([0, 1])
                .domain([xMean - sizeRatio / 2, xMean + sizeRatio / 2])
              var yScale = d3
                .scaleLinear()
                .range([0, 1])
                .domain([yMean - sizeRatio / 2, yMean + sizeRatio / 2])

              var xBary =
                d3.sum($scope.g.nodes(), function(nid) {
                  return $scope.g.getNodeAttribute(nid, 'x')
                }) / $scope.g.order
              var yBary =
                d3.sum($scope.g.nodes(), function(nid) {
                  return $scope.g.getNodeAttribute(nid, 'y')
                }) / $scope.g.order

              // Iteratively find which ratio displays n% of the nodes by dichotomic search
              var visiblePart = function(ratio) {
                var xyScales = getXYScales_camera(
                  1,
                  1,
                  xScale(xBary),
                  yScale(yBary),
                  ratio
                )
                return (
                  $scope.g.nodes().filter(function(nid) {
                    var x = xyScales[0]($scope.g.getNodeAttribute(nid, 'x'))
                    var y = xyScales[1]($scope.g.getNodeAttribute(nid, 'y'))
                    return x > 0 && x < 1 && y > 0 && y < 1
                  }).length / $scope.g.order
                )
              }
              var visibleTarget = Math.max(
                0,
                Math.min(1, (+$scope.defaultZoomShowPercent || 100) / 100)
              )
              var minRatio = 0
              var maxRatio = 1
              var visible
              var limit = 100
              do {
                maxRatio *= 1.2
                visible = visiblePart((minRatio + maxRatio) / 2)
              } while (visible < visibleTarget && limit-- > 0)
              var offset, closeEnough
              do {
                visible = visiblePart((minRatio + maxRatio) / 2)
                offset = visible - visibleTarget
                closeEnough = Math.abs(offset) <= 0.001 * visibleTarget
                if (!closeEnough) {
                  if (offset > 0) {
                    maxRatio = (minRatio + maxRatio) / 2
                  } else {
                    minRatio = (minRatio + maxRatio) / 2
                  }
                }
              } while (!closeEnough && limit-- > 0)
              var unzoom = 0.08 // This additional unzoom adds a slight margin that's more comfortable
              $scope.barycentricDefaultCam = {
                ratio: ((1 + unzoom) * (minRatio + maxRatio)) / 2,
                x: xScale(xBary),
                y: yScale(yBary)
              }
              camera.animate($scope.barycentricDefaultCam)
            } else {
              camera.animate({
                ratio: settings.default_ratio,
                x: settings.default_x,
                y: settings.default_y
              })
            }

            $scope.getRenderer = function() {
              return renderer
            }

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new Graph.library.FA2Layout($scope.g, {
              settings: {
                barnesHutOptimize: $scope.g.order > 2000,
                strongGravityMode: true,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log($scope.g.order)
              }
            })
            if (
              ($scope.startLayoutOnLoad ||
                $scope.startLayoutOnLoad === undefined) &&
              (!$scope.suspendLayout || $scope.suspendLayout === undefined)
            ) {
              $scope.layout.start()
            }

            updateMouseEvents()
          })
        }

        function updateMouseEvents() {
          if (renderer === undefined) {
            return
          }

          if ($scope.onNodeClick !== undefined) {
            renderer.on('clickNode', function(e) {
              $timeout(function() {
                $scope.onNodeClick(e.node)
              })
            })
            renderer.on('enterNode', function(e) {
              el[0].classList.add('pointable')
            })
            renderer.on('leaveNode', function(e) {
              el[0].classList.remove('pointable')
            })
          }
        }

        function getXYScales_camera(width, height, x, y, ratio) {
          var g = $scope.g
          var xScale = d3
            .scaleLinear()
            .range([
              (-(x - 0.5) * width) / ratio,
              width - ((x - 0.5) * width) / ratio
            ])
          var yScale = d3
            .scaleLinear()
            .range([
              height + ((y - 0.5) * height) / ratio,
              ((y - 0.5) * height) / ratio
            ])

          var xExtent = d3.extent(g.nodes(), function(nid) {
            return g.getNodeAttribute(nid, 'x')
          })
          var yExtent = d3.extent(g.nodes(), function(nid) {
            return g.getNodeAttribute(nid, 'y')
          })
          var sizeRatio =
            ratio *
            Math.max(
              (xExtent[1] - xExtent[0]) / width,
              (yExtent[1] - yExtent[0]) / height
            )
          var xMean = (xExtent[0] + xExtent[1]) / 2
          var yMean = (yExtent[0] + yExtent[1]) / 2
          xScale.domain([
            xMean - (sizeRatio * width) / 2,
            xMean + (sizeRatio * width) / 2
          ])
          yScale.domain([
            yMean - (sizeRatio * height) / 2,
            yMean + (sizeRatio * height) / 2
          ])

          return [xScale, yScale]
        }
      }
    }
  })
