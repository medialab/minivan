'use strict'

angular
  .module('app.components.cardModalityRemarkableNodes', [])

  .directive('cardModalityRemarkableNodes', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardModalityRemarkableNodes.html',
      scope: {
        attId: '=',
        modValue: '=',
        topCut: '=',
        sortedNodes: '=',
        detailLevel: '=',
        printMode: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()
        var g = $scope.networkData.g
        $scope.attribute = $scope.networkData.nodeAttributesIndex[$scope.attId]
        $scope.modality = $scope.attribute.modalities[$scope.modValue]
        $scope.modalityFlow =
          $scope.attribute.modalities[$scope.modValue].flow[$scope.modValue]
      }
    }
  })
