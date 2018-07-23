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
    	settings.ignored_edge_attributes = ['label', 'color']

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
						var t = ns.getType(g.getNodeAttribute(nid, k))
						attData.modalityTypes[t] = (attData.modalityTypes[t] || 0) + 1
					})
				})
      	ns._analyseAttributeIndex(g, nodeAttributesIndex, settings.ignored_node_attributes)

      	// Create metadata for node attributes
	      bundle.nodeAttributes = []
	      ns._createAttributeMetaData(g, nodeAttributesIndex, bundle.nodeAttributes)

      	// Index all edge attributes from GEXF
	      var edgeAttributesIndex = {}
	      var g = bundle.g
	      g.edges().forEach(function(eid){
	      	var e = g.getEdgeAttributes(eid)
	      	d3.keys(e).forEach(function(k){
	      		if (edgeAttributesIndex[k]) {
	      			edgeAttributesIndex[k].count++
	      		} else {
	      			edgeAttributesIndex[k] = {count:1}
	      		}
	      	})
	      })

      	// Analyze the data of each edge attribute
      	d3.keys(edgeAttributesIndex).forEach(function(k){
      		var attData = edgeAttributesIndex[k]
      		if(settings.ignored_edge_attributes.indexOf(k) >= 0) {
      			attData.type = 'ignore'
      			return
      		}

      		// Gather variable types from the nodes
      		attData.modalityTypes = {}
					g.edges().forEach(function(eid){
						var t = ns.getType(g.getEdgeAttribute(eid, k))
						attData.modalityTypes[t] = (attData.modalityTypes[t] || 0) + 1
					})
				})
      	ns._analyseAttributeIndex(g, edgeAttributesIndex, settings.ignored_edge_attributes)

      	// Create metadata for node attributes
	      bundle.edgeAttributes = []
	      ns._createAttributeMetaData(g, edgeAttributesIndex, bundle.edgeAttributes)

        // Consolidate (indexes...)
	      ns._consolidateBundle(bundle)

	      console.log('bundle', bundle)

	    	callback(bundle)

	    	return
      }, function(){
        console.error('Error loading file at location:', fileLocation)
      })
    }

		ns._analyseAttributeIndex = function(g, attributesIndex, ignored_attributes){
			d3.keys(attributesIndex).forEach(function(k){
    		var attData = attributesIndex[k]
    		if(ignored_attributes.indexOf(k) >= 0) {
    			attData.type = 'ignore'
    			return
    		}

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
		}

    ns._createAttributeMetaData = function(g, attributesIndex, attributes) {
      d3.keys(attributesIndex).forEach(function(k){
      	var attData = attributesIndex[k]
      	if (attData.type != 'ignore') {
      		var att = {
      			id: k,
      			name: ns.toTitleCase(k),
      			count: attData.count,
      			type: attData.type,
      			integer: attData.dataType == 'integer'
      		}
      		if (att.type == 'partition') {
	      		// Default settings for partition
      			att.modalities = d3.keys(attData.modalities).map(function(m){
      				return {
      					value: m,
      					count: attData.modalities[m]
      				}
      			})
      			var colors = ns.getColors(att.modalities.length)
      			att.modalities.sort(function(a, b){
      				return b.count - a.count
      			})
      			att.modalities.forEach(function(m, i){
      				m.color = colors[i].toString()
      			})
      		} else if (att.type == 'ranking-color') {
      			var extent = d3.extent(d3.keys(attData.modalities), function(d){ return +d })
      			att.min = extent[0]
      			att.max = extent[1]
  					att.colorScale = ns.getRandomColorScale()
      		} else if (att.type == 'ranking-size') {
      			var extent = d3.extent(d3.keys(attData.modalities), function(d){ return +d })
      			att.min = extent[0]
      			att.max = extent[1]
  					att.areaScaling = {min:10, max: 100, interpolation: 'linear'}
      		}
      		attributes.push(att)
      	}
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

    ns._consolidateBundle = function(bundle) {
    	ns.setBundleAttribute(bundle, 'consolidated', true)

      // Node attributes index
      bundle.nodeAttributesIndex = {}
      bundle.nodeAttributes.forEach(function(att){
        bundle.nodeAttributesIndex[att.id] = att

        // Modalities index
        if (att.modalities) {
          att.modalitiesIndex = {}
          att.modalities.forEach(function(m){
            att.modalitiesIndex[m.value] = m
          })
        }

      })

      // Build each node attribute's data
      bundle.nodeAttributes.forEach(function(att){
        att.data = ns._buildNodeAttData(bundle.g, att.id, att.type)
      })

      // Edge attributes index
      bundle.edgeAttributesIndex = {}
      bundle.edgeAttributes.forEach(function(att){
        bundle.edgeAttributesIndex[att.id] = att

        // Modalities index
        if (att.modalities) {
          att.modalitiesIndex = {}
          att.modalities.forEach(function(m){
            att.modalitiesIndex[m.value] = m
          })
        }

      })

      // Build each edge attribute's data
      bundle.edgeAttributes.forEach(function(att){
        att.data = ns._buildEdgeAttData(bundle.g, att.id, att.type)
      })
    }

    ns._buildNodeAttData = function(g, attributeId, attributeType) {
      var attData = {}

      if (attributeType == 'partition') {
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
      } else {
        // We do not need to precompute data for ranking types so far
      }

      return attData
    }

    ns._buildEdgeAttData = function(g, attributeId, attributeType) {
      var attData = {}

      if (attributeType == 'partition') {
        // Aggregate distribution of modalities
        attData.modalitiesIndex = {}
        g.edges().forEach(function(eid){
          var e = g.getEdgeAttributes(eid)
          if (attData.modalitiesIndex[e[attributeId]]) {
            attData.modalitiesIndex[e[attributeId]].edges++
          } else {
            attData.modalitiesIndex[e[attributeId]] = {edges: 1}
          }
        })
        attData.modalities = d3.keys(attData.modalitiesIndex)
        
      } else {
        // We do not need to precompute data for ranking types so far
      }

      return attData
    }

    ns.toTitleCase = function(str) {
	    return str.replace(
        /\w\S*/g,
        function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
	    )
		}

		ns.getType = function(str){
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

		ns.getColors = function(count) {
			if (count == 0) {
				return []
			} else if (count == 1) {
				return ['#666']
			}
			// Generate colors (as Chroma.js objects)
			var colors = paletteGenerator.generate(
			  count, // Colors
			  function(color){ // This function filters valid colors
			    var hcl = d3.hcl(color)
			    return hcl.c>=25.59 && hcl.c<=55.59
			      	&& hcl.l>=60.94 && hcl.l<=90.94;
			  },
			  false, // Using Force Vector instead of k-Means
			  50, // Steps (quality)
			  false, // Ultra precision
			  'Default' // Color distance type (colorblindness)
			);
			// Sort colors by differenciation first
			colors = paletteGenerator.diffSort(colors, 'Default')
			return colors
		}

		ns.getRandomColorScale = function() {
			var scales = [
				'interpolatePuRd',
				'interpolateYlGnBu',
				'interpolateYlOrBr',
				'interpolateGnBu',
				'interpolateCubehelixDefault',
				'interpolateMagma',
				'interpolateInferno',
				'interpolateViridis'
			]
			return scales[Math.floor(Math.random() * scales.length)]
		}

    return ns
  })