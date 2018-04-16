'use strict';

angular.module('app.print-matrix', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/print-matrix', {
    templateUrl: 'views/print-matrix.html'
  , controller: 'PrintMatrixController'
  })
}])

.controller('PrintMatrixController', function(
	$scope,
	$location,
	$timeout,
	networkData,
	scalesUtils
) {
	$scope.networkData = networkData

  $scope.selectedAttId = $location.search().att
  $scope.matrixDetailLevel = +$location.search().detail
  $scope.viewBox = {
    x: +$location.search().x,
    y: +$location.search().y,
    w: +$location.search().w,
    h: +$location.search().h,
  }
  
	$scope.$watch('networkData.loaded', function(){
		if ($scope.networkData && $scope.networkData.g) {
	    update()
	  }
	})

	function update() {
    $scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]

    // Rebuild node filter
    // All unchecked / default: show all
    $scope.nodeFilter = function(){ return true }
    $scope.modalityFilter = function(){ return true }
    if ($scope.attribute.type == 'partition') {
      $scope.modalitiesSelection = {}
      var modSelection = $location.search().filter.split(',').map(function(d){ return d=='true' })
      $scope.attribute.modalities.forEach(function(mod, i){
        $scope.modalitiesSelection[mod.value] = modSelection[i]
      })
      if ($scope.attribute.modalities.some(function(mod){ return $scope.modalitiesSelection[mod.value]})) {
        $scope.nodeFilter = function(nid){
          return $scope.modalitiesSelection[$scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)]
        }
        $scope.modalityFilter = function(modValue) {
          return $scope.modalitiesSelection[modValue]
        }
      }
    }

    var g = $scope.networkData.g
    $scope.nodes = g.nodes()
      .filter($scope.nodeFilter)
    scalesUtils.sortNodes($scope.nodes, $scope.attributeId)
    $scope.nodes = $scope.nodes.map(function(nid){
        return g.getNodeAttributes(nid)
      })
  }
})
