'use strict'

const defaults = (dst, src) => {
  for (var property in src) {
    if (src.hasOwnProperty(property) && !dst.hasOwnProperty(property)) {
      dst[property] = src[property]
    }
  }
}

angular
  .module('app.embed-builder', ['ngRoute'])
  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider
        .when('/embed-network/', {
          templateUrl: 'views/embed-builder.html',
          controller: 'EmbedBuilderController'
        })
      $routeProvider
        .when('/embeded-network/', {
          templateUrl: 'views/embeded-network.html',
          controller: 'EmbededNetworkController'
        })
    }
  ])
  .directive('embededMap', function ($mdSidenav, $mdBottomSheet) {
    return {
      restrict: 'E',
      scope: {
        height: '=',
        width: '=',
        networkData: '=',
        hideLegend: '=',
        blockGestures: '=',
        title: '=',
        attribute: '=',
        getRenderer: '=',
      },
      templateUrl: 'views/embeded-map.html',
      link: function ($scope, el, attrs) {
        $scope.blocked = $scope.blockGestures
        $scope.detailsOpen = false
        $scope.legendOpen = false
        $scope.$watch('blockGestures', function () {
          $scope.blocked = $scope.blockGestures
        });
        $scope.onNetworkNodeClick = function onNetworkNodeClick (nid) {
          $scope.selectedNode = $scope.networkData.g.getNodeAttributes(nid)
          $mdSidenav('node-sidenav').open()
        }
        $scope.toggleSidenav = function () {
          $mdSidenav('left').toggle()
        }
      }
    }
  })
  .directive('embedBuilderMap', function ($filter, $routeParams) {
    const defaultOptions = {
      lockNavigation: false,
      roundEdges: false,
      colorLabels: false,
      sizeLabel: false,
      hideLegend: false,
      x: 0.1,
      y: 0.1,
      ratio: 0.1,
    }

    function positionUpdate (renderer) {
      var position = {
        x: $filter('cameraX')(renderer),
        y: $filter('cameraY')(renderer),
        ratio: $filter('cameraRatio')(renderer)
      }
      return position
    }

    return {
      restrict: 'E',
      scope: {
        options: '=',
        getRenderer: '=',
      },
      templateUrl: 'views/embed-builder-map.html',
      link: function ($scope, el, attrs) {
        $scope.options.position = {
          x: +$routeParams.x,
          y: +$routeParams.y,
          ratio: +$routeParams.r,
        }
        $scope.tempPosition = $scope.options.position

        $scope.onButtonClick = function () {
          $scope.options.position = $scope.tempPosition
        }

        defaults($scope.options, defaultOptions)
        $scope.$watch('getRenderer', () => {
          if ($scope.getRenderer) {
            var renderer = $scope.getRenderer()
            var camera = renderer.getCamera()

            function onNetworkUpdate () {
              var position = positionUpdate(renderer)
              if (!angular.equals(position, $scope.tempPosition)) {
                $scope.tempPosition = position
                try {
                  $scope.$apply()
                } catch (error) {
                  console.error(error)
                }
              }
            }

            camera.animate($scope.options.position)
            camera.on('updated', onNetworkUpdate)
            return function () {
              camera.off('updated', onNetworkUpdate)
            }
          }
        })
      }
    }
  })
  .controller('EmbedBuilderController', function (
    $scope,
    $routeParams,
    dataLoader
  ) {
    $scope.size = {
      width: 0,
      height: 0
    }
    $scope.inputs = {
      size: 'medium',
      title: '',
      showLink: true
    }
    $scope.networkData = dataLoader.get(
      dataLoader.encodeLocation($routeParams.bundle)
    )

    $scope.embedType = $routeParams.embed
    $scope.embedTypeOptions = {}

    $scope.$watch('networkData.loaded', (loaded) => {
      if (loaded) {
        $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.att]
      }
    })

    $scope.printParams = function printParams () {
      const queryString = qs.stringify({
        ...$scope.size,
        ...$scope.inputs,
        ...$scope.embedTypeOptions.position,
        bundle: $routeParams.bundle,
        hideLegend: $scope.embedTypeOptions.hideLegend,
        lockNavigation: $scope.embedTypeOptions.lockNavigation,
      })
      return `/#/embeded-network?${queryString}`
    }
    

    $scope.$watch('inputs.size', function (newVal) {
      switch (newVal) {
        case 'small':
          $scope.size = {
            width: 200,
            height: 300,
          }
          break
        case 'medium':
          $scope.size = {
            width: 500,
            height: 300,
          }
          break
        case 'big':
          $scope.size = {
            width: 800,
            height: 300,
          }
          break
        case 'full':
          $scope.size = {
            width: '100%',
            height: 300,
          }
          break
        case 'custom':
          if ($scope.size.width === '100%') {
            $scope.size.width = 800
          }
          break
      }
    })
  })
  .controller('EmbededNetworkController', function ($scope, $routeParams, dataLoader) {
    $scope.width = $routeParams.width
    $scope.height = $routeParams.height
    $scope.networkData = dataLoader.get(
      dataLoader.encodeLocation($routeParams.bundle)
    )
    $scope.hideLegend = $routeParams.hideLegend === "true"
    $scope.lockNavigation = $routeParams.lockNavigation === "true"
    $scope.title = $routeParams.title

    $scope.$watchGroup(['networkData.loaded', 'getRenderer'], function () {
      if ($scope.networkData.loaded && $scope.getRenderer) {
        const renderer = $scope.getRenderer()
        const camera = renderer.getCamera()
        camera.animate({
          x: +$routeParams.x,
          y: +$routeParams.y,
          ratio: +$routeParams.ratio
        })
      }
    })
  })
