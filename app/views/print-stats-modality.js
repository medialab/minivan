'use strict'

angular
  .module('app.print-stats-modality', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-stats-modality', {
        templateUrl: 'views/print-stats-modality.html',
        controller: 'PrintStatsModalityController'
      })
    }
  ])

  .controller('PrintStatsModalityController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils,
    remarkableNodes
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)

    $scope.attributeId = $location.search().att
    $scope.modalityValue = $location.search().mod
    $scope.detailLevel = $location.search().detail || 1
    if ($scope.detailLevel != 1 && $scope.detailLevel != 2) {
      $scope.detailLevel = 1
    }

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]
        $scope.modality = Object.values($scope.attribute.modalities).filter(
          function(mod) {
            return mod.value == $scope.modalityValue
          }
        )[0]
        $scope.modalityFlow =
          $scope.attribute.modalities[$scope.modality.value].flow[
            $scope.modality.value
          ]
        if ($scope.attribute.type !== 'partition') {
          console.error(
            '[ERROR] The type of attribute "' +
              $scope.attribute.name +
              '" is not "partition".',
            $scope.attribute
          )
        }
        update()
      }
    })

    function update() {
      $scope.statsTopCut = $scope.detailLevel > 1 ? 10 : 3
      $scope.sortedNodes = remarkableNodes.getData(
        $scope.attribute,
        $scope.modality,
        $scope.statsTopCut
      )
    }
  })
