'use strict';

/* Services */

angular.module('app.components.canvasNetworkMap', [])

.directive('canvasNetworkMap', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">loading</small>',
    scope: {
    	colorAttId: '=',
    	sizeAttId: '=',
    	nodeSize: '=',
    	oversampling: '=',
    	x: '=',
    	y: '=',
    	ratio: '='
    },
    link: function($scope, el, attrs) {
    	$scope.$watch('colorAttId', redraw)
    	$scope.$watch('sizeAttId', redraw)
    	$scope.$watch('oversampling', redraw)
    	$scope.$watch('nodeSize', redraw)

      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var g = networkData.g

      var container = el[0]

      function redraw(){
      	g = networkData.g
      	if (g === undefined) {
      		$timeout(redraw, 500)
      		return
      	}
      	$timeout(function(){
          container.innerHTML = '';

          var settings = {}

					// Canvas size
					settings.save_at_the_end = false
					settings.oversampling = +$scope.oversampling
					settings.width =  container.offsetWidth
					settings.height = container.offsetHeight
					settings.margin = 3

					// Edges
					settings.draw_edges = g.size < 10000
					settings.edge_color = 'rgba(230, 230, 230, 0.6)'
					settings.edge_thickness = 0.6

					// Nodes
					settings.node_size = (+$scope.nodeSize || 10) / 10
					settings.default_node_color = d3.color('#999')
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
					var scales = scalesUtils.getXYScales_camera(width, height, margin, +$scope.x, +$scope.y, +$scope.ratio)
					var xScale = scales[0]
					var yScale = scales[1]
					var rScale = scalesUtils.getRScale()

					// Create the canvas
					container.innerHTML = '<div style="width:'+settings.width+'; height:'+settings.height+';"><canvas id="cnvs" width="'+width+'" height="'+height+'" style="width: 100%;"></canvas></div>'
					var canvas = container.querySelector('#cnvs')
					var ctx = canvas.getContext("2d")

					// Draw each edge
					if (settings.draw_edges) {
						g.edges().forEach(function(eid){
							var ns = g.getNodeAttributes(g.source(eid))
							var nt = g.getNodeAttributes(g.target(eid))

						  ctx.beginPath()
						  ctx.lineCap="round"
						  ctx.lineJoin="round"
						  ctx.strokeStyle = settings.edge_color
						  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
						  ctx.lineWidth = edge_thickness
						  ctx.moveTo(xScale(ns.x), yScale(ns.y))
						  ctx.lineTo(xScale(nt.x), yScale(nt.y))
						  ctx.stroke()
						  ctx.closePath()
						})
					}

					// Colors
					var getColor
					if ($scope.colorAttId) {
            var colorAtt = networkData.nodeAttributesIndex[$scope.colorAttId]
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

					// Sizes
					var nodesInTheFrame = g.nodes().filter(function(nid){
						var n = g.getNodeAttributes(nid)
						var x = xScale(n.x)
						var y = xScale(n.y)
						return x >= 0 && x <= width && y >= 0 && y <= height
					})
					var nodesDensity = nodesInTheFrame.length / (el[0].offsetWidth * el[0].offsetHeight)
					var standardArea =  0.03 / nodesDensity
					var getArea
					if ($scope.sizeAttId) {
            var sizeAtt = networkData.nodeAttributesIndex[$scope.sizeAttId]
            var areaScale = scalesUtils.getAreaScale(sizeAtt.min, sizeAtt.max, sizeAtt.areaScaling.min, sizeAtt.areaScaling.max, sizeAtt.areaScaling.interpolation)
            getArea = function(nid){ return sizeAtt.areaScaling.max * areaScale(g.getNodeAttribute(nid, sizeAtt.id)) * standardArea / 10 }
          } else {
						getArea = function(nid){ return standardArea }
          }

					// Draw each node
					g.nodes().forEach(function(nid){
						var n = g.getNodeAttributes(nid)

					  ctx.lineCap="round"
					  ctx.lineJoin="round"

					  ctx.beginPath()
					  ctx.arc(
					  	xScale(n.x),
					  	yScale(n.y),
					  	node_size
					  		* rScale(getArea(nid)), 
					  	0,
					  	2 * Math.PI,
					  	false
					  )
					  ctx.lineWidth = 0
					  ctx.fillStyle = getColor(nid).toString()
					  ctx.shadowColor = 'transparent'
					  ctx.fill()
					})

        })
      }
    }
  }
})