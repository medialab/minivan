'use strict';

angular.module('app.print-node-list-modalities-ranking', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-node-list-modalities-ranking', {
    templateUrl: 'views/print-node-list-modalities-ranking.html'
  , controller: 'PrintNodeListModalitiesRankingController'
  })
}])

.controller('PrintNodeListModalitiesRankingController', function(
	$scope,
	$location,
	$timeout,
	networkData,
	scalesUtils
) {
	$scope.networkData = networkData

  $scope.attributeId = $location.search().att
  
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
      } else {
        // All unchecked: show all
        $scope.nodeFilter = function(){ return true }
      }

	    var g = $scope.networkData.g
	    $scope.nodes = g.nodes()
        .filter($scope.nodeFilter)
        .map(function(nid){
  	      return g.getNodeAttributes(nid)
  	    })

	    update()
	  }
	})

	function update() {
    /*var colorByModality = {}
    $scope.modalities.forEach(function(m){
      colorByModality[m.value] = m.color
    })
    var colorScale = function(val) {
      return colorByModality[val] || '#999'
    }
    $scope.getColor = function(n) {
      return colorScale(n[$scope.attributeId])
    }

    $scope.getRadius = function(n) {
      return 16
    }*/

    if ($scope.attribute.type == 'ranking-color') {  
      var colorScale = scalesUtils.getColorScale($scope.attribute.min, $scope.attribute.max, $scope.attribute.colorScale)
      var colorScale_string = function(val){ return colorScale(val).toString() }
      $scope.getColor = function(n){ return colorScale_string(n[$scope.attribute.id]) }
    } else {
      $scope.getColor = function(n) {
        return '#999'
      }
    }

    if ($scope.attribute.type == 'ranking-size') {
      var areaScale = scalesUtils.getAreaScale($scope.attribute.min, $scope.attribute.max, $scope.attribute.areaScaling.min, $scope.attribute.areaScaling.max, $scope.attribute.areaScaling.interpolation)
      var rScale = scalesUtils.getRScale()
      var rMax = rScale(1)
      $scope.getRadius = function(n) {
        return rScale(areaScale(n[$scope.attribute.id])) * 20 / rMax
      }
    } else {
      $scope.getRadius = function(n) {
        return 16
      }
    }
  }
})
