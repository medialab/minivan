'use strict';

angular.module('app.components.cardAttributeModularityGroupLinks', [])

.directive('cardAttributeModularityGroupLinks', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    templateUrl: 'components/cardAttributeModularityGroupLinks.html',
    scope: {
    	attId: '='
    },
    link: function($scope, el, attrs) {
    	var g = networkData.g
    	$scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
		}
  }
})

.directive('modalityGroupToGroupEdgesCountChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawFlowMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }

        function drawFlowMatrix(container, attData) {
				  // Compute crossings
				  var crossings = []
				  var v1
				  var v2
				  for (v1 in attData.modalityFlow) {
				    for (v2 in attData.modalityFlow[v1]) {
				      crossings.push({
				        v1: v1,
				        v2: v2,
				        count: attData.modalityFlow[v1][v2].count
				      })
				    }
				  }

				  // Rank values by count
				  var sortedValues = attData.modalities.sort(function(v1, v2){
				    return attData.modalitiesIndex[v2].nodes - attData.modalitiesIndex[v1].nodes
				  })
				  var valueRanking = {}
				  sortedValues.forEach(function(v, i){
				    valueRanking[v] = i
				  })

				  // Draw SVG
				  var maxR = 32
				  var margin = {top: 120 + maxR, right: 24 + maxR, bottom: 24 + maxR, left: 180 + maxR}
				  var width = 2 * maxR * (attData.modalities.length - 1)
				  var height = width // square space

				  var x = d3.scaleLinear()
				    .range([0, width]);

				  var y = d3.scaleLinear()
				    .range([0, height]);

				  var size = d3.scaleLinear()
				    .range([0, 0.95 * maxR])
				  var a = function(r){
				    return Math.PI * Math.pow(r, 2)
				  }

				  var r = function(a){
				    return Math.sqrt(a/Math.PI)
				  }

				  x.domain([0, attData.modalities.length - 1])
				  y.domain([0, attData.modalities.length - 1])
				  size.domain(d3.extent(crossings, function(d){return r(d.count)}))

				  var svg = container.append("svg")
				      .attr("width", width + margin.left + margin.right)
				      .attr("height", height + margin.top + margin.bottom)
				    .append("g")
				      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				  // Horizontal lines
				  svg.selectAll('line.h')
				      .data(attData.modalities)
				    .enter().append('line')
				      .attr('class', 'h')
				      .attr('x1', 0)
				      .attr('y1', function(d){ return y(valueRanking[d]) })
				      .attr('x2', width)
				      .attr('y2', function(d){ return y(valueRanking[d]) })
				      .style("stroke", 'rgba(0, 0, 0, 0.06)')

				  // Vertical lines
				  svg.selectAll('line.v')
				      .data(attData.modalities)
				    .enter().append('line')
				      .attr('class', 'v')
				      .attr('x1', function(d){ return x(valueRanking[d]) })
				      .attr('y1', 0)
				      .attr('x2', function(d){ return x(valueRanking[d]) })
				      .attr('y2', height)
				      .style("stroke", 'rgba(0, 0, 0, 0.06)')

				  // Arrow
				  var arr = svg.append('g')
				    .attr('class', 'arrow')
				    .style("stroke", 'rgba(0, 0, 0, 0.4)')
				  arr.append('line')
				    .attr('x1', -24 - maxR)
				    .attr('y1', -24)
				    .attr('x2', -24 - maxR)
				    .attr('y2', -24 - maxR)
				  arr.append('line')
				    .attr('x1', -24 - maxR)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24)
				    .attr('y2', -24 - maxR)
				  arr.append('line')
				    .attr('x1', -24)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24 - 6)
				    .attr('y2', -24 - maxR - 6)
				  arr.append('line')
				    .attr('x1', -24)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24 - 6)
				    .attr('y2', -24 - maxR + 6)

				  // Horizontal labels
				  svg.selectAll('text.h')
				      .data(attData.modalities)
				    .enter().append('text')
				      .attr('class', 'h')
				      .attr('x', -6-maxR)
				      .attr('y', function(d){ return y(valueRanking[d]) + 3 })
				      .text( function (d) { return d })
				      .style('text-anchor', 'end')
				      .attr("font-family", "sans-serif")
				      .attr("font-size", "12px")
				      .attr("fill", 'rgba(0, 0, 0, 0.5)')

				  // Vertical labels
				  svg.selectAll('text.v')
				      .data(attData.modalities)
				    .enter().append('text')
				      .attr('class', 'v')
				      .attr('x', function(d){ return x(valueRanking[d]) + 3 })
				      .attr('y', -6-maxR)
				      .text( function (d) { return d })
				      .style('text-anchor', 'end')
				      .style('writing-mode', 'vertical-lr')
				      .attr("font-family", "sans-serif")
				      .attr("font-size", "12px")
				      .attr("fill", 'rgba(0, 0, 0, 0.5)')

				  // Dots
				  var dot = svg.selectAll(".dot")
				      .data(crossings)
				    .enter().append('g')
				    
				  dot.append("circle")
				    .attr("class", "dot")
				    .attr("r", function(d) { return size( r(d.count) ) })
				    .attr("cx", function(d) { return x(valueRanking[d.v2]) })
				    .attr("cy", function(d) { return y(valueRanking[d.v1]) })
				    .style("fill", 'rgba(120, 120, 120, 0.3)')

				  dot.append('text')
				    .attr('x', function(d){ return x(valueRanking[d.v2]) })
				    .attr('y', function(d){ return y(valueRanking[d.v1]) + 4 })
				    .text( function (d) { return d.count })
				    .style('text-anchor', 'middle')
				    .attr("font-family", "sans-serif")
				    .attr("font-size", "10px")
				    .attr("fill", 'rgba(0, 0, 0, 1.0)')
				}
      }
    }
  })

