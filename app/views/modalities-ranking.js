'use strict';

angular.module('app.modalities-ranking', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/ranking/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
  $routeProvider.when('/ranking-size/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
  $routeProvider.when('/ranking-color/:attribute/modalities', {
    templateUrl: 'views/modalities-ranking.html'
  , controller: 'ModalitiesRankingController'
  , reloadOnSearch: false
  })
}])

.controller('ModalitiesRankingController', function(
	$scope,
	$location,
	$timeout,
	$route,
	$routeParams,
	networkData,
	csvBuilder,
  scalesUtils,
  $filter
) {
	$scope.panel = $location.search().panel || 'map'
	$scope.search = $location.search().q
	$scope.networkData = networkData
  $scope.modalityListDetailLevel = 1
  $scope.statsDetailLevel = 1
  $scope.$watch('panel', updateLocationPath)
  $scope.$watch('search', updateLocationPath)
  $scope.$watch('modalitiesSelection', updateNodeFilter, true)
  $scope.$watch('networkData.loaded', function(){
    if ($scope.networkData.loaded) {
      $scope.attribute = $scope.networkData.nodeAttributesIndex[$routeParams.attribute]
      console.log($scope.attribute)
      if ($scope.attribute.type !== 'ranking-size' && $scope.attribute.type !== 'ranking-color') {
        console.error('[ERROR] The type of attribute "' + $scope.attribute.name + '" is not "ranking-size" or "ranking-color".', $scope.attribute)
      }

      $scope.modalities = buildModalities()
      $scope.modalitiesSelection = {}
      $scope.modalities.forEach(function(mod){ $scope.modalitiesSelection[mod.value] = false })
      $scope.maxModCount = d3.max($scope.modalities.map(function(mod){ return mod.count }))
    }
  })
  
	$scope.networkNodeClick = function(nid) {
    console.log('Click on', nid)
  }

  $scope.downloadGEXF = function() {
    var g2 = $scope.networkData.g.copy()
    g2.dropNodes(g.nodes().filter(function(nid){ return !$scope.nodeFilter(nid) }))
  	var xml = Graph.library.gexf.write(g2);
    var blob = new Blob([xml], {'type':'text/gexf+xml;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + ".gexf");
  }

  $scope.downloadModalities = function() {
    var csv = csvBuilder.getModalities($scope.attribute.id)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Modalities of " + $scope.attribute.name + ".csv");
  }

  $scope.downloadStats = function() {
    var csv1 = csvBuilder.getModalityLinks($scope.attribute.id, $scope.modalitiesSelection)
    var blob = new Blob([csv1], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Links between modalities of " + $scope.attribute.name + ".csv");

    if ($scope.statsDetailLevel>1) {
      $timeout(function(){
        var csv2 = csvBuilder.getModalityNormalizedDensities($scope.attribute.id, $scope.modalitiesSelection)
        var blob = new Blob([csv2], {'type':'text/csv;charset=utf-8'});
        saveAs(blob, $scope.networkData.title + " - Norm densities between modalities of " + $scope.attribute.name + ".csv");
      }, 1000)
    }
  }

  $scope.downloadNodeList = function() {
  	var csv = csvBuilder.getNodes($scope.nodeFilter)
    var blob = new Blob([csv], {'type':'text/csv;charset=utf-8'});
    saveAs(blob, $scope.networkData.title + " - Nodes.csv");
  }

  function updateNodeFilter() {
    if ($scope.attribute) {
      if ($scope.attribute.modalities.some(function(mod){ return $scope.modalitiesSelection[mod.value]})) {
        $scope.nodeFilter = function(nid){
          return $scope.modalitiesSelection[$scope.networkData.g.getNodeAttribute(nid, $scope.attribute.id)]
        }
      } else {
        // All unchecked: show all
        $scope.nodeFilter = function(){ return true }
      }

      // Node filter imprint (used in URLs)
      $scope.nodeFilterImprint = $scope.attribute.modalities
        .map(function(mod){
          return $scope.modalitiesSelection[mod.value]
        })
        .join(',')
    }
  }

  function updateLocationPath() {
  	$location.search('panel', $scope.panel || null)
  	$location.search('q', $scope.search || null)
  }

  function buildModalities() {
    if ($scope.attribute.type == 'ranking-size') {
      return buildModalities_size()
    } else if ($scope.attribute.type == 'ranking-color') {
      return buildModalities_color()
    }
  }

  function buildModalities_size() {
    // Size scales
    var areaScale = scalesUtils.getAreaScale($scope.attribute.min, $scope.attribute.max, $scope.attribute.areaScaling.min, $scope.attribute.areaScaling.max, $scope.attribute.areaScaling.interpolation)
    var rScale = scalesUtils.getRScale()

    var minRadius = rScale($scope.attribute.areaScaling.min/$scope.attribute.areaScaling.max)
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
            var val = g.getNodeAttribute(nid, $scope.attribute.id)
            if (pmax == 1) {
              return val >= min && val <= max
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

    if ($scope.attribute.integer) {
      // Use the numbers from the actual nodes
      data = data.filter(function(d){ return d.count > 0 })
      data.forEach(function(d){
          var e = d3.extent(d.nodes, function(nid){ return g.getNodeAttribute(nid, $scope.attribute.id) })
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

  function buildModalities_color() {
    // Color scales
    var colorScale = scalesUtils.getColorScale($scope.attribute.min, $scope.attribute.max, $scope.attribute.colorScale)

    var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map(function(d){
        // Percent
        var pmin = d/10
        var pmax = (d+1)/10
        // Value
        var min = $scope.attribute.min + pmin * ($scope.attribute.max - $scope.attribute.min)
        var max = $scope.attribute.min + pmax * ($scope.attribute.max - $scope.attribute.min)
        return {
          pmin: pmin,
          pmax: pmax,
          min: min,
          max: max,
          average: (min + max) / 2,
          radius: 20,
          color: colorScale((min + max) / 2),
          nodes: g.nodes().filter(function(nid){
            var val = g.getNodeAttribute(nid, $scope.attribute.id)
            if (pmax == 1) {
              return val >= min && val <= max
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

    if ($scope.attribute.integer) {
      // Use the numbers from the actual nodes
      data = data.filter(function(d){ return d.count > 0 })
      data.forEach(function(d){
          var e = d3.extent(d.nodes, function(nid){ return g.getNodeAttribute(nid, $scope.attribute.id) })
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
})
