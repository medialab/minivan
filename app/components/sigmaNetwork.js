'use strict';

/* Services */

angular.module('app.components.sigmaNetworkComponent', [])

  .directive('sigmaNetwork', function(
    $timeout,
    networkData,
    scalesUtils,
    layoutCache
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'components/sigmaNetwork.html'
      ,scope: {
        suspendLayout: '=',             // Optional. Stops layout when suspendLayout becomes true
        startLayoutOnShow: '=',         // Optional. Starts layout when suspendLayout becomes false
        startLayoutOnLoad: '=',         // Optional. Default: true
        onNodeClick: '=',
        colorAttId: '=',
        sizeAttId: '=',
        nodeFilter: '=',                // Optional. Used to display only certain nodes (the others are present but muted)
        hardFilter: '=',                // Optional. When enabled, hidden nodes are completely removed
        editableAttributes: '=',        // Optional. Allows to unset color and size attributes (close buttons)
        getCameraState: '=',
        hideCommands: '=',
        enableLayout: '=',
        layoutCacheKey: '='             // Optional. Used to cache and recall layout.
      }
      ,link: function($scope, el, attrs) {
        var renderer
        var networkDisplayThreshold = 1000

        $scope.networkData = networkData
        $scope.nodesCount
        $scope.edgesCount
        $scope.tooBig = false
        $scope.loaded = false
        $scope.layout
        $scope.colorAtt
        $scope.sizeAtt

        $scope.stateOnSuspendLayout = ($scope.startLayoutOnLoad === undefined || $scope.startLayoutOnLoad)

        $scope.$watch('networkData.loaded', function(){
          if ( $scope.networkData.loaded ) {
            $scope.g = networkData.g.copy()
            $scope.loaded = true
            $scope.nodesCount = $scope.g.order
            $scope.edgesCount = $scope.g.size
            $scope.tooBig = $scope.nodesCount > networkDisplayThreshold
            updateColorFilter()
            updateSizeFilter()
            updateNodeAppearance()
            refreshSigma()
          }
        })

        $scope.$watch('colorAttId', function(){
          updateColorFilter()
          $timeout(updateNodeAppearance, 120)
        })

        $scope.$watch('sizeAttId', function(){
          updateSizeFilter()
          $timeout(updateNodeAppearance, 120)
        })

        $scope.$watch('onNodeClick', updateMouseEvents)

        $scope.$watch('suspendLayout', function(){
          if ($scope.layout === undefined) { return }
          if ($scope.suspendLayout === true) {
            $scope.stateOnSuspendLayout = $scope.layout.running
            $scope.stopLayout()
          } else if ($scope.suspendLayout === false) {
            if ($scope.startLayoutOnShow === true || $scope.stateOnSuspendLayout) {
              $scope.startLayout()
            }
          }
        })

        $scope.$watch('nodeFilter', updateNodeAppearance)

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold = $scope.nodesCount+1
          $scope.tooBig = false
          refreshSigma()
        }

        $scope.stopLayout = function() {
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
          if ($scope.layoutCacheKey) {
            layoutCache.store($scope.layoutCacheKey, $scope.g, $scope.layout.running)
          }
        }

        $scope.startLayout = function() {
          if ($scope.layout === undefined) { return }
          $scope.layout.start()
        }

        $scope.restoreOriginalLayout = function() {
          // $scope.g = networkData.g.copy()
          layoutCache.clear($scope.layoutCacheKey)
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
          $scope.g.nodes().forEach(function(nid){
            $scope.g.setNodeAttribute(nid, 'x', networkData.g.getNodeAttribute(nid, 'x'))
            $scope.g.setNodeAttribute(nid, 'y', networkData.g.getNodeAttribute(nid, 'y'))
          })
        }

        // These functions will be initialized at Sigma creation
        $scope.zoomIn = function(){}
        $scope.zoomOut = function(){}
        $scope.resetCamera = function(){}

        $scope.$on("$destroy", function(){
          if ($scope.layoutCacheKey) {
            layoutCache.store($scope.layoutCacheKey, $scope.g, $scope.layout.running)
          }
          if ($scope.layout) {
            $scope.layout.kill()
          }
          var sigma = undefined
          var renderer = undefined

        })

        /// Functions

        function updateColorFilter(){
          if ( $scope.g === undefined ) return
          if ($scope.colorAttId) {
            $scope.colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
          } else {
            $scope.colorAtt = undefined
          }
        }

        function updateSizeFilter(){
          if ( $scope.g === undefined ) return
          if ($scope.sizeAttId) {
            $scope.sizeAtt = $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
          } else {
            $scope.sizeAtt = undefined
          }
        }

        function updateNodeAppearance() {
          if ($scope.networkData.loaded) {

            var g = $scope.g

            var settings = {}
            settings.default_node_color = '#969390'
            settings.default_node_color_muted = '#EEE'
            settings.default_edge_color = '#DDD'
            settings.default_edge_color_muted = '#FAFAFA'


            /// NODES

            // Filter
            var nodeFilter
            if ($scope.hardFilter) {
              g.dropNodes(g.nodes().filter(function(nid){
                return !$scope.nodeFilter(nid)
              }))

              nodeFilter = function(d){return d}
            } else {
              nodeFilter = $scope.nodeFilter || function(d){return d}
            }

            // Update positions from cache
            if ($scope.layoutCacheKey) {
              var wasRunning = layoutCache.recall($scope.layoutCacheKey, g)
              if (wasRunning && $scope.enableLayout && $scope.layout && !$scope.layout.running) {
                $scope.startLayout()
              } else if (wasRunning == false && $scope.layout && $scope.layout.running) {
                $scope.stopLayout()
              }
            }

            // Size
            var nodesDensity = g.order / (el[0].offsetWidth * el[0].offsetHeight)
            var standardArea =  0.03 / nodesDensity
            var rScale = scalesUtils.getRScale()
            var getSize
            if ($scope.sizeAttId) {
              var sizeAtt = $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
              var areaScale = scalesUtils.getAreaScale(sizeAtt.min, sizeAtt.max, sizeAtt.areaScaling.min, sizeAtt.areaScaling.max, sizeAtt.areaScaling.interpolation)
              getSize = function(nid){ return rScale(sizeAtt.areaScaling.max * areaScale(g.getNodeAttribute(nid, sizeAtt.id)) * standardArea / 10) }
            } else {
              // Trick: a barely visible size difference by degree
              // (helps hierarchizing node labels)
              getSize = function(nid){ return rScale(standardArea + 0.1 * Math.log(1 + g.degree(nid)) ) }
            }

            // Color
            var getColor
            if ($scope.colorAttId) {
              var colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
              if (colorAtt.type == 'partition') {
                var colorByModality = {}
                colorAtt.modalities.forEach(function(m){
                  colorByModality[m.value] = m.color
                })
                getColor = function(nid){ return colorByModality[g.getNodeAttribute(nid, colorAtt.id)] || '#000' }
              } else if (colorAtt.type == 'ranking-color') {
                var colorScale = scalesUtils.getColorScale(colorAtt.min, colorAtt.max, colorAtt.colorScale)
                getColor = function(nid){ return colorScale(g.getNodeAttribute(nid, colorAtt.id)).toString() }
              } else {
                getColor = function(){ return settings.default_node_color }
              }
            } else {
              getColor = function(){ return settings.default_node_color }
            }

            // Default / muted
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'z', 0)
              g.setNodeAttribute(nid, 'size', getSize(nid))
              g.setNodeAttribute(nid, 'color', settings.default_node_color_muted)
            })

            // Color (using node filter)
            g.nodes()
              .filter(nodeFilter)
              .forEach(function(nid){
                g.setNodeAttribute(nid, 'z', 1)
                g.setNodeAttribute(nid, 'color', getColor(nid))
              })

            /// EDGES

            // Default / muted
            g.edges().forEach(function(eid){
              g.setEdgeAttribute(eid, 'z', 0)
              g.setEdgeAttribute(eid, 'color', settings.default_edge_color_muted)
            })

            // Color (using node filter)
            g.edges()
              .filter(function(eid){
                return nodeFilter(g.source(eid)) && nodeFilter(g.target(eid))
              })
              .forEach(function(eid){
                g.setEdgeAttribute(eid, 'z', 1)
                g.setEdgeAttribute(eid, 'color', settings.default_edge_color)
              })
          }
        }

        function refreshSigma() {
          $timeout(function(){

            var settings = {}
            settings.default_ratio = 1.2

            var container = document.getElementById('sigma-div')
            if (!container) return
            container.innerHTML = ''
            renderer = new Sigma.WebGLRenderer($scope.g, container, {
              labelFont: "Quicksand",
              labelWeight: '400',
              labelSize: 12
            })
            
            $scope.zoomIn = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: state.ratio / 1.5})
            }

            $scope.zoomOut = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: state.ratio * 1.5})
            }

            $scope.resetCamera = function(){
              var camera = renderer.getCamera()
              var state = camera.getState()
              camera.animate({ratio: settings.default_ratio, x:0.5, y:0.5})
            }

            // Defaults to some unzoom
            var camera = renderer.getCamera()
            var state = camera.getState()
            camera.animate({ratio: settings.default_ratio, x:0.5, y:0.5})

            $scope.getCameraState = function() {
              return camera.getState()
            }

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new Graph.library.FA2Layout($scope.g, {
              settings: {
                barnesHutOptimize: g.order > 2000,
                strongGravityMode: true,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log(g.order)
              }
            });
            if (
              ($scope.startLayoutOnLoad || $scope.startLayoutOnLoad === undefined)
              && (!$scope.suspendLayout || $scope.suspendLayout === undefined)
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
            renderer.on('clickNode', function(e){
              $timeout(function(){
                $scope.onNodeClick(e.node)
              })
            })
            renderer.on('overNode', function(e){
              el[0].classList.add('pointable')
            })
            renderer.on('outNode', function(e){
              el[0].classList.remove('pointable')
            })

          }
        }

      }
    }
  })
