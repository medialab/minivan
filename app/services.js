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
          max: 51,
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

  .factory('networkProcessor', [function(){
    var ns = {}     // namespace

    ns.consolidate = function(data) {
      // Node attributes index
      data.nodeAttributesIndex = {}
      data.nodeAttributes.forEach(function(att){
        data.nodeAttributesIndex[att.id] = att
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

    return ns
  }])

  .factory('scalesUtils', ['networkData', function(networkData){
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

    return ns
  }])

  .factory('csvBuilder', ['networkData', function(networkData){
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
  }])
