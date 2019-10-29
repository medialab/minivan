'use strict'

/* Services */

angular
  .module('app.services', [])

  .factory('dataLoader', function(
    $http,
    $timeout,
    $location,
    netBundleManager
  ) {
    var ns = {} // namespace

    ns.cache = undefined
    ns.fileLocation = undefined

    ns.set = function(bundle) {
      ns.cache = bundle
    }

    var fileLocationCache = undefined

    ns.get = function(fileLocation, callback) {
      var settings = {}
      settings.simulate_loading_time = 500
      settings.allow_gexf = true
      var bundle_import
      if (
        settings.allow_gexf &&
        fileLocation &&
        fileLocation.substr(-5).toUpperCase() == '.GEXF'
      ) {
        bundle_import = netBundleManager.importGEXF
      } else {
        bundle_import = netBundleManager.importBundle
      }
      if (
        ns.cache === undefined ||
        (fileLocation !== undefined && fileLocation !== fileLocationCache)
      ) {
        if (fileLocation === undefined) {
          alert(
            'Weird!\nWe cannot locate the data...\nThis is not supposed to happen.'
          )
          console.error('Error: no file location known for loading data.')
          return
        }
        var networkData = { loaded: false }
        fileLocationCache = fileLocation
        bundle_import(
          ns.decodeLocation(fileLocation) || settings.default_file_location,
          function(data) {
            // Simulate loading time
            $timeout(function() {
              console.log('data from bundle', data)
              d3.keys(data).forEach(function(k) {
                networkData[k] = data[k]
              })
              networkData.loaded = true
            }, settings.simulate_loading_time)

            // Register download feature for the console
            window.downloadBundle = function() {
              var json = netBundleManager.exportBundle(networkData)
              var blob = new Blob([json], {
                type: 'application/json;charset=utf-8'
              })
              saveAs(blob, 'BUNDLE - ' + networkData.title + '.json')
            }
          }
        )
        ns.cache = networkData
        ns.fileLocation = fileLocation
      }
      return ns.cache
    }

    ns.encodeLocation = function(url) {
      if (url === undefined) return undefined
      return encodeURIComponent(url)
    }

    ns.decodeLocation = function(encodedUrl) {
      if (encodedUrl === undefined) return undefined
      return decodeURIComponent(encodedUrl)
    }

    ns.getLocation = function() {
      return ns.fileLocation
    }

    return ns
  })

  .factory('scalesUtils', function($filter, dataLoader) {
    var ns = {} // Namespace

    // Circle area -> radius
    ns.getRScale = function() {
      // A = PI * r^2 <=> r = SQRT( A/PI )
      var rScale = function(A) {
        return Math.sqrt(A / Math.PI)
      }
      // Circle radius -> area
      rScale.invert = function(r) {
        return Math.PI * r * r
      }
      return rScale
    }

    // ranking value -> area as [0,1]
    ns.getAreaScale = function(
      minValue,
      maxValue,
      minScaling,
      maxScaling,
      interpolation
    ) {
      var dScale
      if (interpolation == 'linear') {
        dScale = d3
          .scaleLinear()
          .range([minScaling / maxScaling, 1])
          .domain([minValue, maxValue])
      } else if (interpolation.split('-')[0] == 'pow') {
        dScale = d3
          .scalePow()
          .exponent(+interpolation.split('-')[1] || 1)
          .range([minScaling / maxScaling, 1])
          .domain([minValue, maxValue])
      } else {
        console.error('[error] Unknown interpolation')
      }
      return dScale
    }

    ns.getSizeAsColorScale = function(
      minValue,
      maxValue,
      minScaling,
      maxScaling,
      interpolation
    ) {
      var dScale
      if (interpolation == 'linear') {
        dScale = d3
          .scaleLinear()
          .range([minScaling / maxScaling, 1])
          .domain([minValue, maxValue])
      } else if (interpolation.split('-')[0] == 'pow') {
        dScale = d3
          .scalePow()
          .exponent(+interpolation.split('-')[1] || 1)
          .range([minScaling / maxScaling, 1])
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
    ns.getColorScale = function(
      minValue,
      maxValue,
      colorScaleInterpolator = 'interpolateGreys',
      invert = false,
      truncate = true
    ) {
      var dScale = d3.scaleLinear().domain([minValue, maxValue])
      if (invert) {
        if (truncate) {
          dScale.range([0.8, 0.2])
        } else {
          dScale.range([1, 0])
        }
      } else {
        if (truncate) {
          dScale.range([0.2, 0.8])
        } else {
          dScale.range([0, 1])
        }
      }
      var d3Interpolator = d3[colorScaleInterpolator]
      if (d3Interpolator === undefined) {
        console.error(
          '[error] Unknown d3 color interpolator:',
          colorScaleInterpolator
        )
      }
      var colorScale = function(d) {
        return d3.color(d3Interpolator(dScale(d)))
      }
      return colorScale
    }

    ns.getXYScales = function(width, height, offset, _g) {
      var g = _g || dataLoader.get().g
      var xScale = d3.scaleLinear().range([offset, width - offset])
      var yScale = d3.scaleLinear().range([height - offset, offset])

      var xExtent = d3.extent(g.nodes(), function(nid) {
        return g.getNodeAttribute(nid, 'x')
      })
      var yExtent = d3.extent(g.nodes(), function(nid) {
        return g.getNodeAttribute(nid, 'y')
      })
      var sizeRatio = Math.max(
        (xExtent[1] - xExtent[0]) / (width - 2 * offset),
        (yExtent[1] - yExtent[0]) / (height - 2 * offset)
      )
      var xMean = (xExtent[0] + xExtent[1]) / 2
      var yMean = (yExtent[0] + yExtent[1]) / 2
      xScale.domain([
        xMean - (sizeRatio * width) / 2,
        xMean + (sizeRatio * width) / 2
      ])
      yScale.domain([
        yMean - (sizeRatio * height) / 2,
        yMean + (sizeRatio * height) / 2
      ])

      return [xScale, yScale]
    }

    ns.getXYScales_camera = function(width, height, offset, x, y, ratio, _g) {
      var g = _g || dataLoader.get().g
      var xScale = d3
        .scaleLinear()
        .range([
          offset - ((x - 0.5) * width) / ratio,
          width - offset - ((x - 0.5) * width) / ratio
        ])
      var yScale = d3
        .scaleLinear()
        .range([
          height - offset + ((y - 0.5) * height) / ratio,
          offset + ((y - 0.5) * height) / ratio
        ])

      var xExtent = d3.extent(g.nodes(), function(nid) {
        return g.getNodeAttribute(nid, 'x')
      })
      var yExtent = d3.extent(g.nodes(), function(nid) {
        return g.getNodeAttribute(nid, 'y')
      })
      var sizeRatio =
        ratio *
        Math.max(
          (xExtent[1] - xExtent[0]) / (width - 2 * offset),
          (yExtent[1] - yExtent[0]) / (height - 2 * offset)
        )
      var xMean = (xExtent[0] + xExtent[1]) / 2
      var yMean = (yExtent[0] + yExtent[1]) / 2
      xScale.domain([
        xMean - (sizeRatio * width) / 2,
        xMean + (sizeRatio * width) / 2
      ])
      yScale.domain([
        yMean - (sizeRatio * height) / 2,
        yMean + (sizeRatio * height) / 2
      ])

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
      var g = dataLoader.get().g

      // Size scales
      var areaScale = ns.getAreaScale(
        attribute.min,
        attribute.max,
        attribute.areaScaling.min,
        attribute.areaScaling.max,
        attribute.areaScaling.interpolation
      )
      var rScale = ns.getRScale()

      var minRadius = rScale(
        attribute.areaScaling.min / attribute.areaScaling.max
      )
      var maxRadius = rScale(1)

      var data
      if (useDeciles) {
        var values = g.nodes().map(function(nid) {
          return +g.getNodeAttribute(nid, attribute.id)
        })
        values.sort(function(a, b) {
          return a - b
        })
        var deciles = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(
          function(d) {
            return d3.quantile(values, d)
          }
        )
        var maxValue = d3.max(values)

        // Remove duplicates
        var existing = {}
        var deciles = deciles.filter(function(d) {
          if (existing[d]) return false
          existing[d] = true
          return true
        })

        data = deciles
          .map(function(d, i) {
            // Value
            var min = d
            var max = deciles[i + 1] || maxValue
            // Nodes
            var nodes = g.nodes().filter(function(nid) {
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
        var valuesExtent = d3.extent(g.nodes(), function(nid) {
          return +g.getNodeAttribute(nid, attribute.id)
        })
        data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map(function(d) {
            // Percent
            var pmin = d / 10
            var pmax = (d + 1) / 10
            // Radius value
            var rmin = minRadius + pmin * (maxRadius - minRadius)
            var rmax = minRadius + pmax * (maxRadius - minRadius)
            // Value
            var min =
              pmax == 0
                ? valuesExtent[0]
                : areaScale.invert(rScale.invert(rmin))
            var max =
              pmax == 1
                ? valuesExtent[1]
                : areaScale.invert(rScale.invert(rmax))
            return {
              pmin: pmin,
              pmax: pmax,
              min: min,
              max: max,
              average: (min + max) / 2,
              nodes: g.nodes().filter(function(nid) {
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

      data.forEach(function(d, i) {
        ;(d.radius = rScale(areaScale((d.min + d.max) / 2))), (d.color = '#999')
        d.highest = i == 0
      })

      // Radius ratio: relative to the max radius
      var radiusExtent = d3.extent(data, function(d) {
        return d.radius
      })
      data.forEach(function(d) {
        d.radiusRatio = d.radius / radiusExtent[1]
      })

      data.forEach(function(d) {
        d.count = d.nodes.length
      })

      if (attribute.integer) {
        // Use the numbers from the actual nodes
        data = data.filter(function(d) {
          return d.count > 0
        })
        data.forEach(function(d) {
          var e = d3.extent(d.nodes, function(nid) {
            return g.getNodeAttribute(nid, attribute.id)
          })
          d.min = e[0]
          d.max = e[1]
        })
        data.forEach(function(d) {
          if (d.min == d.max) {
            d.label = $filter('number')(d.min)
          } else {
            d.label =
              $filter('number')(d.min) + ' to ' + $filter('number')(d.max)
          }
        })
      } else {
        data.forEach(function(d, i) {
          if (i < data.length - 1) {
            d.label =
              $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          } else {
            d.label =
              $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          }
        })
      }

      data.forEach(function(d) {
        d.value = d.average
      })

      data.forEach(function(d) {
        delete d.nodes
      })

      return data
    }

    ns.buildModalities_color = function(attribute, useDeciles) {
      var g = dataLoader.get().g

      // Color scales
      var colorScale = ns.getColorScale(
        attribute.min,
        attribute.max,
        attribute.colorScale,
        attribute.invertScale,
        attribute.truncateScale
      )

      var data
      if (useDeciles) {
        var values = g.nodes().map(function(nid) {
          return +g.getNodeAttribute(nid, attribute.id)
        })
        values.sort(function(a, b) {
          return a - b
        })
        var maxValue = d3.max(values)
        var deciles = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(
          function(d) {
            return d3.quantile(values, d)
          }
        )
        // Remove duplicates
        var existing = {}
        var deciles = deciles.filter(function(d) {
          if (existing[d]) return false
          existing[d] = true
          return true
        })

        data = deciles
          .map(function(d, i) {
            // Value
            var min = d
            var max = deciles[i + 1] || maxValue
            // Nodes
            var nodes = g.nodes().filter(function(nid) {
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
        var valuesExtent = d3.extent(g.nodes(), function(nid) {
          return +g.getNodeAttribute(nid, attribute.id)
        })
        data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map(function(d) {
            // Percent
            var pmin = d / 10
            var pmax = (d + 1) / 10
            // Value
            var min =
              pmax == 0
                ? valuesExtent[0]
                : attribute.min + pmin * (attribute.max - attribute.min)
            var max =
              pmax == 1
                ? valuesExtent[1]
                : attribute.min + pmax * (attribute.max - attribute.min)
            return {
              pmin: pmin,
              pmax: pmax,
              min: min,
              max: max,
              average: (min + max) / 2,
              nodes: g.nodes().filter(function(nid) {
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

      data.forEach(function(d, i) {
        d.radius = 20
        d.radiusRatio = 1
        d.color = colorScale(d.average)
        d.highest = i == 0
      })

      data.forEach(function(d) {
        d.count = d.nodes.length
      })

      if (attribute.integer) {
        // Use the numbers from the actual nodes
        data = data.filter(function(d) {
          return d.count > 0
        })
        data.forEach(function(d) {
          var e = d3.extent(d.nodes, function(nid) {
            return g.getNodeAttribute(nid, attribute.id)
          })
          d.min = e[0]
          d.max = e[1]
        })
        data.forEach(function(d) {
          if (d.min == d.max) {
            d.label = $filter('number')(d.min)
          } else {
            d.label =
              $filter('number')(d.min) + ' to ' + $filter('number')(d.max)
          }
        })
      } else {
        data.forEach(function(d, i) {
          if (i < data.length - 1) {
            d.label =
              $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          } else {
            d.label =
              $filter('number')(d.min) + ' - ' + $filter('number')(d.max)
          }
        })
      }

      data.forEach(function(d) {
        d.value = d.average
      })

      data.forEach(function(d) {
        delete d.nodes
      })

      return data
    }

    // Build data for distribution of ranking
    ns.buildRankingDistribution = function(attribute, bandsCount, niceScale) {
      var g = dataLoader.get().g
      var values = g.nodes().map(function(nid) {
        return g.getNodeAttribute(nid, attribute.id)
      })
      var valuesExtent = d3.extent(values)
      var lowerBound = valuesExtent[0]
      var upperBound = valuesExtent[1]
      var bandWidth = (upperBound - lowerBound) / bandsCount

      if (niceScale) {
        // Lower the bandWidth to closest round number
        bandWidth = Math.pow(10, Math.floor(Math.log(bandWidth) / Math.log(10)))
        // Rise it up to round multiple
        if ((upperBound - lowerBound) / (bandWidth * 2) <= bandsCount) {
          bandWidth *= 2
        } else if ((upperBound - lowerBound) / (bandWidth * 5) <= bandsCount) {
          bandWidth *= 5
        } else {
          bandWidth *= 10
        }
        lowerBound -= lowerBound % bandWidth
        if (upperBound % bandWidth > 0) {
          upperBound += bandWidth - (upperBound % bandWidth)
        }
      }

      var data = []
      var i
      for (i = lowerBound; i < upperBound; i += bandWidth) {
        var d = {}
        d.min = i
        d.max = i + bandWidth
        d.average = (d.min + d.max) / 2
        d.count = values.filter(function(v) {
          return (
            v >= d.min &&
            (v < d.max || (i == upperBound - bandWidth && v <= d.max))
          )
        }).length
        data.push(d)
      }
      return data
    }

    // Get natural modalities for a ranking, comparable to buildRankingDistribution
    ns.getIntegerRankingModalities = function(attribute) {
      var g = dataLoader.get().g
      var modalitiesIndex = {}
      var min = Infinity
      var max = -Infinity
      g.nodes().forEach(function(nid) {
        var modValue = g.getNodeAttribute(nid, attribute.id)
        min = Math.min(min, modValue)
        max = Math.max(max, modValue)
        var modObj = modalitiesIndex[modValue] || { value: modValue, count: 0 }
        modObj.count++
        modalitiesIndex[modValue] = modObj
      })
      // We assume that the attribute is an integer.
      // We will fill the blanks in the modalities index.
      // This will purposefully produce data points with count==0.
      var i
      for (i = Math.floor(min); i <= max; i++) {
        if (modalitiesIndex[i] === undefined) {
          modalitiesIndex[i] = { value: i, count: 0 }
        }
      }
      var data = Object.values(modalitiesIndex)
      data.sort(function(a, b) {
        return a.value - b.value
      })
      return data
    }

    // Sort the nodes, by default or by an attribute
    ns.sortNodes = function(nodes, attributeId) {
      var networkData = dataLoader.get()
      var g = networkData.g
      if (attributeId) {
        if (networkData.loaded) {
          var att = networkData.nodeAttributesIndex[attributeId]
          if (att.type == 'partition') {
            var modalitiesIndex = {}
            Object.values(att.modalities).forEach(function(mod, i) {
              modalitiesIndex[mod.value] = i
            })
            nodes.sort(function(a, b) {
              var aModIndex =
                modalitiesIndex[g.getNodeAttribute(a, attributeId)]
              var bModIndex =
                modalitiesIndex[g.getNodeAttribute(b, attributeId)]
              var diff = aModIndex - bModIndex
              if (diff == 0) {
                var alabel = g.getNodeAttribute(a, 'label')
                var blabel = g.getNodeAttribute(b, 'label')
                if (alabel > blabel) return 1
                else if (alabel < blabel) return -1
                return 0
              } else return diff
            })
          } else if (
            att.type == 'ranking-size' ||
            att.type == 'ranking-color'
          ) {
            nodes.sort(function(a, b) {
              var aValue = +g.getNodeAttribute(a, attributeId)
              var bValue = +g.getNodeAttribute(b, attributeId)
              return bValue - aValue
            })
          }
        } else {
          console.log(
            '[ERROR] Network data must be loaded before using sortNodes().'
          )
        }
      } else {
        nodes.sort(function(a, b) {
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

  .factory('csvBuilder', function(dataLoader, scalesUtils) {
    var ns = {} // Namespace

    ns.getAttributes = function() {
      var csv = d3.csvFormat(
        dataLoader.get().model.nodeAttributes.map(function(att) {
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
            validElements.areaScaling_interpolation =
              att.areaScaling.interpolation
          }
          validElements.colorScale = att.colorScale
          validElements.invertScale = att.invertScale
          validElements.truncateScale = att.truncateScale
          validElements.modalities = JSON.stringify(att.modalities || [])
          return validElements
        })
      )
      return csv
    }

    ns.getModalities = function(attributeId) {
      var attribute = dataLoader.get().nodeAttributesIndex[attributeId]
      var csv = d3.csvFormat(
        attribute.modalities.map(function(att) {
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
        modalities.map(function(att) {
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
      return ns._getModalityCrossings(
        attributeId,
        modSelection,
        'normalizedDensity'
      )
    }

    ns._getModalityCrossings = function(
      attributeId,
      modSelection,
      modalityAtt
    ) {
      var attribute = dataLoader.get().nodeAttributesIndex[attributeId]
      var rows = []

      // Fix modSelection
      if (
        modSelection === undefined ||
        !d3.values(modSelection).some(function(d) {
          return d
        })
      ) {
        modSelection = {}
        var mod
        for (mod in attribute.modalities) {
          modSelection[mod] = true
        }
      }

      // Select modalities
      var modalities = Object.keys(attribute.modalities).filter(function(mod) {
        return modSelection[mod]
      })

      // Rank modalities by count
      var sortedModalities = modalities.sort(function(v1, v2) {
        return attribute.modalities[v2].nodes - attribute.modalities[v1].nodes
      })

      var headRow = ['']
      sortedModalities.forEach(function(mod) {
        headRow.push(mod)
      })
      rows.push(headRow)

      var row
      sortedModalities.forEach(function(mod) {
        row = [mod]
        sortedModalities.forEach(function(mod2) {
          row.push(+attribute.modalities[mod].flow[mod2][modalityAtt])
        })
        rows.push(row)
      })

      var csv = d3.csvFormatRows(rows)
      return csv
    }

    ns.getNodes = function(nodesFilter, attributeId) {
      var networkData = dataLoader.get()
      var nodes = networkData.g.nodes()
      if (nodesFilter) {
        nodes = nodes.filter(nodesFilter)
      }
      if (attributeId) {
        scalesUtils.sortNodes(nodes, attributeId)
      }
      var csv = d3.csvFormat(
        nodes.map(function(nid) {
          var n = g.getNodeAttributes(nid)
          var validElements = {}
          d3.keys(n).forEach(function(k) {
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
      var networkData = dataLoader.get()
      var nodes = networkData.g.nodes()
      if (nodesFilter) {
        nodes = nodes.filter(nodesFilter)
      }
      scalesUtils.sortNodes(nodes, attributeId)

      var rows = []
      var headRow = ['']
      nodes.forEach(function(nid) {
        headRow.push(nid)
      })
      rows.push(headRow)

      var row
      nodes.forEach(function(nsid) {
        row = [nsid]
        nodes.forEach(function(ntid) {
          row.push(networkData.g.edge(nsid, ntid) === undefined ? 0 : 1)
        })
        rows.push(row)
      })

      var csv = d3.csvFormatRows(rows)
      return csv
    }

    return ns
  })

  .factory('layoutCache', function(storage) {
    var ns = {} // Namespace

    // ns.cache = {}
    // ns.running = {} // Is the layout running?

    ns.store = function(key, g, running) {
      var index = {}
      g.nodes().forEach(function(nid) {
        index[nid] = [
          g.getNodeAttribute(nid, 'x'),
          g.getNodeAttribute(nid, 'y')
        ]
      })
      // ns.cache[key] = index
      // ns.running[key] = running
      storage.set('layout:' + key + ':cache', index)
      storage.set('layout:' + key + ':running', running)
    }

    ns.recall = function(key, g) {
      // var index = ns.cache[key]
      var index = storage.get('layout:' + key + ':cache')
      if (index) {
        g.nodes().forEach(function(nid) {
          var xy = index[nid]
          if (xy) {
            g.setNodeAttribute(nid, 'x', xy[0])
            g.setNodeAttribute(nid, 'y', xy[1])
          }
        })
      }
      // return ns.running[key]
      return storage.get('layout:' + key + ':running')
    }

    ns.clear = function(key) {
      storage.clear('layout:' + key + ':cache')
      storage.clear('layout:' + key + ':running')
    }

    return ns
  })

  .factory('storage', function($rootScope) {
    var ns = {}

    ns.set = function(key, obj) {
      sessionStorage[key] = angular.toJson(obj)
    }

    ns.get = function(key) {
      return angular.fromJson(sessionStorage[key])
    }

    ns.clear = function(key) {
      delete sessionStorage[key]
    }

    return ns
  })

  .factory('userCache', function() {
    var ns = {}

    ns.set = function(key, obj) {
      localStorage[key] = angular.toJson(obj)
    }

    ns.get = function(key, defaultValue) {
      if (!(key in localStorage)) return defaultValue

      return angular.fromJson(localStorage[key])
    }

    ns.clear = function(key) {
      delete localStorage[key]
    }

    return ns
  })

  .factory('remarkableNodes', function($rootScope, dataLoader) {
    var ns = {}

    ns.attribute = undefined
    ns.modality = undefined
    ns.topCut = undefined

    ns.getData = function(attribute, modality, topCut) {
      ns.attribute = attribute
      ns.modality = modality
      ns.topCut = topCut
      var g = dataLoader.get().g
      var sortedNodes = {
        inside: {
          citedFromInside: [],
          citedFromOutside: [],
          pointingToInside: [],
          pointingToOutside: [],
          connectedInside: [],
          connectedOutside: []
        },
        outside: {
          citedFromInside: [],
          citedFromOutside: [],
          pointingToInside: [],
          pointingToOutside: [],
          connectedInside: [],
          connectedOutside: []
        }
      }
      if (g.type == 'directed' || g.type == 'mixed') {
        sortedNodes.inside.citedFromInside = ns.buildSortedNodes(
          'INSIDE',
          'CITED_FROM',
          'INSIDE'
        )
        sortedNodes.inside.citedFromOutside = ns.buildSortedNodes(
          'INSIDE',
          'CITED_FROM',
          'OUTSIDE'
        )
        sortedNodes.inside.pointingToInside = ns.buildSortedNodes(
          'INSIDE',
          'POINTING_TO',
          'INSIDE'
        )
        sortedNodes.inside.pointingToOutside = ns.buildSortedNodes(
          'INSIDE',
          'POINTING_TO',
          'OUTSIDE'
        )
        sortedNodes.outside.citedFromInside = ns.buildSortedNodes(
          'OUTSIDE',
          'CITED_FROM',
          'INSIDE'
        )
        // sortedNodes.outside.citedFromOutside = ns.buildSortedNodes('OUTSIDE', 'CITED_FROM', 'OUTSIDE')
        sortedNodes.outside.pointingToInside = ns.buildSortedNodes(
          'OUTSIDE',
          'POINTING_TO',
          'INSIDE'
        )
        // sortedNodes.outside.pointingToOutside = ns.buildSortedNodes('OUTSIDE', 'POINTING_TO', 'OUTSIDE')
      }
      if (g.type == 'undirected' || g.type == 'mixed') {
        sortedNodes.inside.connectedInside = ns.buildSortedNodes(
          'INSIDE',
          'CONNECTED',
          'INSIDE'
        )
        sortedNodes.inside.connectedOutside = ns.buildSortedNodes(
          'INSIDE',
          'CONNECTED',
          'OUTSIDE'
        )
        sortedNodes.outside.connectedInside = ns.buildSortedNodes(
          'OUTSIDE',
          'CONNECTED',
          'INSIDE'
        )
        // sortedNodes.outside.connectedOutside = ns.buildSortedNodes('OUTSIDE', 'CONNECTED', 'OUTSIDE')
      }

      return sortedNodes
    }

    ns.buildSortedNodes = function(pool, mode, extremity_pool) {
      var g = dataLoader.get().g
      var result = g.nodes()
      var pool_condition
      var extremity_pool_condition

      // Filter pool
      if (pool == 'INSIDE') {
        pool_condition = function(nid) {
          return g.getNodeAttribute(nid, ns.attribute.id) == ns.modality.value
        }
      } else {
        pool_condition = function(nid) {
          return g.getNodeAttribute(nid, ns.attribute.id) != ns.modality.value
        }
      }
      result = result.filter(function(nid) {
        return pool_condition(nid)
      })

      // Results items
      result = result.map(function(nid) {
        return {
          id: nid,
          node: g.getNodeAttributes(nid)
        }
      })

      // Compute edge scores
      if (extremity_pool == 'INSIDE') {
        extremity_pool_condition = function(nid) {
          return g.getNodeAttribute(nid, ns.attribute.id) == ns.modality.value
        }
      } else {
        extremity_pool_condition = function(nid) {
          return g.getNodeAttribute(nid, ns.attribute.id) != ns.modality.value
        }
      }
      if (mode == 'CITED_FROM') {
        result.forEach(function(item) {
          item.score = g.inEdges(item.id).filter(function(eid) {
            return extremity_pool_condition(g.source(eid))
          }).length
        })
      } else if (mode == 'POINTING_TO') {
        result.forEach(function(item) {
          item.score = g.outEdges(item.id).filter(function(eid) {
            return extremity_pool_condition(g.target(eid))
          }).length
        })
      } else {
        result.forEach(function(item) {
          item.score = g.edges(item.id).filter(function(eid) {
            return extremity_pool_condition(g.opposite(item.id, eid))
          }).length
        })
      }
      result = result.filter(function(item) {
        return item.score > 0
      }) // Ignore if 0 edges
      result.sort(function(a, b) {
        return b.score - a.score
      })

      if (result.length > ns.topCut) {
        result = result.filter(function(item, i) {
          return i < ns.topCut || item.score == result[ns.topCut - 1].score
        })
      }
      return result
    }

    return ns
  })
