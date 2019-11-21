'use strict'

angular
  .module('app.print-network-modalities-partition', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-network-modalities-partition/', {
        templateUrl: 'views/print-network-modalities-partition.html',
        controller: 'PrintNetworkModalitiesPartitionController'
      })
    }
  ])

  .controller('PrintNetworkModalitiesPartitionController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.attributeId = $location.search().att
    $scope.camX = $location.search().x
    $scope.camY = $location.search().y
    $scope.camRatio = $location.search().r
    $scope.useLayoutCache = $location.search().layoutcache == 'true'

    $scope.oversampling = 2
    $scope.nodeSize = 10
    $scope.labelSize = 10
    $scope.sizedLabels = false
    $scope.coloredLabels = true
    $scope.curvedEdges = false
    $scope.showEdges = true
    $scope.highQuality = false
    updateResolutionInfo()

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        $scope.attribute =
          $scope.networkData.nodeAttributesIndex[$scope.attributeId]

        // Rebuild node filter
        $scope.modalitiesSelection = {}
        var modSelection = $location
          .search()
          .filter.split(',')
          .map(function(d) {
            return d == 'true'
          })
        Object.values($scope.attribute.modalities).forEach(function(mod, i) {
          $scope.modalitiesSelection[mod.value] = modSelection[i]
        })
        if (
          Object.values($scope.attribute.modalities).some(function(mod) {
            return $scope.modalitiesSelection[mod.value]
          })
        ) {
          $scope.nodeFilter = function(nid) {
            return $scope.modalitiesSelection[
              $scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)
            ]
          }
          $scope.modalityFilter = function(modValue) {
            return $scope.modalitiesSelection[modValue]
          }
          var modalities = Object.values($scope.attribute.modalities).filter(
            function(mod) {
              return $scope.modalitiesSelection[mod.value]
            }
          )
          if (modalities.length == 1) {
            $scope.modality = modalities[0]
          }
        } else {
          // All unchecked: show all
          $scope.nodeFilter = function() {
            return true
          }
          $scope.modalityFilter = function() {
            return true
          }
        }
      }
    })

    $scope.$watch('oversampling', updateResolutionInfo)

    $scope.downloadImage = function() {
      var canvas = document.querySelector('#cnvs')
      canvas.toBlob(function(blob) {
        saveAs(blob, $scope.networkData.title + ' network map.png')
      })
    }

    function updateResolutionInfo() {
      $timeout(function() {
        if (document.querySelector('#cnvs')) {
          $scope.imageWidth = document.querySelector('#cnvs').width
          $scope.imageHeight = document.querySelector('#cnvs').height
        } else {
          updateResolutionInfo()
        }
      }, 500)
    }
  })
