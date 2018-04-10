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
              draw(d3.select(el[0]), $scope.attribute)
            })
          }
        }

        function draw(container, attribute) {
        	var values = g.nodes().map(function(nid){ return g.getNodeAttribute(nid, attribute.id) })
        	var valuesExtent = d3.extent(values)
        	var startFromZero = 0 <= valuesExtent[0]/valuesExtent[1] && valuesExtent[0]/valuesExtent[1] < 0.2
        	var lowerRoundBound
        	if (startFromZero) {
        		lowerRoundBound = 0
        	} else {
	        	lowerRoundBound = Math.pow(10, Math.floor(Math.log(valuesExtent[0])/Math.log(10)))
        	}
        	var upperRoundBound = Math.pow(10, Math.ceil(Math.log(valuesExtent[1])/Math.log(10)))
        	var maxBandsCount = 50
        	var bandWidth = (upperRoundBound - lowerRoundBound) / maxBandsCount
        	console.log(bandWidth)
        	// Lower the bandWidth to closest round number
        	bandWidth = Math.pow(10, Math.floor(Math.log(bandWidth)/Math.log(10)))
        	console.log(bandWidth)
        	// Rise it again to round multiple
        	if ( (upperRoundBound - lowerRoundBound) / (5 * bandWidth) < maxBandsCount ) {
        		bandWidth *= 5
        	} else if( (upperRoundBound - lowerRoundBound) / (2 * bandWidth) < maxBandsCount ) {
						bandWidth *= 2
        	}

/*        	var x = d3.scaleQuantize()
        		.domain(startFromZero ? [0, valuesExtent[1]] : valuesExtent)
        		.nice()
*/
        	// TODO
				}
      }
    }
  })

