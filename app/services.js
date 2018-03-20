'use strict';

/* Services */

angular.module('app.services', [])

	.factory('networkData', ['$http', 'networkProcessor', function($http, networkProcessor){
    var ns = {}     // namespace

    ns.loading = true

    // Demo sample
    $http.get('data/sample rio+20.gexf')
      .then(function(r){
        networkProcessor.process(ns, r.data)

        // Consolidate
        ns.nodeAttributes = []
        ns.nodeAttributes.push({
          id: 'Category',
          name: 'Category',
          type: 'partition',
          modalities: [
            {
              value: 'Social Ecology',
              count: 134,
              color: '#dcb1d5'
            },{
              value: 'Green-economy',
              count: 120,
              color: '#9adbc1'
            },{
              value: 'Deep Ecology',
              count: 85,
              color: '#dac899'
            },{
              value: 'New Ecologism',
              count: 20,
              color: '#84c9e9'
            },{
              value: 'Others',
              count: 7,
              color: '#AAAAAA'
            }
          ]
        })

        ns.loading = false
      }, function(){
        console.error('Error loading sample network')
      })

    return ns
  }])

  .factory('networkProcessor', [function(){
    var ns = {}     // namespace

    ns.process = function(obj, gexf){
      obj.g = Graph.library.gexf.parse(Graph, gexf)
      ns.addMissingVisualizationData(obj.g)
      window.g = obj.g
      console.log(obj)
    }

    ns.addMissingVisualizationData = function(g) {
      // Nodes
      var colorIssues = 0
      var coordinateIssues = 0
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        if (!isNumeric(n.x) || !isNumeric(n.y)) {
          var c = getRandomCoordinates()
          n.x = c[0]
          n.y = c[1]
          coordinateIssues++
        }
        if (!isNumeric(n.size)) {
          n.size = 1
        }
        if (n.color == undefined) {
          n.color = '#665'
          colorIssues++
        }
      })

      if (coordinateIssues > 0) {
        console.warn('Note: '+coordinateIssues+' nodes had coordinate issues. We set them to a random position.')
      }

      if (colorIssues > 0) {
        console.warn('Note: '+colorIssues+' nodes had no color. We colored them to a default value.')
      }

      colorIssues = 0
      g.edges().forEach(function(eid){
        var e = g.getEdgeAttributes(eid)
        if (e.color == undefined) {
          e.color = '#DDD'
          colorIssues++
        }
      })

      if (colorIssues > 0) {
        console.warn('Note: '+colorIssues+' edges had no color. We colored them to a default value.')
      }

      function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n)
      }
      
      function getRandomCoordinates() {
        var candidates
        var d2 = Infinity
        while (d2 > 1) {
          candidates = [2 * Math.random() - 1, 2 * Math.random() - 1]
          d2 = candidates[0] * candidates[0] + candidates[1] * candidates[1]
        }
        var heuristicRatio = 5 * Math.sqrt(g.order)
        return candidates.map(function(d){return d * heuristicRatio})
      }
    }

    return ns
  }])
