'use strict';

/* Services */

angular.module('app.components.partitionBarChart', [])

.directive('partitionBarChart', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    template: '<small style="opacity:0.5;">loading</small>',
    scope: {
      att: '=',
      isSelected: '='
    },
    link: function($scope, el, attrs) {
      var container = el[0]

      $scope.$watch('att', redraw)
      $scope.$watch('isSelected', function(){
      	$timeout(redraw, 200)
      })
      window.addEventListener('resize', redraw)

			$scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var g = networkData.g

      function redraw(){
        $timeout(function(){
	        container.innerHTML = '';

	        var settings = {}
	        settings.max_bars = 10
	        settings.bar_spacing = 3
	        settings.color_box_width = 20

          var data = $scope.att.modalities
          	.sort(function(a, b){
          		return a.count - b.count
          	})
          // set the dimensions and margins of the graph
					var margin = {top: 0, right: 6, bottom: 0, left: 12 + settings.color_box_width},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

					// set the ranges
					var y = d3.scaleBand()
					          .range([height * Math.min(data.length, 10) / 10, 0])

					var x = d3.scaleLinear()
					          .range([0, width]);
					          
					var svg = d3.select(container).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 
					          'translate(' + margin.left + ',' + margin.top + ')');

				  // Scale the range of the data in the domains
					x.domain([0, d3.max(data, function(d){ return d.count; })])
				  y.domain(data.map(function(d) { return d.value }).filter(function(d, i){ return i<settings.max_bars }));

				  // append the rectangles for the bar chart
				  var bars = svg.selectAll('.bar')
				      .data(data)

				  bars.enter().append('rect')
				      .attr('class', 'bar')
				      .attr('width', function(d) {return x(d.count); } )
				      .attr('y', function(d) { return y(d.value); })
				      .attr('height', y.bandwidth() - settings.bar_spacing)
				      .attr('fill', '#BBB')

				  // Text labels
				  var labels = bars.enter().append('text')
				      .attr('class', 'bar-label')
				      .attr('x', function(d) {
				      	if (x(d.count) > width/2) {
				      		return x(d.count) - 3 
				      	} else {
				      		return x(d.count) + 3
				      	}
				      })
				      .attr('y', function(d) { return y(d.value) + y.bandwidth() - settings.bar_spacing - 5; })
				      .text( function (d) { return d.value; })
              .attr('text-anchor', function(d,i) {
				      	if (x(d.count) > width/2) {
				      		return 'end' 
				      	} else {
				      		return 'start'
				      	}
				      })
              .attr('font-family', 'Quicksand, sans-serif')
              .attr('font-weight', '400')
              .attr('font-size', '12px')
              .attr('fill', 'black')
              .attr('oob', function(d,i,e) { // Out of bounds
					      	if (e[i].getBBox().x < 0) {
					      		d.oob = true
					      		return 'true'
					      	} else {
					      		d.oob = false
					      		return 'false'
					      	}
					      })
          
          // Adjust placement issues
          labels
          	.attr('text-anchor', function(d,i,e) {
				      	if (d.oob) {
				      		return 'start'
				      	} else {
				      		if (x(d.count) > width/2) {
					      		return 'end' 
					      	} else {
					      		return 'start'
					      	}
				      	}
				      })
          	.attr('x', function(d,i,e) {
				      	if (d.oob) {
				      		return 3
				      	} else {
				      		if (x(d.count) > width/2) {
					      		return x(d.count) - 3 
					      	} else {
					      		return x(d.count) + 3
					      	}
				      	}
				      })
          	.attr('font-weight', function(d,i,e) {
				      	if (d.oob) {
				      		return '500'
				      	} else {
				      		if (x(d.count) > width/2) {
					      		return '500' 
					      	} else {
					      		return '400'
					      	}
				      	}
				      })

          // console.log(labels.node().getBBox())

				  // Color boxes
				  bars.enter().append('rect')
				      .attr('class', 'color-box')
				      .attr('x', -6 - settings.color_box_width )
				      .attr('width', settings.color_box_width )
				      .attr('y', function(d) { return y(d.value); })
				      .attr('height', y.bandwidth() - settings.bar_spacing)
				      .attr('fill', function(d) { return d.color })
        })
      }
    }
  }
})