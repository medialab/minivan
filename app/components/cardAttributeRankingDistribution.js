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

    	$scope.distributionData = scalesUtils.buildRankingDistribution($scope.attribute, 70, true)

    	// Does log plot make sense?
    	var avgExtent = d3.extent($scope.distributionData, function(d){ return d.average })
    	var negValues = avgExtent[0] < 0
    	var posValues = avgExtent[1] > 0
    	$scope.logPlot = !(negValues && posValues)
		}
  }
})

.directive('rankingDistributionChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        attribute: '=',
        data: '=',
        printMode: '=',
        modalitiesSelection: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('attribute', redraw)
        $scope.$watch('data', redraw)

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
	        settings.bar_spacing = 3

	        var data = $scope.data
	        var valuesExtent = [d3.min(data, function(d){ return d.min }), d3.max(data, function(d){ return d.max })]
        	var startFromZero = 0 <= valuesExtent[0]/valuesExtent[1] && valuesExtent[0]/valuesExtent[1] < 0.2

        	// set the dimensions and margins of the graph
					var margin = {top: 12, right: 12, bottom: 24, left: 48},
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
				      .attr('width', function(d) { return Math.max(6, x(d.max) - x(d.min) - 2) })
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
			      .attr("transform", "translate(0," + height + ")")
			      .call(xAxis);

				}
      }
    }
  })

.directive('rankingDistributionLogChart', function(
    $timeout,
    $filter
  ){
    return {
      restrict: 'A',
      scope: {
        attribute: '=',
        data: '=',
        printMode: '=',
        modalitiesSelection: '='
      },
      link: function($scope, el, attrs) {
        el.html('<div>LOADING</div>')

        $scope.$watch('attribute', redraw)
        $scope.$watch('data', redraw)

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
	        settings.radius = 3
	        settings.item_color = 'rgba(40, 40, 40, 0.5)'

        	var data = $scope.data
        		.filter(function(d){
		        	// Note: remove data where count == 0 or average == 0 because of log scales
        			return d.average != 0 && d.count != 0
        		})
	        var valuesExtent = [d3.min(data, function(d){ return d.min }), d3.max(data, function(d){ return d.max })]
        	var startFromZero = 0 <= valuesExtent[0]/valuesExtent[1] && valuesExtent[0]/valuesExtent[1] < 0.2

        	// set the dimensions and margins of the graph
					var margin = {top: 36, right: 12, bottom: 36, left: 48},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

        	var x = d3.scaleLog()
	        	.domain(d3.extent(data, function(d){ return d.average }))
        		.range([0, width])

        	var y = d3.scaleLog()
	        	.domain(d3.extent(data, function(d){ return d.count }))
	        	.range([height, 0]);

        	var svg = d3.select(container).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 
					          'translate(' + margin.left + ',' + margin.top + ')');

					var items = svg.selectAll('.item')
				      .data(data)

				  items.enter().append('circle')
				      .attr('class', 'bar')
				      .attr('cx', function(d) { return x(d.average) })
				      .attr('cy', function(d) { return y(d.count) })
				      .attr('r', settings.radius)
				      .attr('fill', settings.item_color)
			      .append('title')
			      	.text(function(d){ return d.count + ' nodes in [' + $filter('number')(d.min) + ', ' + $filter('number')(d.max) + ']'})

				  var xAxis = d3.axisBottom(x)
				  var yAxis = d3.axisLeft(x)
				  
				  svg.append("g")
				      .attr("transform", "translate(0," + height + ")")
				      .call(xAxis);

				  svg.append("g")
			      	.call(yAxis);


			    // Axes titles
			    svg.append("text")
				    	.attr('x', 0)
				      .attr('y', -12)
				      .text('NODES COUNT')
				      .attr('text-anchor', 'middle')
	            .attr('font-size', '12px')
	            .attr('fill', 'black')

	        svg.append("text")
				    	.attr('x', width)
				      .attr('y', height + 36)
				      .text(attribute.name.toUpperCase())
				      .attr('text-anchor', 'end')
	            .attr('font-size', '12px')
	            .attr('fill', 'black')
				}
      }
    }
  })

