'use strict';

/* Services */

angular.module('app.services', [])

	.factory('networkData', ['$http', 'networkProcessor', function($http, networkProcessor){
    var ns = {}     // namespace

    $http.get('data/sample rio+20.gexf')
      .then(function(r){
        ns = networkProcessor.process(r.data)
      }, function(){
        console.error('Error loading sample network')
      })

    return ns
  }])

  .factory('networkProcessor', [function(){
    var ns = {}     // namespace

    ns.process = function(gexf){
      var result = {}
      result.g = Graph.library.gexf.parse(Graph, gexf)
      console.log(result)
      return result
    }

    return ns
  }])
