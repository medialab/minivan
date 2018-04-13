'use strict';

/* Services */

angular.module('app.components.matrix', [])

.directive('matrix', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    templateUrl: 'components/matrix.html',
    scope: {
      onNodeClick: '=',
      onEdgeClick: '=',
      nodeFilter: '=',
      selectedAttId:'='
    },
    link: function($scope, el, attrs) {
      $scope.headlineSize = 200
      $scope.cellSize = 16
    	$scope.networkData = networkData
      $scope.$watch('networkData.loaded', function(){
        if ($scope.networkData && $scope.networkData.loaded) {
          updateNodes()
          update()
        }
      })

      $scope.$watch('colorAttId', update)
      $scope.$watch('sizeAttId', update)
      $scope.$watch('selectedAttId', update)
      $scope.$watch('nodeFilter', updateNodes)

      // Scroll listening
      var scrollSource = el[0].querySelector('#scroll-source')
      scrollSource.addEventListener('scroll', function(e){
        var targetsX = el[0].querySelectorAll('.scroll-target-x')
        targetsX.forEach(function(n){
          n.childNodes[0].scrollLeft = Math.round(scrollSource.scrollLeft)
        })

        var targetsY = el[0].querySelectorAll('.scroll-target-y')
        targetsY.forEach(function(n){
          n.childNodes[0].scrollTop = Math.round(scrollSource.scrollTop)
        })

        updateViewBox()
      })
      $scope.$on('$destroy', function(){
        scrollSource.removeEventListener('scroll', redraw)
      })

      // Update view box on resize
      window.addEventListener('resize', updateViewBox)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', updateViewBox)
      })

      function updateNodes() {
        var g = $scope.networkData.g
        var nodeFilter = $scope.nodeFilter || function(d){return d}
        $scope.nodes = g.nodes()
          .filter(nodeFilter)

        $scope.viewSize = $scope.headlineSize + $scope.nodes.length * $scope.cellSize

        // Init view box
        updateViewBox()

        if ($scope.selectedAttId) {
          if ($scope.att) {
            if ($scope.att.type == 'partition') {
              var modalitiesIndex = {}
              $scope.att.modalities.forEach(function(mod, i){
                modalitiesIndex[mod.value] = i
              })
              $scope.nodes.sort(function(a, b){
                var aModIndex = modalitiesIndex[g.getNodeAttribute(a, $scope.selectedAttId)]
                var bModIndex = modalitiesIndex[g.getNodeAttribute(b, $scope.selectedAttId)]
                return aModIndex - bModIndex
              })
            } else if ($scope.att.type == 'ranking-size' || $scope.att.type == 'ranking-color') {
              $scope.nodes.sort(function(a, b){
                var aValue = +g.getNodeAttribute(a, $scope.selectedAttId)
                var bValue = +g.getNodeAttribute(b, $scope.selectedAttId)
                return bValue - aValue
              })
            }
          }
        } else {
          $scope.nodes.sort(function(a, b){
            var alabel = g.getNodeAttribute(a, 'label')
            var blabel = g.getNodeAttribute(b, 'label')
            if (alabel > blabel) return 1
            else if (alabel < blabel) return -1
            return 0
          })
        }
      }

      function update() {
        if ($scope.selectedAttId) {
          $scope.att = $scope.networkData.nodeAttributesIndex[$scope.selectedAttId]
          // Color
          if ($scope.att.type == 'partition') {
            var colorByModality = {}
            $scope.att.modalities.forEach(function(m){
              colorByModality[m.value] = m.color
            })
            var colorScale = function(val) {
              return colorByModality[val] || '#999'
            }
            $scope.getColor = function(nid) {
              return colorScale($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId))
            }
          } else if ($scope.att.type == 'ranking-color') {
            var colorScale = scalesUtils.getColorScale($scope.att.min, $scope.att.max, $scope.att.colorScale)
            var colorScale_string = function(val){ return colorScale(val).toString() }
            $scope.getColor = function(nid){ return colorScale_string($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId)) }
          } else {
            $scope.getColor = function(nid) {
              return '#999'
            }
          }

          // Size
          if ($scope.att.type == 'ranking-size') {
            var areaScale = scalesUtils.getAreaScale($scope.att.min, $scope.att.max, $scope.att.areaScaling.min, $scope.att.areaScaling.max, $scope.att.areaScaling.interpolation)
            var rScale = scalesUtils.getRScale()
            var rMax = rScale(1)
            $scope.getRadius = function(nid) {
              return rScale(areaScale($scope.networkData.g.getNodeAttribute(nid, $scope.selectedAttId))) * ($scope.cellSize/2 - 2) / rMax
            }
          } else {
            $scope.getRadius = function(nid) {
              return ($scope.cellSize/2 - 2)
            }
          }
        } else {
          $scope.getColor = function(nid) {
            return '#999'
          }
          $scope.getRadius = function(n) {
            return ($scope.cellSize/2 - 2)
          }
        }

        updateNodes()
      }

      function updateViewBox() {
        var scrollSource = el[0].querySelector('#scroll-source')
        $scope.viewBox = {
          x: scrollSource.scrollLeft / ($scope.viewSize - $scope.headlineSize),
          y: scrollSource.scrollTop / ($scope.viewSize - $scope.headlineSize),
          w: (el[0].offsetWidth - $scope.headlineSize) / ($scope.viewSize - $scope.headlineSize),
          h: (el[0].offsetHeight - $scope.headlineSize) / ($scope.viewSize - $scope.headlineSize)
        }
      }

    }
  }
})

