'use strict';

/* Services */

angular.module('app.components.partitionBarChart', [])

.directive('partitionBarChart', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
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

          var data = $scope.att.modalities
          	.sort(function(a, b){
          		return a.count - b.count
          	})
          // set the dimensions and margins of the graph
					var margin = {top: 10, right: 10, bottom: 10, left: 10},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

					console.log(width, height)

					// set the ranges
					var y = d3.scaleBand()
					          .range([height, 0])
					          .padding(0.1);

					var x = d3.scaleLinear()
					          .range([0, width]);
					          
					// append the svg object to the body of the page
					// append a 'group' element to 'svg'
					// moves the 'group' element to the top left margin
					var svg = d3.select(container).append("svg")
					    .attr("width", width + margin.left + margin.right)
					    .attr("height", height + margin.top + margin.bottom)
					  .append("g")
					    .attr("transform", 
					          "translate(" + margin.left + "," + margin.top + ")");

				  // Scale the range of the data in the domains
					x.domain([0, d3.max(data, function(d){ return d.count; })])
				  y.domain(data.map(function(d) { return d.value; }));

				  // append the rectangles for the bar chart
				  svg.selectAll(".bar")
				      .data(data)
				    .enter().append("rect")
				      .attr("class", "bar")
				      .attr("width", function(d) {return x(d.count); } )
				      .attr("y", function(d) { return y(d.value); })
				      .attr("height", y.bandwidth());

				  // add the x Axis
				  svg.append("g")
				      .attr("transform", "translate(0," + height + ")")
				      .call(d3.axisBottom(x));

				  // add the y Axis
				  svg.append("g")
				      .call(d3.axisLeft(y));


        })
      }
    }
  }
})