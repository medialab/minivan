'use strict'

angular
  .module('app.components.nodeSidenav', [])

  .directive('nodeSidenav', function(
    $timeout,
    $mdSidenav,
    dataLoader,
    scalesUtils
  ) {
    return {
      restrict: 'E',
      templateUrl: 'components/nodeSidenav.html',
      scope: {
        nodeData: '='
      },
      link: function($scope, el, attrs) {
        $scope.networkData = dataLoader.get()

        $scope.$watch('networkData.loaded', function() {
          // if ( $scope.networkData.loaded ) {
          // }
        })

        $scope.close = function() {
          $mdSidenav('node-sidenav').close()
        }
      }
    }
  })
