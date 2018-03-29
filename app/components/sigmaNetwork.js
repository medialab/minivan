'use strict';

/* Services */

angular.module('app.components.sigmaNetworkComponent', [])

  .directive('sigmaNetwork', function(
    $timeout,
    networkData,
    scalesUtils
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
        getCameraState: '='
      }
      ,link: function($scope, el, attrs) {
        var sigma
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

        $scope.$watch('networkData', function(){
          $scope.loaded = false
          if ( $scope.networkData.g === undefined ) return
          $timeout(function(){
            $scope.loaded = true
            $scope.nodesCount = $scope.networkData.g.order
            $scope.edgesCount = $scope.networkData.g.size
            $scope.tooBig = $scope.nodesCount > networkDisplayThreshold
            refreshSigma()
          })
        })

        $scope.$watch('colorAttId', function(){
          if ( $scope.networkData.g === undefined ) return
          if ($scope.colorAttId) {
            $scope.colorAtt = $scope.networkData.nodeAttributesIndex[$scope.colorAttId]
          } else {
            $scope.colorAtt = undefined
          }
          $timeout(updateNodeAppearance, 120)
        })

        $scope.$watch('sizeAttId', function(){
          if ( $scope.networkData.g === undefined ) return
          if ($scope.sizeAttId) {
            $scope.sizeAtt = $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]
          } else {
            $scope.sizeAtt = undefined
          }
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

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold = $scope.nodesCount+1
          $scope.tooBig = false
          refreshSigma()
        }

        $scope.stopLayout = function(){
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
        }

        $scope.startLayout = function(){
          if ($scope.layout === undefined) { return }
          $scope.layout.start()
        }

        // These functions will be initialized at Sigma creation
        $scope.zoomIn = function(){}
        $scope.zoomOut = function(){}
        $scope.resetCamera = function(){}

        $scope.$on("$destroy", function(){
          if ($scope.layout) {
            $scope.layout.kill()
          }
          var sigma = undefined
          var renderer = undefined
        })

        /// Functions

        function updateNodeAppearance() {
          $timeout(function(){

            var g = $scope.networkData.g

            var settings = {}
            settings.default_node_color = '#969390'

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

            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'size', getSize(nid))
              g.setNodeAttribute(nid, 'color', getColor(nid))
            })
          })
        }

        function refreshSigma() {
          $timeout(function(){

            var settings = {}
            settings.default_ratio = 1.2

            var container = document.getElementById('sigma-div')
            if (!container) return
            container.innerHTML = ''
            renderer = new Sigma.WebGLRenderer(container)
            sigma = new Sigma(g, renderer)

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
              camera.animate({ratio: settings.default_ratio, x:0, y:0})
            }

            // Defaults to some unzoom
            var camera = renderer.getCamera()
            var state = camera.getState()
            camera.animate({ratio: settings.default_ratio, x:0, y:0})

            $scope.getCameraState = function() {
              var state = camera.getState()
              return {
                x: state.x / +container.offsetWidth,
                y: state.y / +container.offsetHeight,
                ratio: state.ratio
              }
            }

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new Graph.library.FA2Layout(g, {
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
          if (sigma === undefined || renderer === undefined) {
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
