'use strict'

angular
  .module('app.print-network', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/print-network/', {
        templateUrl: 'views/print-network.html',
        controller: 'PrintNetworkController'
      })
    }
  ])

  .controller('PrintNetworkController', function(
    $scope,
    $location,
    $timeout,
    $routeParams,
    dataLoader,
    scalesUtils
  ) {
    $scope.bundleLocation = dataLoader.encodeLocation($routeParams.bundle)
    $scope.networkData = dataLoader.get($scope.bundleLocation)
    $scope.colorAttId = $location.search().color
    $scope.sizeAttId = $location.search().size
    $scope.camX = $location.search().x
    $scope.camY = $location.search().y
    $scope.camRatio = $location.search().r

    $scope.oversampling = 2
    $scope.nodeSize = 10
    $scope.labelSize = 10
    $scope.sizedLabels = false
    $scope.coloredLabels = true
    $scope.curvedEdges = false
    $scope.showEdges = true
    $scope.highQuality = false
    updateResolutionInfo()

    $scope.$watch('oversampling', updateResolutionInfo)

    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData.loaded) {
        if ($scope.colorAttId) {
          $scope.colorAtt =
            $scope.networkData.nodeAttributesIndex[$scope.colorAttId]

          if ($scope.colorAtt.type == 'partition') {
            $scope.colorModalities = $scope.colorAtt.modalities
          } else if ($scope.colorAtt.type == 'ranking-color') {
            // Rebuild modalities
            $scope.colorModalities = scalesUtils.buildModalities(
              $scope.colorAtt
            )
          }
        }

        if ($scope.sizeAttId) {
          $scope.sizeAtt =
            $scope.networkData.nodeAttributesIndex[$scope.sizeAttId]

          if ($scope.sizeAtt.type == 'ranking-size') {
            // Rebuild modalities
            $scope.sizeModalities = scalesUtils.buildModalities($scope.sizeAtt)
          }
        }
      }
    })

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
