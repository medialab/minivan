'use strict';

angular.module('app.print-network-modalities-ranking', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-network-modalities-ranking/', {
    templateUrl: 'views/print-network-modalities-ranking.html'
  , controller: 'PrintNetworkModalitiesRankingController'
  })
}])

.controller('PrintNetworkModalitiesRankingController', function(
	$scope,
	$location,
	$timeout,
	networkData,
	scalesUtils
) {
	$scope.networkData = networkData
	$scope.attributeId = $location.search().att
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

	$scope.$watch('networkData.loaded', function(){
		if ($scope.networkData.loaded) {
			$scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.attributeId]
			
			// Rebuild modalities
      $scope.modalities = scalesUtils.buildModalities($scope.attribute)

      // Rebuild node filter
      $scope.modalitiesSelection = {}
      var modSelection = $location.search().filter.split(',').map(function(d){ return d=='true' })
      $scope.modalities.forEach(function(mod, i){
        $scope.modalitiesSelection[mod.value] = modSelection[i]
      })
      if ($scope.modalities.some(function(mod){ return $scope.modalitiesSelection[mod.value]})) {
        $scope.nodeFilter = function(nid){
          var nodeValue = $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
          var matchingModalities
          if ($scope.attribute.integer) {
            matchingModalities = $scope.modalities.filter(function(mod){
              return (nodeValue >= mod.min && nodeValue <= mod.max)
            })
          } else {
            matchingModalities = $scope.modalities.filter(function(mod){
              return (nodeValue >= mod.min && nodeValue < mod.max)
                || (mod.pmax == 1 && nodeValue >= mod.min && nodeValue <= mod.max * 1.00000000001)
            })
          }
          if (matchingModalities.length == 0) {
            console.error('[Error] node ', nid, 'cannot be found in the scale of ', $scope.attribute.name, nodeValue)
            return
          }
          if (matchingModalities.length > 1) {
            console.warn('Node ', nid, 'matches several modality ranges of ', $scope.attribute.name, matchingModalities)
          }
          return $scope.modalitiesSelection[matchingModalities[0].value]
        }
        $scope.modalityFilter = function(modValue) {
        	return $scope.modalitiesSelection[modValue]
        }
      } else {
        // All unchecked: show all
        $scope.nodeFilter = function(){ return true }
        $scope.modalityFilter = function(){ return true }
      }
		}
	})

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
