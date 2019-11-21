'use strict'

/* Services */

angular
  .module('minivan.netBundleManager', [])

  .factory('netBundleManager', function($http, paletteGenerator) {
    var ns = {} // namespace
    ns.bundleVersion = '1.0.0'
    ns.ignored_node_attributes = ['label', 'x', 'y', 'z', 'size', 'color']
    ns.ignored_edge_attributes = ['label', 'color']
    var defaults = {
      title: 'Untitled Network',
      authors: [],
      date: 'Unknown',
      url: undefined,
      doi: undefined,
      description: 'This network has no description.',
      bundleVersion: ns.bundleVersion
    }

    // Sets the passed value and if none sets a default value if the attribute is required
    ns.setBundleAttribute = function(bundle, attribute, value, verbose) {
      if (value !== undefined) {
        bundle[attribute] = value
        if (verbose) {
          console.warn(attribute + ' set to ', bundle[attribute])
        }
      } else if (bundle[attribute] === undefined) {
        if (defaults[attribute] !== undefined) {
          bundle[attribute] = defaults[attribute]
          if (verbose) {
            console.warn(
              attribute + ' missing, set to default:',
              bundle[attribute]
            )
          }
        }
      } else if (verbose) {
        console.warn(attribute + ' found:', bundle[attribute])
      }
    }

    function _addMissingVisualizationData(g) {
      var settings = {}
      settings.node_default_color = '#665'
      settings.edge_default_color = '#CCC9C9'

      // Nodes
      var colorIssues = 0
      var coordinateIssues = 0
      g.forEachNode(function(nid) {
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
        console.warn(
          'Note: ' +
            coordinateIssues +
            ' nodes had coordinate issues. We set them to a random position.'
        )
      }

      if (colorIssues > 0) {
        console.warn(
          'Note: ' +
            colorIssues +
            ' nodes had no color. We colored them to a default value.'
        )
      }

      colorIssues = 0
      g.edges().forEach(function(eid) {
        var e = g.getEdgeAttributes(eid)
        if (e.color == undefined) {
          e.color = settings.edge_default_color
          colorIssues++
        }
      })

      if (colorIssues > 0) {
        console.warn(
          'Note: ' +
            colorIssues +
            ' edges had no color. We colored them to a default value.'
        )
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
        return candidates.map(function(d) {
          return d * heuristicRatio
        })
      }
    }

    function fromOldFormat(bundle) {
      // BEWARE: [new-bundle]: overloading attributes not to change
      // the current code semantics too much
      // Basically, we went from the sometimes problematic id,name couple
      // to the unambiguous key,label,slug trio
      bundle.model.nodeAttributes.forEach(function(attr) {
        attr.id = attr.key
        attr.name = attr.label
      })
      bundle.model.edgeAttributes.forEach(function(attr) {
        attr.id = attr.key
        attr.name = attr.label
      })
    }

    function buildIndexes(bundle) {
      // Build attributes indexes
      // TODO: [new-bundle] overloading bundle could be problematic
      bundle.nodeAttributesIndex = {}
      bundle.model.nodeAttributes.forEach(function(d) {
        bundle.nodeAttributesIndex[d.id] = d
      })
      bundle.edgeAttributesIndex = {}
      bundle.model.edgeAttributes.forEach(function(d) {
        bundle.edgeAttributesIndex[d.id] = d
      })
    }

    ns.importBundle = function(fileLocation, callback, verbose) {
      $http.get(fileLocation).then(
        function(r) {
          ns.parseBundle(r.data, callback, verbose)
        },
        function(e) {
          console.error(
            'Error loading file at location:',
            fileLocation,
            '\n',
            e
          )
        }
      )
    }

    function uglyReinforce(graph, bundle) {
      // To avoid empty node attributes. It is that or check undefined on getNodeSize or smth.
      graph.forEachNode(function(nid) {
        var n = graph.getNodeAttributes(nid)
        for (
          let index = 0;
          index < bundle.model.nodeAttributes.length;
          index++
        ) {
          const nodeAttribute = bundle.model.nodeAttributes[index]
          if (!(nodeAttribute.key in n)) {
            if (nodeAttribute.type === 'partition') {
              // debugger;
            } else {
              n[nodeAttribute.key] = 0
            }
          }
        }
      })
    }

    ns.parseBundle = function(bundle, callback, verbose) {
      var deserializedGraph = new Graph(bundle.settings || {})
      deserializedGraph.import(bundle.graph)
      bundle.g = deserializedGraph
      _addMissingVisualizationData(deserializedGraph)
      fromOldFormat(bundle)
      buildIndexes(bundle)
      uglyReinforce(deserializedGraph, bundle)
      callback(bundle)
    }

    ns.importGEXF = function(fileLocation, callback, verbose) {
      $http.get(fileLocation).then(
        function(r) {
          var title = ns._toTitleCase(
            fileLocation
              .substring(fileLocation.lastIndexOf('/') + 1)
              .replace(/\..*/gi, '')
          )
          ns.parseGEXF(r.data, title, callback, verbose)
        },
        function() {
          console.error('Error loading file at location:', fileLocation)
        }
      )
    }

    ns.parseGEXF = function(data, title, callback, verbose) {
      var graph = Graph.library.gexf.parse(Graph, data)
      _addMissingVisualizationData(graph)
      var bundle = minivan.buildBundle(graph, {
        title: title
      })
      bundle.g = graph
      fromOldFormat(bundle)
      buildIndexes(bundle)
      uglyReinforce(graph, bundle)

      // Add default attributes when necessary
      ns.setBundleAttribute(bundle, 'title', title, verbose)
      ns.setBundleAttribute(bundle, 'authors', undefined, verbose)
      ns.setBundleAttribute(
        bundle,
        'date',
        bundle.g._attributes.lastModifiedDate,
        verbose
      )
      ns.setBundleAttribute(bundle, 'url', undefined, verbose)
      ns.setBundleAttribute(bundle, 'doi', undefined, verbose)
      ns.setBundleAttribute(
        bundle,
        'description',
        bundle.g._attributes.description,
        verbose
      )
      ns.setBundleAttribute(bundle, 'bundleVersion', ns.bundleVersion, verbose)

      // Consolidate (indexes...)
      callback(bundle)
    }

    ns.exportBundle = function(bundle) {
      let { nodeAttributesIndex, edgeAttributesIndex, ...cleanBundle } = bundle
      return angular.toJson(
        minivan.buildBundle(bundle.g, cleanBundle),
        null,
        '\t'
      )
    }

    ns._toTitleCase = function(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      })
    }

    ns.getColors = function(count, randomSeed = Math.random(), settings) {
      return iwanthue(count, {
        seed: randomSeed,
        colorSpace: settings
      })
    }

    ns.colorScales = [
      'interpolateGreys',
      'interpolateGreens',
      'interpolateBlues',
      'interpolatePurples',
      'interpolateReds',
      'interpolateOranges',
      'interpolateViridis',
      'interpolateInferno',
      'interpolateMagma',
      'interpolatePlasma',
      'interpolateWarm',
      'interpolateCool',
      'interpolateCubehelixDefault',
      'interpolateBuGn',
      'interpolateBuPu',
      'interpolateGnBu',
      'interpolateOrRd',
      'interpolatePuBuGn',
      'interpolatePuBu',
      'interpolatePuRd',
      'interpolateRdPu',
      'interpolateYlGnBu',
      'interpolateYlGn',
      'interpolateYlOrBr',
      'interpolateYlOrRd'
    ]

    return ns
  })
