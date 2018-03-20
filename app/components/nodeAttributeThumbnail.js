'use strict';

/* Services */

angular.module('app.components.nodeAttributeThumbnail', [])

.directive('nodeAttributeThumbnail', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">loading</small>',
    scope: {
      att: '='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('att', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var g = networkData.g

      var container = el[0]

      function redraw(){
        $timeout(function(){
          container.innerHTML = '';

          var settings = {}

					// Canvas size
					settings.save_at_the_end = false
					settings.width =  container.offsetWidth
					settings.height = container.offsetHeight
					settings.offset = 3 // Margin

					// Voronoi
					settings.voronoi_use_node_size = false
					settings.voronoi_range = 2.5 // Limits cells' size
					settings.voronoi_paint_distance = true

					var i
					var x
					var y
					var d
					var scales = scalesUtils.getXYScales(settings.width, settings.height, settings.offset)
					var xScale = scales[0]
					var yScale = scales[1]

					// Limit voronoi range
					settings.voronoi_range = Math.min(settings.voronoi_range, Math.sqrt(Math.pow(settings.width, 2) + Math.pow(settings.height, 2)))

					// Create the canvas
					container.innerHTML = '<div style="width:'+settings.width+'; height:'+settings.height+';"><canvas id="cnvs" width="'+settings.width+'" height="'+settings.height+'"></canvas></div>'
					var canvas = container.querySelector('#cnvs')
					var ctx = canvas.getContext("2d")

					// Get an index of nodes where ids are integers
					var nodesIndex = g.nodes().slice(0)
					nodesIndex.unshift(null) // We reserve 0 for "no closest"

					// Save this "voronoi id" as a node attribute
					nodesIndex.forEach(function(nid, vid){
					  if (vid > 0) {
					    var n = g.getNodeAttributes(nid)
					    n.vid = vid
					  }
					})

					// Init a pixel map of integers for voronoi ids
					var vidPixelMap = new Int32Array(settings.width * settings.height)
					for (i in vidPixelMap) {
					  vidPixelMap[i] = 0
					}

					// Init a pixel map of floats for distances
					var dPixelMap = new Float32Array(settings.width * settings.height)
					for (i in dPixelMap) {
					  dPixelMap[i] = Infinity
					}

					// Compute the voronoi using the pixel map
					g.nodes().forEach(function(nid){
					  var n = g.getNodeAttributes(nid)
					  var range = settings.voronoi_range
					  if (settings.voronoi_use_node_size) {
					    range *= n.size
					  }
					  for (x = Math.max(0, Math.floor(xScale(n.x) - range) ); x <= Math.min(settings.width, Math.floor(xScale(n.x) + range) ); x++ ){
					    for (y = Math.max(0, Math.floor(yScale(n.y) - range) ); y <= Math.min(settings.height, Math.floor(yScale(n.y) + range) ); y++ ){
					      d = Math.sqrt(Math.pow(xScale(n.x) - x, 2) + Math.pow(yScale(n.y) - y, 2))
					      if (d < range && n.size>0) {
					        if (settings.voronoi_use_node_size) {
					          d /= n.size
					        }
					        i = x + settings.width * y
					        var existingVid = vidPixelMap[i]
					        if (existingVid == 0) {
					          // 0 means there is no closest node
					          vidPixelMap[i] = n.vid
					          dPixelMap[i] = d
					        } else {
					          // There is already a closest node. Edit only if we are closer.
					          if (d < dPixelMap[i]) {
					            vidPixelMap[i] = n.vid
					            dPixelMap[i] = d
					          }
					        }
					      }
					    }
					  }
					})

					// Colors
					var getColor
					if ($scope.att.type == 'partition') {
						var colorsIndex = {}
						$scope.att.modalities.forEach(function(modality){
							colorsIndex[modality.value] = modality.color
						})
						getColor = function(d){
							return d3.color(colorsIndex[d] || '#999')
						}
					} else if ($scope.att.type == 'ranking-size') {
						getColor = scalesUtils.getSizeAsColorScale($scope.att.min, $scope.att.max, $scope.att.areaScaling.min, $scope.att.areaScaling.max, $scope.att.areaScaling.interpolation)
					} else if ($scope.att.type == 'ranking-color') {
						getColor = scalesUtils.getColorScale($scope.att.min, $scope.att.max, $scope.att.colorScale)
					} else {
						getColor = function(){ return d3.color('#000') }
					}

					// Paint voronoi map
					var imgd = ctx.getImageData(0, 0, settings.width, settings.height)
					var pix = imgd.data
					var pixlen
					for ( i = 0, pixlen = pix.length; i < pixlen; i += 4 ) {
					  var vid = vidPixelMap[i/4]
					  if (vid > 0) {
					  	var color = getColor(g.getNodeAttribute(nodesIndex[vid], $scope.att.id))
					    pix[i  ] = color.r // red
					    pix[i+1] = color.g // green
					    pix[i+2] = color.b // blue
					    if (settings.voronoi_paint_distance) {
					      pix[i+3] = Math.floor(color.opacity * (255 - 255 * Math.pow(dPixelMap[i/4]/settings.voronoi_range, 2)))
					    } else {
					      pix[i+3] = Math.floor(255*color.opacity) // alpha
					    }
					  }
					}

					// Finalize paint
					ctx.putImageData( imgd, 0, 0 )

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