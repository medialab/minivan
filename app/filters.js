'use strict';

/* Services */

angular.module('app.filters', [])
	
	.filter('defined', function () {
	  return function (item) {
	    return item !== undefined
	  }
	})