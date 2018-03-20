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