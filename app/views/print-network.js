'use strict';

angular.module('app.print-network', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  // $routeProvider.when('/print-network/:colorAttId/:sizeAttId/:camX/:camY/:camRatio', {
  $routeProvider.when('/print-network/', {
    templateUrl: 'views/print-network.html'
  , controller: 'PrintNetworkController'
  })
}])

.controller('PrintNetworkController', function(
	$scope,
	$location,
	$timeout,
	networkData
) {
	$scope.networkData = networkData
	$scope.colorAttId = $location.search().color
	$scope.sizeAttId = $location.search().size
	$scope.camX = $location.search().x
	$scope.camY = $location.search().y
	$scope.camRatio = $location.search().r

	$scope.oversampling = 2
	$scope.nodeSize = 10
	$scope.labelSize = 10
	$scope.sizedLabels = false
	$scope.coloredLabels = true
	$scope.curvedEdges = false
	$scope.showEdges = true
	$scope.highQuality = false
	updateResolutionInfo()

	$scope.$watch('oversampling', updateResolutionInfo)
	
	$scope.downloadImage = function() {
		var canvas = document.querySelector('#cnvs')
		canvas.toBlob(function(blob) {
	    saveAs(blob, $scope.networkData.title + " network map.png");
	  })
	}

	function updateResolutionInfo() {
		$timeout(function(){
			if (document.querySelector('#cnvs')) {
				$scope.imageWidth = document.querySelector('#cnvs').width
				$scope.imageHeight = document.querySelector('#cnvs').height
			} else {
				updateResolutionInfo()
			}
		}, 500)
	}
})
