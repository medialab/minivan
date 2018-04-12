'use strict';

angular.module('app.components.cardAttributeRankingDistribution', [])

.directive('cardAttributeRankingDistribution', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    templateUrl: 'components/cardAttributeRankingDistribution.html',
    scope: {
    	attId: '=',
      modalitiesSelection: '=',
      detailLevel: '=',
    	printMode: '='
    },
    link: function($scope, el, attrs) {
    	var g = networkData.g
    	$scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
    	$scope.$watch('modalitiesSelection', function(){
	    	$scope.hiddenModalities = d3.values($scope.modalitiesSelection).some(function(d){ return d }) && d3.values($scope.modalitiesSelection).some(function(d){ return !d })
    	}, true)
		}
  }
})

.directive('rankingDistributionChart', function(
    $timeout,
    scalesUtils
  ){
    return {
      restrict: 'A',
      scope: {
        attribute: '=',
        printMode: '=',
        modalitiesSelection: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('attribute', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.attribute !== undefined){
            $timeout(function(){
              el.html('');
              draw(el[0], $scope.attribute)
            })
          }
        }

        function draw(container, attribute) {

        	var settings = {}
	        settings.max_bands_count = container.offsetWidth < 500 ? 30 : 50
	        settings.bar_spacing = 3

	        var data = scalesUtils.buildRankingDistribution(attribute, settings.max_bands_count, true)
	        var valuesExtent = [d3.min(data, function(d){ return d.min }), d3.max(data, function(d){ return d.max })]
        	var startFromZero = 0 <= valuesExtent[0]/valuesExtent[1] && valuesExtent[0]/valuesExtent[1] < 0.2

        	// set the dimensions and margins of the graph
					var margin = {top: 12, right: 12, bottom: 24, left: 12},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

        	var x = d3.scaleLinear()
        		.domain([startFromZero ? 0 : valuesExtent[0], valuesExtent[1]])
        		.range([0, width])

        	var y = d3.scaleLinear()
	        	.domain(d3.extent(data, function(d){ return d.count }))
	        	.range([0, height]);

        	var svg = d3.select(container).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 
					          'translate(' + margin.left + ',' + margin.top + ')');

					// append the rectangles for the bar chart
				  var bars = svg.selectAll('.bar')
				      .data(data)

				  // bar
				  bars.enter().append('rect')
				      .attr('class', 'bar')
				      .attr('x', function(d) { return x(d.min) + 1 })
				      .attr('y', function(d) { return height - y(d.count) })
				      .attr('height', function(d) { return y(d.count) })
				      .attr('width', function(d) { return x(d.max) - x(d.min) - 2 })
				      .attr('fill', 'rgba(160, 160, 160, 0.5)')

				  // labels
				  var labels = bars.enter().append('text')
				      .attr('x', function(d) { return x(d.average) })
				      .attr('y', function(d) { return height - y(d.count) - 3 })
				      .text( function (d) { return d.count ? d.count : '' })
				      .attr('text-anchor', 'middle')
				      .attr('font-family', 'Quicksand, sans-serif')
              .attr('font-weight', '400')
              .attr('font-size', '12px')
              .attr('fill', 'black')
              

				  var xAxis = d3.axisBottom(x)
				  
				  svg.append("g")
			      .attr("class", "axis axis--x")
			      .attr("transform", "translate(0," + height + ")")
			      .call(xAxis);

				}
      }
    }
  })

