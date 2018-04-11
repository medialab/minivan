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
    $timeout
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
	        settings.maxBandsCount = container.offsetWidth < 500 ? 30 : 50
	        settings.bar_spacing = 3

        	var values = g.nodes().map(function(nid){ return g.getNodeAttribute(nid, attribute.id) })
        	var valuesExtent = d3.extent(values)
        	var startFromZero = 0 <= valuesExtent[0]/valuesExtent[1] && valuesExtent[0]/valuesExtent[1] < 0.2
        	var lowerBound
        	if (startFromZero) {
        		lowerBound = 0
        	} else {
	        	lowerBound = valuesExtent[0]
        	}
        	var upperBound = valuesExtent[1]
        	var bandWidth = (upperBound - lowerBound) / settings.maxBandsCount
        	// Lower the bandWidth to closest round number
        	bandWidth = Math.pow(10, Math.floor(Math.log(bandWidth)/Math.log(10)))
        	// Rise it up to round multiple
        	if ( (upperBound - lowerBound) / (bandWidth*2) <= settings.maxBandsCount ) {
        		bandWidth *= 2
        	} else if( (upperBound - lowerBound) / (bandWidth*5) <= settings.maxBandsCount ) {
						bandWidth *= 5
        	} else {
        		bandWidth *= 10
        	}
        	lowerBound -= lowerBound%bandWidth
        	if (upperBound%bandWidth > 0) {
	        	upperBound += bandWidth - upperBound%bandWidth
         	}
        	var data = []
        	var i
        	for (i=lowerBound; i<upperBound; i += bandWidth) {
        		var d = {}
        		d.min = i
        		d.max = i + bandWidth
        		d.average = (d.min+d.max)/2
        		d.count = values.filter(function(v){
        			return v >= d.min && (v<d.max || ( i == upperBound - bandWidth && v<=d.max ))
        		}).length
        		data.push(d)
        	}

        	// set the dimensions and margins of the graph
					var margin = {top: 12, right: 12, bottom: 24, left: 12},
					    width = container.offsetWidth - margin.left - margin.right,
					    height = container.offsetHeight - margin.top - margin.bottom;

        	var x = d3.scaleLinear()
        		.domain([lowerBound, upperBound])
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
				      .attr('width', x(bandWidth) - 2)
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

