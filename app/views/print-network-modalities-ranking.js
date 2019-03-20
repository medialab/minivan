'use strict'

angular
  .module('app.print-network-modalities-ranking', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-network-modalities-ranking/', {
        templateUrl: 'views/print-network-modalities-ranking.html',
        controller: 'PrintNetworkModalitiesRankingController'
      })
    }
  ])

  .controller('PrintNetworkModalitiesRankingController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
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

        // Rebuild modalities
        $scope.modalities = scalesUtils.buildModalities(
          $scope.attribute,
          $location.search().deciles == 'true'
        )
        $scope.modalityFilter = function() {
          return true
        } // Legend shows all sizes anyway

        // Rebuild node filter
        $scope.ranges = JSON.parse($location.search().filter)
        if ($scope.ranges.length > 0) {
          $scope.nodeFilter = function(nid) {
            var nodeValue = $scope.networkData.g.getNodeAttribute(
              nid,
              $scope.attribute.id
            )
            return $scope.ranges.some(function(range) {
              return nodeValue >= range[0] && nodeValue <= range[1]
            })
          }
        } else {
          // All unchecked: show all
          $scope.nodeFilter = function() {
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
