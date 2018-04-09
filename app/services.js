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
        ns.title = 'Rio + 20 XXXX XXXXXXX XXX XXXXX XX XXXXX XX XXXXXXX XXXXXX XX'
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
        .range([offset, height - offset])

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
        .range([offset - x * width / ratio, width - offset - x * width / ratio])
      var yScale = d3.scaleLinear()
        .range([offset - y * height / ratio, height - offset - y * height / ratio])

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
    ns.buildModalities = function(attribute) {
      if (attribute.type == 'ranking-size') {
        return ns.buildModalities_size(attribute)
      } else if (attribute.type == 'ranking-color') {
        return ns.buildModalities_color(attribute)
      }
    }

    ns.buildModalities_size = function(attribute) {
      // Size scales
      var areaScale = ns.getAreaScale(attribute.min, attribute.max, attribute.areaScaling.min, attribute.areaScaling.max, attribute.areaScaling.interpolation)
      var rScale = ns.getRScale()

      var minRadius = rScale(attribute.areaScaling.min/attribute.areaScaling.max)
      var maxRadius = rScale(1)

      var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
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
            radius: 20 * rScale(areaScale((min + max) / 2)),
            color: '#999',
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

    ns.buildModalities_color = function(attribute) {
      // Color scales
      var colorScale = ns.getColorScale(attribute.min, attribute.max, attribute.colorScale)

      var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
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
            radius: 20,
            color: colorScale((min + max) / 2),
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

    return ns
  })

  .factory('csvBuilder', function(networkData){
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

    return ns
  })
