'use strict';

/* Services */

angular.module('app.directives', [])

.directive('projectTitleBar', function(
  ){
    return {
      restrict: 'E',
      scope: {
      },
      templateUrl: 'components/projectTitleBar.html'
    }
  })

.directive('attributeListElement', function(
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
