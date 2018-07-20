'use strict';

/* Services */

angular.module('minivan.netBundleManager', [])

	.factory('netBundleManager', function($http, $timeout, paletteGenerator){
    var ns = {}     // namespace
    ns.bundleVersion = '0.1alpha'

    // Sets the passed value and if none sets a default value if the attribute is required
    ns.setBundleAttribute = function(bundle, attribute, value, verbose) {
    	var defaults = {}
    	defaults.title = 'My network'
    	defaults.authors = []
    	defaults.date = 'Unknown'
    	defaults.url = undefined
    	defaults.description = 'This network has no description.'
    	defaults.bundleVersion = ns.bundleVersion

    	if (value !== undefined) {
    		bundle[attribute] = value
    		if (verbose) { console.warn(attribute+' set to ', bundle[attribute]) }
    	} else if (bundle[attribute] === undefined) {
				if (defaults[attribute] !== undefined) {
					bundle[attribute] = defaults[attribute]
					if (verbose) { console.warn(attribute+' missing, set to default:', bundle[attribute]) }
				}
			} else if (verbose) { console.warn(attribute+' found:', bundle[attribute]) }
    }

    ns.importGEXF = function(fileLocation, callback, verbose) {
    	var settings = {}
    	settings.ignored_node_attributes = ['label', 'x', 'y', 'z', 'size', 'color']

    	$http.get(fileLocation)
      .then(function(r){
      	var bundle = {}

      	bundle.g = Graph.library.gexf.parse(Graph, r.data)

	      ns._addMissingVisualizationData(bundle.g)
	      // window.g = bundle.g

	      // Add default attributes when necessary
	      ns.setBundleAttribute(bundle, 'title', 					undefined, verbose)
	      ns.setBundleAttribute(bundle, 'authors', 				undefined, verbose)
	      ns.setBundleAttribute(bundle, 'date', 					bundle.g._attributes.lastModifiedDate, verbose)
	      ns.setBundleAttribute(bundle, 'url', 						undefined, verbose)
	      ns.setBundleAttribute(bundle, 'description', 		bundle.g._attributes.description, verbose)
	      ns.setBundleAttribute(bundle, 'bundleVersion', 	ns.bundleVersion, verbose)

	      // Index all node attributes from GEXF
	      var nodeAttributesIndex = {}
	      var g = bundle.g
	      g.nodes().forEach(function(nid){
	      	var n = g.getNodeAttributes(nid)
	      	d3.keys(n).forEach(function(k){
	      		if (nodeAttributesIndex[k]) {
	      			nodeAttributesIndex[k].count++
	      		} else {
	      			nodeAttributesIndex[k] = {count:1}
	      		}
	      	})
	      })

      	// Analyze the data of each node attribute
      	d3.keys(nodeAttributesIndex).forEach(function(k){
      		var attData = nodeAttributesIndex[k]
      		if(settings.ignored_node_attributes.indexOf(k) >= 0) {
      			attData.type = 'ignore'
      			return
      		}

      		// Gather variable types from the nodes
      		attData.modalityTypes = {}
					g.nodes().forEach(function(nid){
						var t = getType(g.getNodeAttribute(nid, k))
						attData.modalityTypes[t] = (attData.modalityTypes[t] || 0) + 1
					})

					// Infer a data type
					if (attData.modalityTypes.string !== undefined) {
						attData.dataType = 'string'
					} else if (attData.modalityTypes.float !== undefined) {
						attData.dataType = 'float'
					} else if (attData.modalityTypes.integer !== undefined) {
						attData.dataType = 'integer'
					} else {
						attData.dataType = 'error'
					}

					// Aggregate the distribution of modalities
					attData.modalities = {}
					g.nodes().forEach(function(nid){
						var v = g.getNodeAttribute(nid, k)
						attData.modalities[v] = (attData.modalities[v] || 0) + 1
					})

					// Build stats for the distribution
					attData.stats = {}
					var modalityCountsArray = d3.values(attData.modalities)
					attData.stats.differentModalities = modalityCountsArray.length
					attData.stats.sizeOfSmallestModality = d3.min(modalityCountsArray)
					attData.stats.sizeOfBiggestModality = d3.max(modalityCountsArray)
					attData.stats.medianSize = d3.median(modalityCountsArray)
					attData.stats.deviation = d3.deviation(modalityCountsArray)
					attData.stats.modalitiesUnitary = modalityCountsArray.filter(function(d){return d==1}).length
					attData.stats.modalitiesAbove1Percent = modalityCountsArray.filter(function(d){return d>=g.order*0.01}).length
					attData.stats.modalitiesAbove10Percent = modalityCountsArray.filter(function(d){return d>=g.order*0.1}).length
					
					// Decide what how the attribute should be visualized
					if (attData.dataType == 'string') {
						if (attData.stats.modalitiesAbove10Percent == 0) {
							attData.type = 'ignore'
						} else {
							attData.type = 'partition'
						}
					} else if (attData.dataType == 'float') {
						attData.type = 'ranking-size'
					} else if (attData.dataType == 'integer') {
						attData.type = 'ranking-size'
					} else {
						attData.type = 'ignore'
					}
      	})

      	// Create metadata for node attributes
	      bundle.nodeAttributes = []
	      d3.keys(nodeAttributesIndex).forEach(function(k){
	      	var attData = nodeAttributesIndex[k]
	      	if (attData.type != 'ignore') {
	      		var na = {
	      			id: k,
	      			name: toTitleCase(k),
	      			count: attData.count,
	      			type: attData.type
	      		}
	      		// Default settings for partition
	      		if (na.type == 'partition') {
	      			na.modalities = d3.keys(attData.modalities).map(function(m){
	      				return {
	      					value: m,
	      					count: attData.modalities[m],
	      					color: '#000' // TODO
	      				}
	      			})
	      			var colors = getColors(na.modalities.length)
	      		}
	      		bundle.nodeAttributes.push(na)
	      	}
      	})


	      console.log('nodeAttributesIndex', nodeAttributesIndex)

	      console.log('bundle', bundle)

	    	callback(bundle)

	    	return

	    	// TODO: translate that in the code above
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
        console.error('Error loading file at location:', fileLocation)
      })
    }

    ns._addMissingVisualizationData = function(g) {
    	var settings = {}
    	settings.node_default_color = '#665'
    	settings.edge_default_color = '#CCC9C9'

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
          n.color = settings.node_default_color
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
          e.color = settings.edge_default_color
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

    function toTitleCase(str) {
	    return str.replace(
        /\w\S*/g,
        function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
	    )
		}

		function getType(str){
			// Adapted from http://stackoverflow.com/questions/16775547/javascript-guess-data-type-from-string
			if(str === undefined) str = 'undefined';
		  if (typeof str !== 'string') str = str.toString();
		  var nan = isNaN(Number(str));
		  var isfloat = /^\d*(\.|,)\d*$/;
		  var commaFloat = /^(\d{0,3}(,)?)+\.\d*$/;
		  var dotFloat = /^(\d{0,3}(\.)?)+,\d*$/;
		  if (!nan){
		      if (parseFloat(str) === parseInt(str)) return "integer";
		      else return "float";
		  }
		  else if (isfloat.test(str) || commaFloat.test(str) || dotFloat.test(str)) return "float";
		  else return "string";
		}

		function getColors(count) {
			// Generate colors (as Chroma.js objects)
			var colors = paletteGenerator.generate(
			  count, // Colors
			  function(color){ // This function filters valid colors
			    var hcl = color.hcl();
			    return hcl[1]>=25.59 && hcl[1]<=55.59
			      	&& hcl[2]>=60.94 && hcl[2]<=90.94;
			  },
			  false, // Using Force Vector instead of k-Means
			  50, // Steps (quality)
			  false, // Ultra precision
			  'Default' // Color distance type (colorblindness)
			);
			// Sort colors by differenciation first
			colors = paletteGenerator.diffSort(colors, 'Default')
		}

    return ns
  })