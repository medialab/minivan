'use strict';

/* Services */

angular.module('app.filters', [])
	
	.filter('defined', function () {
	  return function (item) {
	    return item !== undefined
	  }
	})

	.filter('simpleAttType', function () {
	  return function (attType) {
	  	if (attType == 'ranking-size' || attType == 'ranking-color')
	  		return 'ranking'
	  	else return attType
	  }
	})
	
	.filter('encodeURIComponent', function () {
	  return function (txt) {
	  	return encodeURIComponent(txt)
	  }
	})
