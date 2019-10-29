'use strict'

angular
  .module('app.components.cardModalitySummary', [])

  .directive('cardModalitySummary', function(
    $timeout,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'A',
      templateUrl: 'components/cardModalitySummary.html',
      scope: {
        attId: '=',
        modValue: '=',
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
        // Density
        if (g.type == 'directed') {
          $scope.density = Graph.library.metrics.density.directedDensity(
            $scope.modality.count,
            $scope.modalityFlow.count
          )
        } else if (g.type == 'undirected') {
          $scope.density = Graph.library.metrics.density.undirectedDensity(
            $scope.modality.count,
            $scope.modalityFlow.count
          )
        } else if (g.type == 'mixed') {
          $scope.density = Graph.library.metrics.density.mixedDensity(
            $scope.modality.count,
            $scope.modalityFlow.count
          )
        }
      }
    }
  })
