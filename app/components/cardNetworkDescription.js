'use strict'

angular
  .module('app.components.cardNetworkDescription', [])

  .directive('cardNetworkDescription', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardNetworkDescription.html',
      scope: {
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        var g = $scope.networkData.g
        $scope.type = g.type
        $scope.multi = g.multi
        $scope.nodesCount = g.order
        $scope.edgesCount = g.size
      }
    }
  })
