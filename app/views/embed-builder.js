'use strict'

const defaults = (dst, src) => {
  for (var property in src) {
    if (src.hasOwnProperty(property) && !dst.hasOwnProperty(property)) {
      dst[property] = src[property]
    }
  }
}

function guessNodeStyle ($scope, attribute) {
  if (attribute.type === 'ranking-size') {
    $scope.nodeSizeId = attribute.id
  } else if (attribute.type === 'ranking-color') {
    $scope.nodeColorId = attribute.id
  } else if (attribute.type === 'partition') {
    $scope.nodeColorId = attribute.id
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
  .directive('embededMap', function ($mdSidenav, scalesUtils, $location) {
    return {
      restrict: 'E',
      scope: {
        height: '=',
        width: '=',
        networkData: '=',
        blockGestures: '=',
        name: '=',
        attribute: '=',
        getRenderer: '=',
        nodeColorId: '=',
        nodeSizeId: '=',
        hardFilter: '=',
        showLink: '=',
      },
      templateUrl: 'views/embeded-map.html',
      link: function ($scope) {
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

        if ($scope.attribute && $scope.attribute.type === 'partition') {
          const ranges = JSON.parse(`[${$location.search().filter}]` || '[]')
          $scope.nodeFilter = ranges.some(bool => bool) && function (nid) {
            var nodeValue = $scope.networkData.g.getNodeAttribute(
              nid,
              $scope.attribute.id
            )
            const index = $scope.attribute.modalitiesOrder.indexOf(nodeValue)
            return ranges[index]
          }
        } else {
          const ranges = JSON.parse($location.search().filter || '[]')
          $scope.nodeFilter = ranges.length && function(nid) {
            var nodeValue = $scope.networkData.g.getNodeAttribute(
              nid,
              $scope.attribute.id
            )
            return ranges.some(function(range) {
              return nodeValue >= range[0] && nodeValue <= range[1]
            })
          }
        }
      }
    }
  })
  .directive('embedBuilderMap', function ($filter, $routeParams) {
    const defaultOptions = {
      lockNavigation: true,
      position: {
        x: 0.1,
        y: 0.1,
        ratio: 0.1,
      }
    }

    function positionUpdate (renderer) {
      return {
        x: $filter('cameraX')(renderer),
        y: $filter('cameraY')(renderer),
        ratio: $filter('cameraRatio')(renderer)
      }
    }

    return {
      restrict: 'E',
      scope: {
        options: '=',
        getRenderer: '=',
      },
      templateUrl: 'views/embed-builder-map.html',
      link: function ($scope) {
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
    dataLoader,
    $mdToast,
  ) {
    $scope.size = {
      width: 0,
      height: 0
    }
    $scope.inputs = {
      size: 'medium',
      name: '',
      showLink: true
    }
    $scope.networkData = dataLoader.get(
      dataLoader.encodeLocation($routeParams.bundle)
    )

    $scope.copy = function copy () {
      $mdToast.show(
        $mdToast
          .simple()
          .textContent('Copied to clipboard!')
          .position('top right')
      )
    }

    $scope.embedType = $routeParams.embed
    $scope.embedTypeOptions = {}

    $scope.nodeColorId = $routeParams.color
    $scope.nodeSizeId = $routeParams.size

    $scope.$watch('networkData.loaded', (loaded) => {
      if (loaded) {
        if ($routeParams.att) {
          $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.att]
          guessNodeStyle($scope, $scope.attribute)
        }
      }
    })

    $scope.printParams = function printParams () {
      const params = {
        ...$scope.embedTypeOptions.position,
        name: $scope.inputs.name,
        showLink: $scope.inputs.showLink,
        bundle: $routeParams.bundle,
        lockNavigation: $scope.embedTypeOptions.lockNavigation,
        size: $routeParams.size,
        color: $routeParams.color,
        att: $routeParams.att,
        filter: $routeParams.filter,
        hardFilter: $routeParams.hardFilter,
      }
      const string = Object.keys(params)
        .reduce((acc, key) => {
          if (params[key]) {
            acc.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
          }
          return acc
        }, [])
        .join('&')
      return `${window.location.origin}${window.location.pathname}#/embeded-network?${string}`
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
    $scope.$watchCollection('size', (newVal) => {
      $scope.getRenderer && $scope.getRenderer().listeners.handleResize()
    })
  })
  .controller('EmbededNetworkController', function ($scope, $routeParams, dataLoader) {

    $scope.width = $routeParams.width
    $scope.height = $routeParams.height
    $scope.networkData = dataLoader.get(
      dataLoader.encodeLocation($routeParams.bundle)
    )
    $scope.lockNavigation = $routeParams.lockNavigation === "true"
    $scope.showLink = $routeParams.showLink === "true"
    $scope.name = $routeParams.name
    $scope.nodeColorId = $routeParams.color
    $scope.nodeSizeId = $routeParams.size
    $scope.hardFilter = $routeParams.hardFilter
    $scope.name = $routeParams.name
    $scope.$watch('networkData.loaded', (loaded) => {
      if (loaded) {
        // $routeParams.att !== ''
        if ($routeParams.att) {
          $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.att]
          guessNodeStyle($scope, $scope.attribute)
        }
      }
    })

    $scope.$watch('getRenderer', function () {
      if ($scope.getRenderer) {
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
