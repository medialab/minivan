'use strict';

/* Services */

angular.module('app.directives', [])

.directive('toolbarViewmodeItem', function(
  ){
    return {
      restrict: 'E',
      scope: {
        viewmodeTarget: "=",
        viewmode: "=",
        url: "=",
        icon: "=",
        label: "="
      },
      templateUrl: 'components/toolbarViewmodeItem.html',
      link: function($scope, el, attrs) {
        $scope.go = function(){
          $scope.viewmode = $scope.viewmodeTarget
        }
      }
    }
  })

.directive('printButtonOverlay', function(
  ){
    return {
      restrict: 'E',
      scope: {
      },
      templateUrl: 'components/printButtonOverlay.html',
      link: function($scope, el, attrs) {
        $scope.print = function() {
          window.print()
        }
      }
    }
  })

.directive('leftSideBar', function(
    dataLoader
  ){
    return {
      restrict: 'E',
      scope: {
        title: '='
      },
      templateUrl: 'components/leftSideBar.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
      }
    }
  })

.directive('projectTitleBar', function(
    $location,
    dataLoader
  ){
    return {
      restrict: 'E',
      scope: {
        title: '='
      },
      templateUrl: 'components/projectTitleBar.html',
      link: function($scope, el, attrs){
        $scope.goHome = function() {
          $location.url('/?'+dataLoader.getLocation())
        }
      }
    }
  })

.directive('nodeListElement', function(
  ){
    return {
      restrict: 'A',
      scope: {
        node: '=',
        printMode: '=',
        att: '=',
        getRadius: '=',
        getColor: '='
      },
      templateUrl: 'components/nodeListElement.html',
      link: function($scope, el, attrs) {
      }
    }
  })

.directive('attributeListElement', function(
    dataLoader
  ){
    return {
      restrict: 'A',
      scope: {
      	att: '=',
      	printMode: '=',
      	detailLevel: '=',
      	selectedAttId: '='
      },
      templateUrl: 'components/attributeListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
      	$scope.isSelected = false
      	$scope.$watch('selectedAttId', function(){
      		$scope.isSelected = $scope.att && $scope.att.id && $scope.selectedAttId == $scope.att.id
      	})
      	$scope.selectAtt = function(){
      		if (!$scope.printMode) {
      			if ($scope.selectedAttId == $scope.att.id) {
      				$scope.isSelected = false
		      		$scope.selectedAttId = undefined
      			} else {
		      		$scope.isSelected = true
		      		$scope.selectedAttId = $scope.att.id
      			}
      		}
      	}
      }
    }
  })

.directive('modalityPartitionListElement', function(
    dataLoader
  ){
    return {
      restrict: 'A',
      scope: {
        attributeId: '=',
        mod: '=',
        maxModCount: '=',
        printMode: '=',
        detailLevel: '=',
        isSelected: '='
      },
      templateUrl: 'components/modalityPartitionListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
        $scope.toggleSelection = function(){
          $scope.isSelected = !$scope.isSelected
        }
        $scope.networkData = dataLoader.get()
        $scope.labelThreshold = 40
      }
    }
  })

.directive('modalityRankingListElement', function(
    dataLoader
  ){
    return {
      restrict: 'A',
      scope: {
        mod: '=',
        att: '=',
        maxModCount: '=',
        printMode: '=',
        detailLevel: '=',
        isSelected: '='
      },
      templateUrl: 'components/modalityRankingListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
        $scope.toggleSelection = function(){
          $scope.isSelected = !$scope.isSelected
        }
        $scope.networkData = dataLoader.get()
        $scope.labelThreshold = 40
      }
    }
  })

.directive('vColorKey', function($timeout, dataLoader, scalesUtils){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">.<br>.<br>.</small>',
    scope: {
      att: '='
    },
    link: function($scope, el, attrs) {
      $scope.$watch('att', redraw, true)
      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      var g = dataLoader.get().g

      var container = el[0]

      function redraw(){
        $timeout(function(){
          container.innerHTML = '';

          var settings = {}

          // Canvas size
          settings.oversampling = 2
          settings.width =  container.offsetWidth
          settings.height = container.offsetHeight

          var y
          var width = settings.oversampling * settings.width
          var height = settings.oversampling * settings.height

          // Create the canvas
          container.innerHTML = '<div style="width:'+settings.width+'; height:'+settings.height+';"><canvas id="cnvs" width="'+width+'" height="'+height+'" style="width: 100%;"></canvas></div>'
          var canvas = container.querySelector('#cnvs')
          var ctx = canvas.getContext("2d")

          // Color scale
          var getColor = scalesUtils.getColorScale(height, 0, $scope.att.colorScale)

          for (y=0; y<height; y++) {
            ctx.beginPath()
            ctx.lineCap="square"
            ctx.strokeStyle = getColor(y)
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.lineWidth = 1
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
            ctx.closePath()
          }
        })
      }
    }
  }
})
