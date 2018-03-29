'use strict';

angular.module('app.attributes', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/attributes', {
    templateUrl: 'views/attributes.html'
  , controller: 'AttributesController'
  , reloadOnSearch: false
  })
}])

.controller('AttributesController', function(
	$scope,
	$location,
	$timeout,
	$route,
	$routeParams,
	networkData,
	csvBuilder
) {
	$scope.panel = $location.search().panel || 'map'
	$scope.search = $location.search().q
	$scope.networkData = networkData
	$scope.attributeListDetailLevel = 1
	$scope.selectedAttId = undefined
	$scope.sizeAttId = undefined
	$scope.colorAttId = undefined
	$scope.sizePlusColor = false
	$scope.$watch('panel', updateLocationPath)
	$scope.$watch('search', updateLocationPath)

	$scope.$watch('selectedAttId', function (newSelectedAttId, oldSelectedAttId) {
		if ($scope.selectedAttId) {
			var selectedAtt = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
			if (selectedAtt) {
				if (selectedAtt.type == 'partition' || selectedAtt.type == 'ranking-color') {
					$scope.colorAttId = selectedAtt.id
					if (!$scope.sizePlusColor) {
						$scope.sizeAttId = undefined
					}
				} else if (selectedAtt.type == 'ranking-size') {
					$scope.sizeAttId = selectedAtt.id
					if (!$scope.sizePlusColor) {
						$scope.colorAttId = undefined
					}
				}
			}
		} else {
			if (oldSelectedAttId) {
				// Remove previous selected att
				var oldSelectedAtt = $scope.networkData.nodeAttributesIndex[oldSelectedAttId]
				if (oldSelectedAtt.type == 'partition' || oldSelectedAtt.type == 'ranking-color') {
					$scope.colorAttId = undefined
				} else if (oldSelectedAtt.type == 'ranking-size') {
					$scope.sizeAttId = undefined
				}
			}
			if ($scope.colorAttId) {
				$scope.selectedAttId = $scope.colorAttId
			} else if ($scope.sizeAttId) {
				$scope.selectedAttId = $scope.sizeAttId
			}
		}
	})

	$scope.$watch('sizeAttId', function(newSizeAttId, oldSizeAttId){
		if (newSizeAttId === undefined && $scope.selectedAttId == oldSizeAttId) {
			$scope.selectedAttId = undefined
		}
	})

	$scope.$watch('colorAttId', function(newColorAttId, oldColorAttId){
		if (newColorAttId === undefined && $scope.selectedAttId == oldColorAttId) {
			$scope.selectedAttId = undefined
		}
	})

	$scope.networkNodeClick = function(nid) {
    console.log('Click on', nid)
  }

  $scope.downloadGEXF = function() {
  	var xml = Graph.library.gexf.write($scope.networkData.g);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }

  $scope.downloadAttributes = function() {
  	var csv = csvBuilder.getAttributes()
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Attributes.csv");
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes()
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateLocationPath(){
  	$route.updateParams({panel:$scope.panel});
  	$route.updateParams({q:$scope.search});
  }
})