.directive('matrixSvg', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'E',
    template: '<small style="opacity:0.5;">loading</small>',
    scope: {
      nodes: '='
    },
    link: function($scope, el, attrs) {
      
      $scope.headlineSize = 200
      $scope.cellSize = 16

      $scope.networkData = networkData
      $scope.$watch('networkData.loaded', function(){
        if ($scope.networkData && $scope.networkData.loaded) {
          redraw()
        }
      })

      $scope.$watch('nodes', redraw)

      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      function redraw() {
        if ($scope.nodes !== undefined){
          $timeout(function(){
            el.html('');
            draw(el[0])
          })
        }
      }

      function draw(container) {

        var settings = {}
        settings.display_labels = true

        var g = $scope.networkData.g
        var data = []
        $scope.nodes.forEach(function(n1id){
          $scope.nodes.forEach(function(n2id){
            var e = g.edge(n1id, n2id)
            if (e) {
              data.push({source:n1id, target:n2id})
            }
          })
        })
        
        var margin = {top: $scope.headlineSize, right: 0, bottom: 0, left: $scope.headlineSize}
        var width = $scope.nodes.length * $scope.cellSize
        var height = width // square space

        var x = d3.scaleBand()
          .range([0, width])
          .domain($scope.nodes)

        var ratio = Math.min(container.offsetWidth, container.offsetHeight)/(width + margin.left + margin.right)

        var svg = d3.select(container).append("svg")
            .attr("width", Math.floor(ratio * (width + margin.left + margin.right)))
            .attr("height", Math.floor(ratio * (height + margin.top + margin.bottom)))
          .append("g")
            .attr("transform", "scale(" +ratio+ ", " +ratio+ ") translate(" + margin.left + "," + margin.top + ")");

        // append the cells
        var cells = svg.selectAll('.cell')
            .data(data)

        cells.enter().append('rect')
            .attr('class', 'cell')
            .attr('width', $scope.cellSize )
            .attr('height', $scope.cellSize )
            .attr('x', function(d) { return x(d.target); })
            .attr('y', function(d) { return x(d.source); })
            .attr('fill', 'rgba(40, 40, 40, 0.8)')

      }
     
    }
  }
})

.directive('matrixViewBox', function($timeout, scalesUtils){
  return {
    restrict: 'E',
    template: '',
    scope: {
      viewBox: '='
    },
    link: function($scope, el, attrs) {
      
      $scope.headlineSize = 200
      $scope.cellSize = 16

      $scope.$watch('viewBox', redraw)

      function redraw() {
        if ($scope.viewBox) {
          $timeout(function(){
            el.html('');
            draw(el[0])
          })
        }
      }

      function draw(container) {

        var settings = {}
        settings.border_size = 3

        var margin = {top: 0, right: 0, bottom: 0, left: 0}
        var width = container.offsetWidth
        var height = width // square space

        var x = d3.scaleLinear()
          .range([0, width])
          .domain([0, 1])

        var svg = d3.select(container).append("svg")
            .attr("width", Math.floor(width + margin.left + margin.right))
            .attr("height", Math.floor(height + margin.top + margin.bottom))
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append('rect')
            .attr('x', x($scope.viewBox.x) - settings.border_size/2)
            .attr('y', x($scope.viewBox.y) - settings.border_size/2)
            .attr('width', x($scope.viewBox.w) + settings.border_size)
            .attr('height', x($scope.viewBox.h) + settings.border_size)
            .attr('fill', 'none')
            .attr('stroke', '#239dfe')
            .attr('stroke-width', settings.border_size)

      }
     
    }
  }
})

.directive('matrixLine', function(
    networkData
  ){
    return {
      restrict: 'A',
      scope: {
        nodeId: '=',
        nodes: '=',
        printMode: '=',
        att: '=',
        getRadius: '=',
        getColor: '=',
        cellSize: '=',
        headlineSize: '='
      },
      templateUrl: 'components/matrixLine.html',
      link: function($scope, el, attrs) {
        $scope.$watch('nodeId', function(){
          $scope.node = networkData.g.getNodeAttributes($scope.nodeId)
          $scope.edges = $scope.nodes.map(function(nid){
            return networkData.g.edge($scope.nodeId, nid)
          })
        })
      }
    }
  })