.directive('modalityGroupToGroupNormalizedDensityChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawNormalizedDensityMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }

        function drawNormalizedDensityMatrix(container, attData) {

				  // Compute crossings
				  var crossings = []
				  var v1
				  var v2
				  for (v1 in attData.modalityFlow) {
				    for (v2 in attData.modalityFlow[v1]) {
				      crossings.push({
				        v1: v1,
				        v2: v2,
				        nd: attData.modalityFlow[v1][v2].nd
				      })
				    }
				  }

				  // Rank modalities by count
				  var sortedValues = attData.modalities.sort(function(v1, v2){
				    return attData.modalitiesIndex[v2].nodes - attData.modalitiesIndex[v1].nodes
				  })
				  var valueRanking = {}
				  sortedValues.forEach(function(v, i){
				    valueRanking[v] = i
				  })

				  // Draw SVG
				  var maxR = 32
				  var margin = {top: 120 + maxR, right: 24 + maxR, bottom: 24 + maxR, left: 180 + maxR}
				  var width = 2 * maxR * (attData.modalities.length - 1)
				  var height = width // square space

				  var x = d3.scaleLinear()
				    .range([0, width]);

				  var y = d3.scaleLinear()
				    .range([0, height]);

				  var size = d3.scaleLinear()
				    .range([0, 0.95 * maxR])

				  var a = function(r){
				    return Math.PI * Math.pow(r, 2)
				  }

				  var r = function(a){
				    return Math.sqrt(a/Math.PI)
				  }

				  x.domain([0, attData.modalities.length - 1])
				  y.domain([0, attData.modalities.length - 1])
				  size.domain([0, d3.max(crossings, function(d){return r(Math.max(0, d.nd))})])

				  var svg = container.append("svg")
				      .attr("width", width + margin.left + margin.right)
				      .attr("height", height + margin.top + margin.bottom)
				    .append("g")
				      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				  // Horizontal lines
				  svg.selectAll('line.h')
				      .data(attData.modalities)
				    .enter().append('line')
				      .attr('class', 'h')
				      .attr('x1', 0)
				      .attr('y1', function(d){ return y(valueRanking[d]) })
				      .attr('x2', width)
				      .attr('y2', function(d){ return y(valueRanking[d]) })
				      .style("stroke", 'rgba(0, 0, 0, 0.06)')

				  // Vertical lines
				  svg.selectAll('line.v')
				      .data(attData.modalities)
				    .enter().append('line')
				      .attr('class', 'v')
				      .attr('x1', function(d){ return x(valueRanking[d]) })
				      .attr('y1', 0)
				      .attr('x2', function(d){ return x(valueRanking[d]) })
				      .attr('y2', height)
				      .style("stroke", 'rgba(0, 0, 0, 0.06)')

				  // Arrow
				  var arr = svg.append('g')
				    .attr('class', 'arrow')
				    .style("stroke", 'rgba(0, 0, 0, 0.4)')
				  arr.append('line')
				    .attr('x1', -24 - maxR)
				    .attr('y1', -24)
				    .attr('x2', -24 - maxR)
				    .attr('y2', -24 - maxR)
				  arr.append('line')
				    .attr('x1', -24 - maxR)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24)
				    .attr('y2', -24 - maxR)
				  arr.append('line')
				    .attr('x1', -24)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24 - 6)
				    .attr('y2', -24 - maxR - 6)
				  arr.append('line')
				    .attr('x1', -24)
				    .attr('y1', -24 - maxR)
				    .attr('x2', -24 - 6)
				    .attr('y2', -24 - maxR + 6)

				  // Horizontal labels
				  svg.selectAll('text.h')
				      .data(attData.modalities)
				    .enter().append('text')
				      .attr('class', 'h')
				      .attr('x', -6-maxR)
				      .attr('y', function(d){ return y(valueRanking[d]) + 3 })
				      .text( function (d) { return d })
				      .style('text-anchor', 'end')
				      .attr("font-family", "sans-serif")
				      .attr("font-size", "12px")
				      .attr("fill", 'rgba(0, 0, 0, 0.5)')

				  // Vertical labels
				  svg.selectAll('text.v')
				      .data(attData.modalities)
				    .enter().append('text')
				      .attr('class', 'v')
				      .attr('x', function(d){ return x(valueRanking[d]) + 3 })
				      .attr('y', -6-maxR)
				      .text( function (d) { return d })
				      .style('text-anchor', 'end')
				      .style('writing-mode', 'vertical-lr')
				      .attr("font-family", "sans-serif")
				      .attr("font-size", "12px")
				      .attr("fill", 'rgba(0, 0, 0, 0.5)')

				  // Dots
				  var dot = svg.selectAll(".dot")
				      .data(crossings)
				    .enter().append('g')
				    
				  dot.append("circle")
				    .attr("class", "dot")
				    .attr("r", function(d) { return size( r(Math.max(0, d.nd)) ) })
				    .attr("cx", function(d) { return x(valueRanking[d.v2]) })
				    .attr("cy", function(d) { return y(valueRanking[d.v1]) })
				    .style("fill", function(d){
				      if (d.v1 == d.v2) {
				        return 'rgba(70, 220, 70, 0.3)'
				      } else {
				        return 'rgba(220, 70, 70, 0.3)'       
				      }
				    })

				  dot.append('text')
				    .attr('x', function(d){ return x(valueRanking[d.v2]) })
				    .attr('y', function(d){ return y(valueRanking[d.v1]) + 4 })
				    .text( function (d) { return formatDensityNumber(d.nd) })
				    .style('text-anchor', 'middle')
				    .attr("font-family", "sans-serif")
				    .attr("font-size", "10px")
				    .attr("fill", 'rgba(0, 0, 0, 1.0)')

				  function formatDensityNumber(d) {
				    return d.toFixed(3)
				  }
				}
      }
    }
  })

