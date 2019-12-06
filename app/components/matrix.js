'use strict'

/* Services */

angular
  .module('app.components.matrix', [])

  .directive('matrix', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'E',
      templateUrl: 'components/matrix.html',
      scope: {
        onNodeClick: '=',
        onEdgeClick: '=',
        nodeFilter: '=',
        selectedAttId: '=',
        detailLevel: '=',
        printMode: '=',
        viewBox: '=',
        nodeFilter: '='
      },
      link: function($scope, el, attrs) {
        var networkDisplayThreshold = 2500
        console.log('coucou')

        $scope.tooBig = false
        $scope.headlineSize = 200
        $scope.cellSize = 16
        $scope.networkData = dataLoader.get()
        $scope.nodesCount
        $scope.edgesCount
        $scope.$watch('networkData.loaded', function() {
          if ($scope.networkData && $scope.networkData.loaded) {
            $scope.nodesCount = $scope.networkData.g.order
            $scope.edgesCount = $scope.networkData.g.size

            if ($scope.nodesCount > networkDisplayThreshold) {
              $scope.tooBig = true
            }
            updateNodes()
            update()
          }
        })

        var scrollSource

        $scope.$watch('colorAttId', update)
        $scope.$watch('sizeAttId', update)
        $scope.$watch('selectedAttId', update)
        $scope.$watch('nodeFilter', updateNodes)
        $scope.$watch('minimapViewBox', updateScrollSource)
        $scope.$watch('detailLevel', function() {
          if ($scope.detailLevel == 2) {
            // Update view box on resize
            window.addEventListener('resize', updateViewBox)
            $scope.$on('$destroy', function() {
              window.removeEventListener('resize', updateViewBox)
            })
            updateScrollListening()
            updateViewBox()
          } else {
            try {
              window.removeEventListener('resize', updateViewBox)
              scrollSource.removeEventListener('scroll', updateScroll)
            } catch (e) {}
          }
        })

        $scope.displayLargeNetwork = function() {
          $scope.tooBig = false
          update()
        }

        if ($scope.viewBox) {
          var initViewBox = $scope.viewBox
          // if a view box is passed at initialization, use it
          $timeout(function() {
            scrollSource = el[0].querySelector('#scroll-source')
            if (scrollSource) {
              // the view box size may not be the same
              var initCenterX = initViewBox.x + initViewBox.w / 2
              var initCenterY = initViewBox.y + initViewBox.h / 2
              scrollSource.scrollLeft = Math.round(
                initCenterX * ($scope.viewSize - $scope.headlineSize) -
                  (el[0].offsetWidth - $scope.headlineSize) / 2
              )
              scrollSource.scrollTop = Math.round(
                initCenterY * ($scope.viewSize - $scope.headlineSize) -
                  (el[0].offsetHeight - $scope.headlineSize) / 2
              )
            }
          }, 250)
        }

        function updateScrollListening() {
          scrollSource = el[0].querySelector('#scroll-source')
          if (scrollSource) {
            scrollSource.addEventListener('scroll', updateScroll)
            $scope.$on('$destroy', function() {
              if (scrollSource)
                scrollSource.removeEventListener('scroll', updateScroll)
            })
          }
        }

        function updateScroll() {
          // Use the top index to trigger the updates
          $scope.topIndexX = Math.floor(
            scrollSource.scrollLeft / $scope.cellSize
          )
          $scope.topIndexY = Math.floor(
            scrollSource.scrollTop / $scope.cellSize
          )

          // Actuall scroll
          var targetsX = el[0].querySelectorAll('.scroll-target-x')
          targetsX.forEach(function(n) {
            n.childNodes[0].scrollLeft = Math.round(scrollSource.scrollLeft)
          })

          var targetsY = el[0].querySelectorAll('.scroll-target-y')
          targetsY.forEach(function(n) {
            n.childNodes[0].scrollTop = Math.round(scrollSource.scrollTop)
          })
          updateViewBox()
        }

        function updateScrollSource() {
          if ($scope.minimapViewBox) {
            scrollSource.scrollLeft =
              $scope.minimapViewBox.x * ($scope.viewSize - $scope.headlineSize)
            scrollSource.scrollTop =
              $scope.minimapViewBox.y * ($scope.viewSize - $scope.headlineSize)
            updateScroll()
          }
        }

        function updateNodes() {
          var g = $scope.networkData.g
          var nodeFilter =
            $scope.nodeFilter ||
            function(d) {
              return d
            }
          $scope.nodes = g.nodes().filter(nodeFilter)

          $scope.viewSize =
            $scope.headlineSize + $scope.nodes.length * $scope.cellSize

          // Init view box
          updateViewBox()

          // Compute edges index
          $scope.edgeIndex = {}
          $scope.nodes.forEach(function(nid) {
            $scope.edgeIndex[nid] = {}
          })
          g.edges().forEach(function(eid) {
            var nsid = g.source(eid)
            var ntid = g.target(eid)
            if ($scope.edgeIndex[nsid] && $scope.edgeIndex[ntid]) {
              $scope.edgeIndex[nsid][ntid] = eid
            }
          })

          // Nodes sort
          if (!$scope.selectedAttId || $scope.networkData.loaded) {
            scalesUtils.sortNodes($scope.nodes, $scope.selectedAttId)
          }
        }

        function update() {
          if ($scope.selectedAttId) {
            $scope.att =
              $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
            // Color
            if ($scope.att.type == 'partition') {
              var colorByModality = {}
              Object.values($scope.att.modalities).forEach(function(m) {
                colorByModality[m.value] = m.color
              })
              var colorScale = function(val) {
                return colorByModality[val] || '#999'
              }
              $scope.getColor = function(nid) {
                return colorScale(
                  $scope.networkData.g.getNodeAttribute(
                    nid,
                    $scope.selectedAttId
                  )
                )
              }
            } else if ($scope.att.type == 'ranking-color') {
              var colorScale = scalesUtils.getColorScale(
                $scope.att.min,
                $scope.att.max,
                $scope.att.colorScale,
                $scope.att.invertScale,
                $scope.att.truncateScale
              )
              var colorScale_string = function(val) {
                return colorScale(val).toString()
              }
              $scope.getColor = function(nid) {
                return colorScale_string(
                  $scope.networkData.g.getNodeAttribute(
                    nid,
                    $scope.selectedAttId
                  )
                )
              }
            } else {
              $scope.getColor = function(nid) {
                return '#999'
              }
            }

            // Size
            if ($scope.att.type == 'ranking-size') {
              var areaScale = scalesUtils.getAreaScale(
                $scope.att.min,
                $scope.att.max,
                $scope.att.areaScaling.min,
                $scope.att.areaScaling.max,
                $scope.att.areaScaling.interpolation
              )
              var rScale = scalesUtils.getRScale()
              var rMax = rScale(1)
              $scope.getRadius = function(nid) {
                return (
                  rScale(
                    areaScale(
                      $scope.networkData.g.getNodeAttribute(
                        nid,
                        $scope.selectedAttId
                      )
                    )
                  ) / rMax
                )
              }
            } else {
              $scope.getRadius = function(nid) {
                return 1
              }
            }
          } else {
            $scope.getColor = function(nid) {
              return '#999'
            }
            $scope.getRadius = function(n) {
              return 1
            }
          }

          updateNodes()
        }

        function updateViewBox() {
          scrollSource = el[0].querySelector('#scroll-source')
          if (scrollSource) {
            $scope.viewBox = {
              x:
                scrollSource.scrollLeft /
                ($scope.viewSize - $scope.headlineSize),
              y:
                scrollSource.scrollTop /
                ($scope.viewSize - $scope.headlineSize),
              w:
                (el[0].offsetWidth - $scope.headlineSize) /
                ($scope.viewSize - $scope.headlineSize),
              h:
                (el[0].offsetHeight - $scope.headlineSize) /
                ($scope.viewSize - $scope.headlineSize)
            }
          }
        }
      }
    }
  })

  .directive('matrixSvg', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">loading</small>',
      scope: {
        nodes: '=',
        edgeIndex: '=',
        getRadius: '=',
        getColor: '=',
        headlines: '='
      },
      link: function($scope, el, attrs) {
        $scope.cellSize = 16

        $scope.networkData = dataLoader.get()
        $scope.$watch('networkData.loaded', function() {
          if ($scope.networkData && $scope.networkData.loaded) {
            redraw()
          }
        })

        $scope.$watch('nodes', redraw)
        $scope.$watch('edgeIndex', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.nodes !== undefined && $scope.edgeIndex !== undefined) {
            $timeout(function() {
              el.html('')
              draw(el[0])
            })
          }
        }

        function draw(container) {
          var settings = {}
          settings.cell_size = $scope.cellSize
          settings.display_headlines = !!$scope.headlines
          settings.headline_thickness = 0.8 * d3.keys($scope.edgeIndex).length
          settings.lines_thickness = settings.headline_thickness / 100

          var g = $scope.networkData.g
          var data = []
          var nsid, ntid
          for (nsid in $scope.edgeIndex) {
            for (ntid in $scope.edgeIndex[nsid]) {
              data.push({ source: nsid, target: ntid })
            }
          }

          var margin = {
            top: settings.display_headlines
              ? settings.lines_thickness * 2 + settings.headline_thickness
              : 0,
            right: settings.display_headlines
              ? settings.lines_thickness * 2 + settings.headline_thickness
              : 0,
            bottom: settings.display_headlines
              ? settings.lines_thickness * 2 + settings.headline_thickness
              : 0,
            left: settings.display_headlines
              ? settings.lines_thickness * 2 + settings.headline_thickness
              : 0
          }
          var width = $scope.nodes.length * $scope.cellSize
          var height = width // square space

          var x = d3
            .scaleBand()
            .range([0, width])
            .domain($scope.nodes)

          var ratio =
            Math.min(container.offsetWidth, container.offsetHeight) /
            (width + margin.left + margin.right)

          var svg = d3
            .select(container)
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

          // Headlines
          if (settings.display_headlines) {
            var topHeadCells = svg.selectAll('.thcell').data($scope.nodes)
            topHeadCells
              .enter()
              .append('rect')
              .attr('class', 'thcell')
              .attr('x', function(nid, i) {
                return i * settings.cell_size
              })
              .attr('y', function(nid) {
                return -$scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('width', settings.cell_size)
              .attr('height', function(nid) {
                return $scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('fill', function(nid) {
                return $scope.getColor(nid)
              })

            var bottomHeadCells = svg.selectAll('.bhcell').data($scope.nodes)
            topHeadCells
              .enter()
              .append('rect')
              .attr('class', 'bhcell')
              .attr('x', function(nid, i) {
                return i * settings.cell_size
              })
              .attr('y', function(nid) {
                return height
              })
              .attr('width', settings.cell_size)
              .attr('height', function(nid) {
                return $scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('fill', function(nid) {
                return $scope.getColor(nid)
              })

            var leftHeadCells = svg.selectAll('.lhcell').data($scope.nodes)
            leftHeadCells
              .enter()
              .append('rect')
              .attr('class', 'lhcell')
              .attr('y', function(nid, i) {
                return i * settings.cell_size
              })
              .attr('x', function(nid) {
                return -$scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('height', settings.cell_size)
              .attr('width', function(nid) {
                return $scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('fill', function(nid) {
                return $scope.getColor(nid)
              })

            var rightHeadCells = svg.selectAll('.rhcell').data($scope.nodes)
            leftHeadCells
              .enter()
              .append('rect')
              .attr('class', 'rhcell')
              .attr('y', function(nid, i) {
                return i * settings.cell_size
              })
              .attr('x', function(nid) {
                return width
              })
              .attr('height', settings.cell_size)
              .attr('width', function(nid) {
                return $scope.getRadius(nid) * settings.headline_thickness
              })
              .attr('fill', function(nid) {
                return $scope.getColor(nid)
              })

            // Lines
            svg
              .append('line')
              .attr('x1', 0)
              .attr('y1', -settings.headline_thickness)
              .attr('x2', width)
              .attr('y2', -settings.headline_thickness)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', -settings.headline_thickness)
              .attr('y1', 0)
              .attr('x2', width + settings.headline_thickness)
              .attr('y2', 0)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', -settings.headline_thickness)
              .attr('y1', height)
              .attr('x2', width + settings.headline_thickness)
              .attr('y2', height)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', 0)
              .attr('y1', height + settings.headline_thickness)
              .attr('x2', width)
              .attr('y2', height + settings.headline_thickness)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')

            svg
              .append('line')
              .attr('x1', -settings.headline_thickness)
              .attr('y1', 0)
              .attr('x2', -settings.headline_thickness)
              .attr('y2', width)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', 0)
              .attr('y1', -settings.headline_thickness)
              .attr('x2', 0)
              .attr('y2', width + settings.headline_thickness)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', width)
              .attr('y1', -settings.headline_thickness)
              .attr('x2', width)
              .attr('y2', height + settings.headline_thickness)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
            svg
              .append('line')
              .attr('x1', width + settings.headline_thickness)
              .attr('y1', 0)
              .attr('x2', width + settings.headline_thickness)
              .attr('y2', height)
              .style('stroke-width', settings.lines_thickness)
              .style('stroke', '#333')
          }

          // Background
          svg
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'rgba(238, 238, 238, 0.3)')

          // append the cells
          var cells = svg.selectAll('.cell').data(data)

          cells
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('x', function(d) {
              return x(d.target)
            })
            .attr('y', function(d) {
              return x(d.source)
            })
            .attr('width', settings.cell_size)
            .attr('height', settings.cell_size)
            .attr('fill', 'rgba(0, 0, 0, 0.9)')
        }
      }
    }
  })

  .directive('matrixViewBox', function($timeout, scalesUtils) {
    return {
      restrict: 'E',
      template: '',
      scope: {
        viewBox: '=',
        viewBoxDragged: '='
      },
      link: function($scope, el, attrs) {
        $scope.headlineSize = 200
        $scope.cellSize = 16

        $scope.$watch('viewBox', redraw)

        // Click interactions
        var drag = false
        el[0].addEventListener('click', moveViewBox)
        el[0].addEventListener('touchmove', moveViewBox)
        el[0].addEventListener('mousedown', startDrag)
        el[0].addEventListener('mouseup', stopDrag)
        el[0].addEventListener('mouseleave', stopDrag)
        el[0].addEventListener('mousemove', moveViewBoxIfDrag)
        $scope.$on('$destroy', function() {
          el[0].removeEventListener('click', moveViewBox)
          el[0].removeEventListener('touchmove', moveViewBox)
          el[0].removeEventListener('mousedown', startDrag)
          el[0].removeEventListener('mouseup', stopDrag)
          el[0].removeEventListener('mouseleave', stopDrag)
          el[0].removeEventListener('mousemove', moveViewBoxIfDrag)
        })
        function startDrag(e) {
          drag = true
          e.preventDefault ? e.preventDefault() : (e.returnValue = false)
        }
        function stopDrag() {
          drag = false
        }
        function moveViewBoxIfDrag(e) {
          if (drag) {
            moveViewBox(e)
          }
        }
        function moveViewBox(e) {
          var x = e.offsetX / $scope.headlineSize - $scope.viewBox.w / 2
          var y = e.offsetY / $scope.headlineSize - $scope.viewBox.h / 2
          x = Math.max(0, Math.min(1 - $scope.viewBox.w, x))
          y = Math.max(0, Math.min(1 - $scope.viewBox.h, y))
          $timeout(function() {
            $scope.viewBoxDragged = {
              x: x,
              y: y,
              w: $scope.viewBox.w,
              h: $scope.viewBox.h
            }
          })
        }

        function redraw() {
          if ($scope.viewBox) {
            $timeout(function() {
              el.html('')
              draw(el[0])
            })
          }
        }

        function draw(container) {
          var settings = {}
          settings.border_size = 3

          var margin = { top: 0, right: 0, bottom: 0, left: 0 }
          var width = container.offsetWidth
          var height = width // square space

          var x = d3
            .scaleLinear()
            .range([0, width])
            .domain([0, 1])

          var svg = d3
            .select(container)
            .append('svg')
            .attr('width', Math.floor(width + margin.left + margin.right))
            .attr('height', Math.floor(height + margin.top + margin.bottom))
            .append('g')
            .attr(
              'transform',
              'translate(' + margin.left + ',' + margin.top + ')'
            )

          svg
            .append('rect')
            .attr('x', x($scope.viewBox.x) - settings.border_size / 2)
            .attr('y', x($scope.viewBox.y) - settings.border_size / 2)
            .attr('width', x($scope.viewBox.w) + settings.border_size)
            .attr('height', x($scope.viewBox.h) + settings.border_size)
            .attr('fill', 'none')
            .attr('stroke', '#239dfe')
            .attr('stroke-width', settings.border_size)
        }
      }
    }
  })

  .directive('matrixLine', function(dataLoader) {
    return {
      restrict: 'A',
      scope: {
        nodeId: '=',
        nodes: '=',
        edgeIndex: '=',
        printMode: '=',
        att: '=',
        getRadius: '=',
        getColor: '=',
        cellSize: '=',
        headlineSize: '=',
        topIndexX: '='
      },
      templateUrl: 'components/matrixLine.html',
      link: function($scope, el, attrs) {
        $scope.$watch('nodeId', function() {
          $scope.node = dataLoader.get().g.getNodeAttributes($scope.nodeId)
        })
      }
    }
  })
