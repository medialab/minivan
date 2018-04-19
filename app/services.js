'use strict';

/* Services */

angular.module('app.services', [])

	.factory('networkData', ['$http', 'networkProcessor', '$timeout', function($http, networkProcessor, $timeout){
    var ns = {}     // namespace

    ns.loaded = false

    // Demo sample
    $http.get('data/sample rio+20.gexf')
      .then(function(r){
        networkProcessor.process(ns, r.data)

        // Add metadata
        ns.title = 'Rio + 20'
        ns.authors = ["Débora de Carvalho Pereira", "Mathieu Jacomy", "Tommaso Venturini"]
        ns.date = "2013"
        ns.url = "http://www.medialab.sciences-po.fr/wp-content/uploads/2015/06/VisualNetwork_Paper-10.pdf"
        ns.description = "Bacon ipsum dolor amet kevin jerky leberkas cow pastrami ribeye. Drumstick doner biltong tail ham landjaeger pork pancetta. Ribeye shoulder biltong burgdoggen jowl, picanha short ribs. Drumstick corned beef spare ribs, short loin pork loin turducken pork belly frankfurter cupim pork t-bone ribeye pig meatloaf.\n\nTail leberkas beef ribs ham hock drumstick. Alcatra t-bone buffalo, tri-tip ribeye boudin shankle salami. Turkey jowl salami prosciutto, brisket rump alcatra ham chicken beef venison short ribs buffalo porchetta. Swine pig meatball leberkas strip steak, fatback shank bresaola tongue ribeye. Cupim ribeye pancetta landjaeger. Tongue turkey kielbasa tri-tip swine, kevin shankle.\n\nTail short ribs sausage bresaola picanha meatball pork loin andouille ball tip spare ribs t-bone fatback. Shankle cow shank corned beef, bresaola pork chop sirloin chicken frankfurter ground round strip steak ribeye. Hamburger pastrami kielbasa pork loin. Tenderloin ribeye beef spare ribs jowl venison pancetta andouille picanha. Turkey ground round landjaeger corned beef shank.\n\nSwine andouille tri-tip cow rump shankle bresaola bacon tongue pastrami hamburger pork chop. Bresaola swine ball tip, t-bone cow beef corned beef pork pork loin capicola pastrami shoulder. Hamburger biltong pig chicken. Leberkas cupim tongue, jowl ham hock shankle fatback bresaola. Tenderloin meatball pork loin leberkas.\n\nSpare ribs doner ground round ball tip, kielbasa tongue flank corned beef brisket strip steak fatback buffalo drumstick meatloaf. Biltong porchetta kielbasa alcatra, sirloin fatback pork loin chicken cow. Jerky hamburger pork loin cow pancetta meatball. Alcatra meatball tenderloin bresaola beef, venison tongue short ribs meatloaf."
        ns.bundleVersion = "0.1"
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
        ns.nodeAttributes.push({
          id: 'Language',
          name: 'Language',
          type: 'partition',
          modalities: [
            {
              value: 'English',
              count: 153,
              color: '#e4a3d6'
            },{
              value: 'Portuguese',
              count: 120,
              color: '#6bdcc2'
            },{
              value: 'All',
              count: 63,
              color: '#e7b27c'
            },{
              value: 'Spanish',
              count: 18,
              color: '#78c3ec'
            },{
              value: 'French',
              count: 12,
              color: '#bad68d'
            }
          ]
        })
        ns.nodeAttributes.push({
          id: 'Nature of institution:',
          name: 'Nature of institution',
          type: 'partition',
          modalities: [
            {
              value: 'NGO',
              count: 171,
              color: '#e4a3d6'
            },{
              value: 'Trans-institutional',
              count: 42,
              color: '#6bdcc2'
            },{
              value: 'Individual',
              count: 32,
              color: '#e7b27c'
            },{
              value: 'Educational',
              count: 25,
              color: '#78c3ec'
            },{
              value: 'Social Movement',
              count: 23,
              color: '#bad68d'
            },{
              value: 'Event',
              count: 22,
              color: '#AAAAAA'
            },{
              value: 'Media',
              count: 20,
              color: '#AAAAAA'
            },{
              value: 'Governmental',
              count: 15,
              color: '#AAAAAA'
            },{
              value: 'Business',
              count: 9,
              color: '#AAAAAA'
            },{
              value: 'Religious',
              count: 6,
              color: '#AAAAAA'
            },{
              value: 'Politic',
              count: 1,
              color: '#AAAAAA'
            }
          ]
        })
        ns.nodeAttributes.push({
          id: 'indegree',
          name: 'Ranking A',
          type: 'ranking-size',
          min: 0,
          max: 51,
          areaScaling: {
            min: 6,
            max: 36,
            interpolation: 'linear'
          }
        })
        ns.nodeAttributes.push({
          id: 'degree',
          name: 'Ranking B',
          type: 'ranking-color',
          min: 0,
          max: 60,
          colorScale: 'interpolateCubehelixDefault'
        })
        ns.nodeAttributes.push({
          id: 'outdegree',
          name: 'Ranking C',
          type: 'ranking-size',
          integer: true,
          min: 0,
          max: 47,
          areaScaling: {
            min: 2,
            max: 100,
            interpolation: 'pow-2'
          }
        })

        // Consolidate
        networkProcessor.consolidate(ns)

        // Simulate long loading time
        $timeout(function(){
          ns.loaded = true
        }, 500)
      }, function(){
        console.error('Error loading sample network')
      })

    return ns
  }])

  .factory('networkProcessor', function(){
    var ns = {}     // namespace

    ns.consolidate = function(data) {
      // Node attributes index
      data.nodeAttributesIndex = {}
      data.nodeAttributes.forEach(function(att){
        data.nodeAttributesIndex[att.id] = att
      })

      // Build each node attribute's data
      data.nodeAttributes.forEach(function(att){
        att.data = ns.buildNodeAttData(data.g, att.id)
      })
    }

    ns.process = function(obj, gexf){
      obj.g = Graph.library.gexf.parse(Graph, gexf)
      ns.addMissingVisualizationData(obj.g)
      window.g = obj.g
      // console.log(obj)
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
        if (!isNumeric(n.size) || n.size == 0) {
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
          e.color = '#CCC9C9'
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

    // Aggregated attribute data
    ns.buildNodeAttData = function(g, attributeId) {
      var attData = {}

      // Aggregate distribution of modalities
      attData.modalitiesIndex = {}
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        if (attData.modalitiesIndex[n[attributeId]]) {
          attData.modalitiesIndex[n[attributeId]].nodes++
        } else {
          attData.modalitiesIndex[n[attributeId]] = {nodes: 1}
        }
      })
      attData.modalities = d3.keys(attData.modalitiesIndex)
      var modalitiesCounts = d3.values(attData.modalitiesIndex).map(function(d){return d.nodes})
      /*attData.distributionStats = {}
      attData.distributionStats.differentModalities = modalitiesCounts.length
      attData.distributionStats.sizeOfSmallestModality = d3.min(modalitiesCounts)
      attData.distributionStats.sizeOfBiggestModality = d3.max(modalitiesCounts)
      attData.distributionStats.medianSize = d3.median(modalitiesCounts)
      attData.distributionStats.deviation = d3.deviation(modalitiesCounts)
      attData.distributionStats.modalitiesUnitary = modalitiesCounts.filter(function(d){return d==1}).length
      attData.distributionStats.modalitiesAbove1Percent = modalitiesCounts.filter(function(d){return d>=g.order*0.01}).length
      attData.distributionStats.modalitiesAbove10Percent = modalitiesCounts.filter(function(d){return d>=g.order*0.1}).length*/

      // Count edge flow
      attData.modalityFlow = {}
      attData.modalities.forEach(function(v1){
        attData.modalityFlow[v1] = {}
        attData.modalities.forEach(function(v2){
          attData.modalityFlow[v1][v2] = {count: 0, expected: 0, nd:0}
        })
      })
      g.edges().forEach(function(eid){ // Edges count
        var nsid = g.source(eid)
        var ntid = g.target(eid)
        attData.modalityFlow[g.getNodeAttribute(nsid, attributeId)][g.getNodeAttribute(ntid, attributeId)].count++
      })
      // For normalized density, we use the same version as the one used in Newmans' Modularity
      // Newman, M. E. J. (2006). Modularity and community structure in networks. Proceedings of the National Academy of …, 103(23), 8577–8582. http://doi.org/10.1073/pnas.0601602103
      // Here, for a directed network
      g.nodes().forEach(function(nsid){
        g.nodes().forEach(function(ntid){
          var expected = g.outDegree(nsid) * g.inDegree(ntid) / (2 * g.size)
          attData.modalityFlow[g.getNodeAttribute(nsid, attributeId)][g.getNodeAttribute(ntid, attributeId)].expected += expected
        })
      })
      attData.modalities.forEach(function(v1){
        attData.modalities.forEach(function(v2){
          attData.modalityFlow[v1][v2].nd = ( attData.modalityFlow[v1][v2].count - attData.modalityFlow[v1][v2].expected ) / (4 * g.size) 
        })
      })

      // Modality stats related to connectivity
      attData.modalities.forEach(function(v){
        attData.modalitiesIndex[v].internalLinks = attData.modalityFlow[v][v].count
        attData.modalitiesIndex[v].internalNDensity = attData.modalityFlow[v][v].nd

        attData.modalitiesIndex[v].inboundLinks = d3.sum(attData.modalities
            .filter(function(v2){ return v2 != v})
            .map(function(v2){ return attData.modalityFlow[v2][v].count })
          )

        attData.modalitiesIndex[v].inboundNDensity = d3.sum(attData.modalities
            .filter(function(v2){ return v2 != v})
            .map(function(v2){ return attData.modalityFlow[v2][v].nd })
          )

        attData.modalitiesIndex[v].outboundLinks = d3.sum(attData.modalities
            .filter(function(v2){ return v2 != v})
            .map(function(v2){ return attData.modalityFlow[v][v2].count })
          )

        attData.modalitiesIndex[v].outboundNDensity = d3.sum(attData.modalities
            .filter(function(v2){ return v2 != v})
            .map(function(v2){ return attData.modalityFlow[v][v2].nd })
          )

        attData.modalitiesIndex[v].externalLinks = attData.modalitiesIndex[v].inboundLinks + attData.modalitiesIndex[v].outboundLinks
        attData.modalitiesIndex[v].externalNDensity = attData.modalitiesIndex[v].inboundNDensity + attData.modalitiesIndex[v].outboundNDensity

      })

      // Global statistics
      attData.stats = {}

      // Modularity (based on previous computations)
      attData.stats.modularity = 0
      attData.modalities.forEach(function(v1){
        attData.modalities.forEach(function(v2){
          if (v1==v2) {
            attData.stats.modularity += attData.modalityFlow[v1][v2].nd
          } else {
            attData.stats.modularity -= attData.modalityFlow[v1][v2].nd
          }
        })
      })

      return attData
    }

    return ns
  })

  .factory('scalesUtils', function(networkData, $filter){
    var ns = {} // Namespace

    // Circle area -> radius
    ns.getRScale = function() {
      // A = PI * r^2 <=> r = SQRT( A/PI )
      var rScale = function(A){
        return Math.sqrt(A / Math.PI)
      }
      // Circle radius -> area
      rScale.invert = function(r) {
        return Math.PI * r * r
      }
      return rScale
    }

    // ranking value -> area as [0,1]
    ns.getAreaScale = function(minValue, maxValue, minScaling, maxScaling, interpolation) {
      var dScale
      if (interpolation == 'linear') {
        dScale = d3.scaleLinear()
          .range([minScaling/maxScaling, 1])
          .domain([minValue, maxValue])
      } else if (interpolation.split('-')[0] == 'pow') {
        dScale = d3.scalePow()
          .exponent(+interpolation.split('-')[1] || 1)
          .range([minScaling/maxScaling, 1])
          .domain([minValue, maxValue])
      } else {
        console.error('[error] Unknown interpolation')
      }
      return dScale
    }

    ns.getSizeAsColorScale = function(minValue, maxValue, minScaling, maxScaling, interpolation) {
      var dScale
      if (interpolation == 'linear') {
        dScale = d3.scaleLinear()
          .range([minScaling/maxScaling, 1])
          .domain([minValue, maxValue])
      } else if (interpolation.split('-')[0] == 'pow') {
        dScale = d3.scalePow()
          .exponent(+interpolation.split('-')[1] || 1)
          .range([minScaling/maxScaling, 1])
          .domain([minValue, maxValue])
      } else {
        console.error('[error] Unknown interpolation')
      }
      var colorScale = function(d) {
        var black = d3.color('#000')
        black.opacity = dScale(d)
        return black
      }
      return colorScale
    }

    // ranking value -> color
    ns.getColorScale = function(minValue, maxValue, colorScaleInterpolator) {
      var dScale = d3.scaleLinear()
        .range([1, 0])
        .domain([minValue, maxValue])
      
      var d3Interpolator = d3[colorScaleInterpolator]
      if (d3Interpolator === undefined) {
        console.error('[error] Unknown d3 color interpolator:', colorScaleInterpolator)
      }
      var colorScale = function(d) {
        return d3.color(d3Interpolator(dScale(d)))
      }
      return colorScale
    }

    ns.getXYScales = function(width, height, offset) {
      var g = networkData.g
      var xScale = d3.scaleLinear()
        .range([offset, width - offset])
      var yScale = d3.scaleLinear()
        .range([height - offset, offset])

      var xExtent = d3.extent(g.nodes(), function(nid){ return g.getNodeAttribute(nid, 'x') })
      var yExtent = d3.extent(g.nodes(), function(nid){ return g.getNodeAttribute(nid, 'y') })
      var sizeRatio = Math.max((xExtent[1] - xExtent[0])/(width-2*offset), (yExtent[1] - yExtent[0])/(height-2*offset))
      var xMean = (xExtent[0] + xExtent[1])/2
      var yMean = (yExtent[0] + yExtent[1])/2
      xScale.domain([ xMean - sizeRatio * width / 2, xMean + sizeRatio * width / 2 ])
      yScale.domain([ yMean - sizeRatio * height / 2, yMean + sizeRatio * height / 2 ])

      return [xScale, yScale]
    }

    ns.getXYScales_camera = function(width, height, offset, x, y, ratio) {
      var g = networkData.g
      var xScale = d3.scaleLinear()
        .range([offset - (x-0.5) * width / ratio, width - offset - (x-0.5) * width / ratio])
      var yScale = d3.scaleLinear()
        .range([height - offset + (y-0.5) * height / ratio, offset + (y-0.5) * height / ratio])

      var xExtent = d3.extent(g.nodes(), function(nid){ return g.getNodeAttribute(nid, 'x') })
      var yExtent = d3.extent(g.nodes(), function(nid){ return g.getNodeAttribute(nid, 'y') })
      var sizeRatio = ratio * Math.max((xExtent[1] - xExtent[0])/(width-2*offset), (yExtent[1] - yExtent[0])/(height-2*offset))
      var xMean = (xExtent[0] + xExtent[1])/2
      var yMean = (yExtent[0] + yExtent[1])/2
      xScale.domain([ xMean - sizeRatio * width / 2, xMean + sizeRatio * width / 2])
      yScale.domain([ yMean - sizeRatio * height / 2, yMean + sizeRatio * height / 2])

      return [xScale, yScale]
    }

    // Build virtual modalities for ranking attributes
    ns.buildModalities = function(attribute, useDeciles) {
      if (attribute.type == 'ranking-size') {
        return ns.buildModalities_size(attribute, useDeciles)
      } else if (attribute.type == 'ranking-color') {
        return ns.buildModalities_color(attribute, useDeciles)
      }
    }

    ns.buildModalities_size = function(attribute, useDeciles) {
      // Size scales
      var areaScale = ns.getAreaScale(attribute.min, attribute.max, attribute.areaScaling.min, attribute.areaScaling.max, attribute.areaScaling.interpolation)
      var rScale = ns.getRScale()

      var minRadius = rScale(attribute.areaScaling.min/attribute.areaScaling.max)
      var maxRadius = rScale(1)

      var data
      if (useDeciles) {
        var values = g.nodes()
          .map(function(nid){ return +g.getNodeAttribute(nid, attribute.id) })
        values.sort(function(a, b){ return a-b })
        var maxValue = d3.max(values)
        var deciles = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
          .map(function(d){ return d3.quantile(values, d) })

        // Remove duplicates
        var existing = {}
        var deciles = deciles.filter(function(d){
          if (existing[d]) return false
          existing[d] = true
          return true
        })

        data = deciles.map(function(d, i){
          // Value
          var min = d
          var max = deciles[i+1] || maxValue
          // Nodes
          var nodes = g.nodes()
            .filter(function(nid){
              var val = g.getNodeAttribute(nid, attribute.id)
              if (i == deciles.length - 1) {
                return val >= min && val <= max * 1.00000000001
              } else {
                return val >= min && val < max
              }
              return false
            })

          return {
            min: min,
            max: max,
            average: (min + max) / 2,
            nodes: nodes
          }
        })
        .reverse()
      } else {
        data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map(function(d){
            // Percent
            var pmin = d/10
            var pmax = (d+1)/10
            // Radius value
            var rmin = minRadius + pmin * (maxRadius - minRadius)
            var rmax = minRadius + pmax * (maxRadius - minRadius)
            // Value
            var min = areaScale.invert(rScale.invert(rmin))
            var max = areaScale.invert(rScale.invert(rmax))
            return {
              pmin: pmin,
              pmax: pmax,
              min: min,
              max: max,
              average: (min + max) / 2,
              nodes: g.nodes().filter(function(nid){
                var val = g.getNodeAttribute(nid, attribute.id)
                if (pmax == 1) {
                  return val >= min && val <= max * 1.00000000001
                } else {
                  return val >= min && val < max
                }
              })
            }
          })
          .reverse()
      }

      data.forEach(function(d, i){
        d.radius = rScale(areaScale((d.min + d.max) / 2)),
        d.color = '#999'
        d.highest = i == 0
      })

      // Radius ratio: relative to the max radius
      var radiusExtent = d3.extent(data, function(d){ return d.radius })
      data.forEach(function(d){
        d.radiusRatio = d.radius/radiusExtent[1]
      })

      data.forEach(function(d){
        d.count = d.nodes.length
      })

      if (attribute.integer) {
        // Use the numbers from the actual nodes
        data = data.filter(function(d){ return d.count > 0 })
        data.forEach(function(d){
            var e = d3.extent(d.nodes, function(nid){ return g.getNodeAttribute(nid, attribute.id) })
            d.min = e[0]
            d.max = e[1]
          })
        data.forEach(function(d){
          if (d.min == d.max) {
            d.label = $filter('number')(d.min)
          } else {
            d.label = $filter('number')(d.min) + ' to ' + $filter('number')(d.max)
          }
        })
      } else {
        data.forEach(function(d, i){
          if (i < data.length - 1) {
            d.label = $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          } else {
            d.label = $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          }
        })
      }

      data.forEach(function(d){
        d.value = d.average
      })

      data.forEach(function(d){
        delete d.nodes
      })

      return data
    }

    ns.buildModalities_color = function(attribute, useDeciles) {
      // Color scales
      var colorScale = ns.getColorScale(attribute.min, attribute.max, attribute.colorScale)

      var data
      if (useDeciles) {
        var values = g.nodes()
          .map(function(nid){ return +g.getNodeAttribute(nid, attribute.id) })
        values.sort(function(a, b){ return a-b })
        var maxValue = d3.max(values)
        var deciles = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
          .map(function(d){ return d3.quantile(values, d) })
        // Remove duplicates
        var existing = {}
        var deciles = deciles.filter(function(d){
          if (existing[d]) return false
          existing[d] = true
          return true
        })

        data = deciles.map(function(d, i){
          // Value
          var min = d
          var max = deciles[i+1] || maxValue
          // Nodes
          var nodes = g.nodes()
            .filter(function(nid){
              var val = g.getNodeAttribute(nid, attribute.id)
              if (i == deciles.length - 1) {
                return val >= min && val <= max * 1.00000000001
              } else {
                return val >= min && val < max
              }
              return false
            })

          return {
            min: min,
            max: max,
            average: (min + max) / 2,
            nodes: nodes
          }
        })
        .reverse()

      } else {
        data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map(function(d){
            // Percent
            var pmin = d/10
            var pmax = (d+1)/10
            // Value
            var min = attribute.min + pmin * (attribute.max - attribute.min)
            var max = attribute.min + pmax * (attribute.max - attribute.min)
            return {
              pmin: pmin,
              pmax: pmax,
              min: min,
              max: max,
              average: (min + max) / 2,
              nodes: g.nodes().filter(function(nid){
                var val = g.getNodeAttribute(nid, attribute.id)
                if (pmax == 1) {
                  return val >= min && val <= max * 1.00000000001
                } else {
                  return val >= min && val < max
                }
              })
            }
          })
          .reverse()
      }

      data.forEach(function(d, i){
        d.radius = 20
        d.radiusRatio = 1
        d.color = colorScale(d.average)
        d.highest = i==0
      })

      data.forEach(function(d){
        d.count = d.nodes.length
      })

      if (attribute.integer) {
        // Use the numbers from the actual nodes
        data = data.filter(function(d){ return d.count > 0 })
        data.forEach(function(d){
            var e = d3.extent(d.nodes, function(nid){ return g.getNodeAttribute(nid, attribute.id) })
            d.min = e[0]
            d.max = e[1]
          })
        data.forEach(function(d){
          if (d.min == d.max) {
            d.label = $filter('number')(d.min)
          } else {
            d.label = $filter('number')(d.min) + ' to ' + $filter('number')(d.max)
          }
        })
      } else {
        data.forEach(function(d, i){
          if (i < data.length - 1) {
            d.label = $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          } else {
            d.label = $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          }
        })
      }

      data.forEach(function(d){
        d.value = d.average
      })

      data.forEach(function(d){
        delete d.nodes
      })

      return data
    }

    // Build data for distribution of ranking
    ns.buildRankingDistribution = function(attribute, bandsCount, niceScale) {
      var values = g.nodes().map(function(nid){ return g.getNodeAttribute(nid, attribute.id) })
      var valuesExtent = d3.extent(values)
      var lowerBound = valuesExtent[0]
      var upperBound = valuesExtent[1]
      var bandWidth = (upperBound - lowerBound) / bandsCount
      
      if (niceScale) {
        // Lower the bandWidth to closest round number
        bandWidth = Math.pow(10, Math.floor(Math.log(bandWidth)/Math.log(10)))
        // Rise it up to round multiple
        if ( (upperBound - lowerBound) / (bandWidth*2) <= bandsCount ) {
          bandWidth *= 2
        } else if( (upperBound - lowerBound) / (bandWidth*5) <= bandsCount ) {
          bandWidth *= 5
        } else {
          bandWidth *= 10
        }
        lowerBound -= lowerBound%bandWidth
        if (upperBound%bandWidth > 0) {
          upperBound += bandWidth - upperBound%bandWidth
        }
      }

      var data = []
      var i
      for (i=lowerBound; i<upperBound; i += bandWidth) {
        var d = {}
        d.min = i
        d.max = i + bandWidth
        d.average = (d.min+d.max)/2
        d.count = values.filter(function(v){
          return v >= d.min && (v<d.max || ( i == upperBound - bandWidth && v<=d.max ))
        }).length
        data.push(d)
      }
      return data
    }

    // Get natural modalities for a ranking, comparable to buildRankingDistribution
    ns.getIntegerRankingModalities = function(attribute) {
      var modalitiesIndex = {}
      var min = Infinity
      var max = -Infinity
      g.nodes().forEach(function(nid){
        var modValue = g.getNodeAttribute(nid, attribute.id)
        min = Math.min(min, modValue)
        max = Math.max(max, modValue)
        var modObj = modalitiesIndex[modValue] || {value: modValue, count: 0}
        modObj.count++
        modalitiesIndex[modValue] = modObj
      })
      // We assume that the attribute is an integer.
      // We will fill the blanks in the modalities index.
      // This will purposefully produce data points with count==0.
      var i
      for (i=Math.floor(min); i<=max; i++) {
        if (modalitiesIndex[i] === undefined) {
          modalitiesIndex[i] = {value:i, count:0}
        }
      }
      var data = Object.values(modalitiesIndex)
      data.sort(function(a, b){
        return a.value - b.value
      })
      return data
    }

    // Sort the nodes, by default or by an attribute
    ns.sortNodes = function(nodes, attributeId) {
      if (attributeId) {
        if (networkData.loaded) {
          var att = networkData.nodeAttributesIndex[attributeId]
          if (att.type == 'partition') {
            var modalitiesIndex = {}
            att.modalities.forEach(function(mod, i){
              modalitiesIndex[mod.value] = i
            })
            nodes.sort(function(a, b){
              var aModIndex = modalitiesIndex[g.getNodeAttribute(a, attributeId)]
              var bModIndex = modalitiesIndex[g.getNodeAttribute(b, attributeId)]
              var diff = aModIndex - bModIndex
              if (diff == 0) {
                var alabel = g.getNodeAttribute(a, 'label')
                var blabel = g.getNodeAttribute(b, 'label')
                if (alabel > blabel) return 1
                else if (alabel < blabel) return -1
                return 0
              } else return diff
            })
          } else if (att.type == 'ranking-size' || att.type == 'ranking-color') {
            nodes.sort(function(a, b){
              var aValue = +g.getNodeAttribute(a, attributeId)
              var bValue = +g.getNodeAttribute(b, attributeId)
              return bValue - aValue
            })
          }
        } else {
          console.log('[ERROR] Network data must be loaded before using sortNodes().')
        }
      } else {
        nodes.sort(function(a, b){
          var alabel = g.getNodeAttribute(a, 'label')
          var blabel = g.getNodeAttribute(b, 'label')
          if (alabel > blabel) return 1
          else if (alabel < blabel) return -1
          return 0
        })
      }
    }

    return ns
  })

  .factory('csvBuilder', function(networkData, scalesUtils){
    var ns = {} // Namespace

    ns.getAttributes = function() {
      var csv = d3.csvFormat(
        networkData.nodeAttributes
          .map(function(att){
            var validElements = {}
            validElements.id = att.id
            validElements.name = att.name
            validElements.type = att.type
            validElements.integer = att.integer
            validElements.min = att.min
            validElements.max = att.max
            if (att.areaScaling) {
              validElements.areaScaling_min = att.areaScaling.min
              validElements.areaScaling_max = att.areaScaling.max
              validElements.areaScaling_interpolation = att.areaScaling.interpolation
            }
            validElements.colorScale = att.colorScale
            validElements.modalities = JSON.stringify(att.modalities || [])
            return validElements
          })
      )
      return csv
    }

    ns.getModalities = function(attributeId) {
      var attribute = networkData.nodeAttributesIndex[attributeId]
      var csv = d3.csvFormat(
        attribute.modalities
          .map(function(att){
            var validElements = {}
            validElements.value = att.value
            validElements.color = att.color
            validElements['nodes count'] = att.count
            return validElements
          })
      )
      return csv
    }

    ns.getRankingModalities = function(modalities) {
      var csv = d3.csvFormat(
        modalities
          .map(function(att){
            var validElements = {}
            validElements['Minimum'] = att.min
            validElements['Maximum'] = att.max
            validElements['Average'] = att.average
            validElements['Nodes count'] = att.count
            validElements['Label'] = att.label
            validElements.radius = att.radiusRatio
            validElements.color = att.color.toString()
            return validElements
          })
      )
      return csv
    }

    ns.getModalityLinks = function(attributeId, modSelection) {
      return ns._getModalityCrossings(attributeId, modSelection, 'count')
    }

    ns.getModalityNormalizedDensities = function(attributeId, modSelection) {
      return ns._getModalityCrossings(attributeId, modSelection, 'nd')
    }

    ns._getModalityCrossings = function(attributeId, modSelection, modalityAtt) {
      var attribute = networkData.nodeAttributesIndex[attributeId]
      var rows = []

      // Fix modSelection
      if (modSelection === undefined || !d3.values(modSelection).some(function(d){return d})) {
        modSelection = {}
        var mod
        for (mod in attribute.data.modalityFlow) {
          modSelection[mod] = true
        }
      }

      // Select modalities
      var modalities = attribute.data.modalities
        .filter(function(mod){
          return modSelection[mod]
        })

      // Rank modalities by count
      var sortedModalities = modalities.sort(function(v1, v2){
        return attribute.data.modalitiesIndex[v2].nodes - attribute.data.modalitiesIndex[v1].nodes
      })

      var headRow = ['']
      sortedModalities.forEach(function(mod){
        headRow.push(mod)
      })
      rows.push(headRow)

      var row
      sortedModalities.forEach(function(mod){
        row = [mod]
        sortedModalities.forEach(function(mod2){
          row.push(+attribute.data.modalityFlow[mod][mod2][modalityAtt])
        })
        rows.push(row)
      })
      
      var csv = d3.csvFormatRows(rows)
      return csv
    }

    ns.getNodes = function(nodesFilter) {
      var nodes = networkData.g.nodes()
      if (nodesFilter) {
        nodes = nodes.filter(nodesFilter)
      }
      var csv = d3.csvFormat(
        nodes
          .map(function(nid){
            var n = g.getNodeAttributes(nid)
            var validElements = {}
            d3.keys(n).forEach(function(k){
              var attributeName = k
              var att = networkData.nodeAttributesIndex[k]
              if (att && att.name) {
                attributeName = att.name
              }
              validElements[attributeName] = n[k]
            })
            return validElements
          })
      )
      return csv
    }

    ns.getAdjacencyMatrix = function(attributeId, nodesFilter) {
      var nodes = networkData.g.nodes()
      if (nodesFilter) {
        nodes = nodes.filter(nodesFilter)
      }
      scalesUtils.sortNodes(nodes, attributeId)

      var rows = []
      var headRow = ['']
      nodes.forEach(function(nid){
        headRow.push(nid)
      })
      rows.push(headRow)

      var row
      nodes.forEach(function(nsid){
        row = [nsid]
        nodes.forEach(function(ntid){
          row.push(networkData.g.edge(nsid, ntid)===undefined ? 0 : 1)
        })
        rows.push(row)
      })
      
      var csv = d3.csvFormatRows(rows)
      return csv
    }

    return ns
  })

  .factory('layoutCache', function(storage){
    var ns = {} // Namespace

    // ns.cache = {}
    // ns.running = {} // Is the layout running?

    ns.store = function(key, g, running) {
      var index = {}
      g.nodes().forEach(function(nid){
        index[nid] = [g.getNodeAttribute(nid, 'x'), g.getNodeAttribute(nid, 'y')]
      })
      // ns.cache[key] = index
      // ns.running[key] = running
      storage.set('layout:'+key+':cache', index)
      storage.set('layout:'+key+':running', running)
    }

    ns.recall = function(key, g) {
      // var index = ns.cache[key]
      var index = storage.get('layout:'+key+':cache')
      if (index) {
        g.nodes().forEach(function(nid){
          var xy = index[nid]
          if (xy) {
            g.setNodeAttribute(nid, 'x', xy[0])
            g.setNodeAttribute(nid, 'y', xy[1])
          }
        })
      }
      // return ns.running[key]
      return storage.get('layout:'+key+':running')
    }

    ns.clear = function(key) {
      storage.clear('layout:'+key+':cache')
      storage.clear('layout:'+key+':running')
    }

    return ns
  })

  .factory('storage', ['$rootScope', function ($rootScope) {
    var ns = {}

    ns.set = function(key, obj) {
      sessionStorage[key] = angular.toJson(obj)
    }

    ns.get = function(key){
      return angular.fromJson(sessionStorage[key])
    }

    ns.clear = function(key) {
      delete sessionStorage[key]
    }

    return ns

  }]);

  
