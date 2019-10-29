'use strict'

angular
  .module('app.components.cardAttributeModularity', [])

  .directive('cardAttributeModularity', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardAttributeModularity.html',
      scope: {
        attId: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        $scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.attId]
      }
    }
  })
