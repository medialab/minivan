'use strict';

/* Services */

angular.module('app.services', [])

	.factory('networkData', ['$http', function($http){
    var ns = {}     // namespace

    $http.get('data/sample rio+20.gexf')
      .then(function(r){
        ns.g = r.data
      }, function(){
        console.error('Error loading sample network')
      })

    return ns
  }])
