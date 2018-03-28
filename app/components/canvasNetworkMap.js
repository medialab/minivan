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
    	clearEdgesAroundNodes: '=',
    	x: '=',
    	y: '=',
    	ratio: '='
    },
    link: function($scope, el, attrs) {
    	$scope.$watch('colorAttId', redraw)
    	$scope.$watch('sizeAttId', redraw)
    	$scope.$watch('oversampling', redraw)
    	$scope.$watch('nodeSize', redraw)
    	$scope.$watch('clearEdgesAroundNodes', redraw)

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
      	container.innerHTML = '<small style="opacity:0.5;">Refreshing...</small>'
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
					settings.clear_edges_around_nodes = $scope.clearEdgesAroundNodes
					settings.edge_color = 'rgba(230, 230, 230, 0.6)'
					settings.edge_thickness = 0.6

					// Nodes
					settings.node_size = (+$scope.nodeSize || 10) / 10
					settings.node_stroke_width = 1.0 // Nodes white contour
					settings.default_node_color = d3.color('#999')
					settings.size_scale_emphasize = 2
					settings.node_halo_range = 15

					// Node labels
					settings.label_count = 10 // How much node labels you want to show (the biggest nodes)
					settings.label_white_border_thickness = 2.5
					settings.label_font_min_size = 9
					settings.label_font_max_size = 18
					settings.label_font_family = 'Quicksand, sans-serif'
					settings.label_font_weight = 300

					var i
					var x
					var y
					var d
					var width = settings.oversampling * settings.width
					var height = settings.oversampling * settings.height
					var margin = settings.oversampling * settings.margin
					var edge_thickness = settings.oversampling * settings.edge_thickness
					var node_size = settings.oversampling * settings.node_size
					var node_stroke_width = settings.oversampling * settings.node_stroke_width
					var node_halo_range = settings.oversampling * settings.node_halo_range
					var label_white_border_thickness = settings.oversampling * settings.label_white_border_thickness
					var label_font_min_size = settings.oversampling * settings.label_font_min_size
					var label_font_max_size = settings.oversampling * settings.label_font_max_size
					var scales = scalesUtils.getXYScales_camera(width, height, margin, +$scope.x, +$scope.y, +$scope.ratio)
					var xScale = scales[0]
					var yScale = scales[1]
					var rScale = scalesUtils.getRScale()

					// Create the canvas
					container.innerHTML = '<div style="width:'+settings.width+'; height:'+settings.height+';"><canvas id="cnvs" width="'+width+'" height="'+height+'" style="width: 100%;"></canvas></div>'
					var canvas = container.querySelector('#cnvs')
					var ctx = canvas.getContext("2d")

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

          // Nodes in the frame
					var nodesInTheFrame = g.nodes().filter(function(nid){
						var n = g.getNodeAttributes(nid)
						var x = xScale(n.x)
						var y = yScale(n.y)
						return x >= 0 && x <= width && y >= 0 && y <= height
					})

					// Sizes
					var nodesDensity = nodesInTheFrame.length / (el[0].offsetWidth * el[0].offsetHeight)
					var standardArea =  0.01 / nodesDensity
					var getArea
					if ($scope.sizeAttId) {
            var sizeAtt = networkData.nodeAttributesIndex[$scope.sizeAttId]
            var areaScale = scalesUtils.getAreaScale(sizeAtt.min, sizeAtt.max, sizeAtt.areaScaling.min, sizeAtt.areaScaling.max, sizeAtt.areaScaling.interpolation)
            getArea = function(nid){ return sizeAtt.areaScaling.max * areaScale(g.getNodeAttribute(nid, sizeAtt.id)) * standardArea / 10 }
          } else {
            // Trick: a barely visible size difference by degree
            // (helps hierarchizing node labels)
            getArea = function(nid){ return standardArea + 0.1 * Math.log(1 + g.degree(nid)) }
          }

          // Compute areas once for all
          var areaIndex = {}
          g.nodes().forEach(function(nid){
          	areaIndex[nid] = getArea(nid)
          })

					// Paint a white background
					ctx.beginPath()
					ctx.rect(0, 0, width, height)
					ctx.fillStyle="white"
					ctx.fill()
					ctx.closePath()

					// Tell which nodes' label to show
					// TODO: implement a strategy without overlap
					var nodesBySize = nodesInTheFrame.slice(0)
					// We sort nodes by 1) size and 2) left to right
					nodesBySize.sort(function(naid, nbid){
					  var na = g.getNodeAttributes(naid)
					  var nb = g.getNodeAttributes(nbid)
					  var nasize = areaIndex[naid]
					  var nbsize = areaIndex[nbid]
					  if ( nasize < nbsize ) {
					    return 1
					  } else if ( nasize > nbsize ) {
					    return -1
					  } else if ( na.x < nb.x ) {
					    return 1
					  } else if ( na.x > nb.x ) {
					    return -1
					  }
					  return 0
					})
					var showLabelIndex = {}
					nodesBySize.forEach(function(nid, i){
					  showLabelIndex[nid] = i < settings.label_count;
					})

					var vidIndex = {}
					if (settings.clear_edges_around_nodes) {
						// Get an index of nodes where ids are integers
						var nodesIndex = g.nodes().slice(0)
						nodesIndex.unshift(null) // We reserve 0 for "no closest"

						// Generate "voronoi ids" (vid)
						nodesIndex.forEach(function(nid, vid){
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
						nodesInTheFrame.forEach(function(nid){
						  var n = g.getNodeAttributes(nid)
						  var nx = xScale(n.x)
						  var ny = yScale(n.y)
						  var nsize = rScale(areaIndex[nid])
						  var nvid = vidIndex[nid]
						  var range = nsize * node_size + node_halo_range
						  for (x = Math.max(0, Math.floor(nx - range) ); x <= Math.min(width, Math.floor(nx + range) ); x++ ){
						    for (y = Math.max(0, Math.floor(ny - range) ); y <= Math.min(height, Math.floor(ny + range) ); y++ ){
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
						var gradient = function(d){
						  return 0.5 + 0.5 * Math.cos(Math.PI - Math.pow(d, 2) * Math.PI)
						}
						for (i in dPixelMap) {
						  dPixelMap[i] = gradient(dPixelMap[i])
						}
					}


          // Draw each edge
					if (settings.draw_edges) {
						g.edges().forEach(function(eid){
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
						  var d = Math.sqrt(Math.pow(nsx - ntx, 2) + Math.pow(nsy - nty, 2))
						  var color = d3.color(settings.edge_color)

						  // Build path
						  var path = []
						  for (i=0; i<1; i+=1/d) {
						    x = (1-i)*nsx + i*ntx
						    y = (1-i)*nsy + i*nty

						    // Opacity
						    var o
						    var pixi = Math.floor(x) + width * Math.floor(y)
						    if (!settings.clear_edges_around_nodes || vidPixelMap[pixi] == nsvid || vidPixelMap[pixi] == ntvid || vidPixelMap[pixi] == 0) {
						      o = 1
						    } else {
						      o = dPixelMap[pixi]
						    }
						    path.push([x,y,o])
						  }
						  
						  // Smoothe path
						  if (path.length > 5) {
						    for (i=2; i<path.length-2; i++) {
						      path[i][2] = 0.15 * path[i-2][2] + 0.25 * path[i-1][2] + 0.2 * path[i][2] + 0.25 * path[i+1][2] + 0.15 * path[i+2][2]
						    }
						  }

						  // Draw path
						  var lastp
						  var lastop
						  path.forEach(function(p, pi){
						    if (lastp) {
						      color.opacity = p[2]
						      ctx.beginPath()
						      ctx.lineCap="round"
						      ctx.lineJoin="round"
						      ctx.strokeStyle = color.toString()
						      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
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

					// Draw each node
					nodesBySize.reverse() // Because we draw from background to foreground
					nodesBySize.forEach(function(nid){
						var n = g.getNodeAttributes(nid)
						var nx = xScale(n.x)
						var ny = yScale(n.y)
						var nsize = rScale(getArea(nid))

					  var color = getColor(nid)

					  ctx.lineCap="round"
					  ctx.lineJoin="round"

					  ctx.beginPath()
					  ctx.arc(nx, ny, node_size * nsize + node_stroke_width, 0, 2 * Math.PI, false)
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

					// Compute scale for labels
					var label_nodeSizeExtent = d3.extent(
					  nodesBySize.filter(function(nid){
					    return showLabelIndex[nid]
					  }).map(function(nid){
					    return rScale(areaIndex[nid])
					  })
					)
					if (label_nodeSizeExtent[0] == label_nodeSizeExtent[1]) {label_nodeSizeExtent[0] *= 0.9}

					// Draw labels
					nodesBySize.forEach(function(nid){
					  var n = g.getNodeAttributes(nid)
					  var nx = xScale(n.x)
						var ny = yScale(n.y)
						var nsize = rScale(getArea(nid))

					  if(showLabelIndex[nid]){
					    var color = getColor(nid)
					    var fontSize = Math.floor(label_font_min_size + (nsize - label_nodeSizeExtent[0]) * (label_font_max_size - label_font_min_size) / (label_nodeSizeExtent[1] - label_nodeSizeExtent[0]))

					    // Then, draw the label only if wanted
					    var labelCoordinates = {
					      x: nx + 0.6 * label_white_border_thickness + 1.05 * node_size * nsize,
					      y: ny + 0.25 * fontSize
					    }

					    var label = n.label.replace(/^https*:\/\/(www\.)*/gi, '')

					    ctx.font = settings.label_font_weight + " " + fontSize + "px " + settings.label_font_family
					    ctx.lineWidth = label_white_border_thickness

					    // Bounding box test
							var bbox = getBBox(ctx, fontSize, labelCoordinates)
							function getBBox(ctx, fontSize, labelCoordinates) {
								return {
									x: labelCoordinates.x,
									y: labelCoordinates.y - 0.8 * fontSize,
									width: ctx.measureText(label).width,
									height: fontSize
								}
							}
							
							ctx.fillStyle = '#FFFFFF'
					    ctx.strokeStyle = '#FFFFFF'

					    ctx.fillText(
					      label
					    , labelCoordinates.x
					    , labelCoordinates.y
					    )
					    ctx.strokeText(
					      label
					    , labelCoordinates.x
					    , labelCoordinates.y
					    )
					    ctx.lineWidth = 0
					    ctx.fillStyle = color.toString()
					    ctx.fillText(
					      label
					    , labelCoordinates.x
					    , labelCoordinates.y
					    )
					  }
					  
					})

        })
      }
    }
  }
})