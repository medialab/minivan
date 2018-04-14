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
      selectedAttId:'=',
      detailLevel: '='
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

      var scrollSource

      $scope.$watch('colorAttId', update)
      $scope.$watch('sizeAttId', update)
      $scope.$watch('selectedAttId', update)
      $scope.$watch('nodeFilter', updateNodes)
      $scope.$watch('minimapViewBox', updateScrollSource)
      $scope.$watch('detailLevel', function(){
        if ($scope.detailLevel == 2) {
          // Update view box on resize
          window.addEventListener('resize', updateViewBox)
          $scope.$on('$destroy', function(){
            window.removeEventListener('resize', updateViewBox)
          })
          updateScrollListening()
          updateViewBox()
        } else {
          try {
            window.removeEventListener('resize', updateViewBox)
            scrollSource.removeEventListener('scroll', updateScroll)
          } catch(e) {}
        }
      })

      function updateScrollListening() {
        scrollSource = el[0].querySelector('#scroll-source')
        if (scrollSource) {
          scrollSource.addEventListener('scroll', updateScroll)
          $scope.$on('$destroy', function(){
            scrollSource.removeEventListener('scroll', updateScroll)
          })
        }
      }

      function updateScroll() {
        var targetsX = el[0].querySelectorAll('.scroll-target-x')
        targetsX.forEach(function(n){
          n.childNodes[0].scrollLeft = Math.round(scrollSource.scrollLeft)
        })

        var targetsY = el[0].querySelectorAll('.scroll-target-y')
        targetsY.forEach(function(n){
          n.childNodes[0].scrollTop = Math.round(scrollSource.scrollTop)
        })
        updateViewBox()
      }

      function updateScrollSource(){
        if ($scope.minimapViewBox) {
          scrollSource.scrollLeft = $scope.minimapViewBox.x * ($scope.viewSize - $scope.headlineSize)
          scrollSource.scrollTop = $scope.minimapViewBox.y * ($scope.viewSize - $scope.headlineSize)
          updateScroll()
        }
      }

      function updateNodes() {
        var g = $scope.networkData.g
        var nodeFilter = $scope.nodeFilter || function(d){return d}
        $scope.nodes = g.nodes()
          .filter(nodeFilter)

        $scope.viewSize = $scope.headlineSize + $scope.nodes.length * $scope.cellSize

        // Init view box
        updateViewBox()

        // Compute edges index
        $scope.edgeIndex = {}
        $scope.nodes.forEach(function(nid){
          $scope.edgeIndex[nid] = {}
        })
        g.edges().forEach(function(eid){
          var nsid = g.source(eid)
          var ntid = g.target(eid)
          if ($scope.edgeIndex[nsid] && $scope.edgeIndex[ntid]){
            $scope.edgeIndex[nsid][ntid] = eid
          }
        })

        // Nodes sort
        if (!$scope.selectedAttId || $scope.networkData.loaded) {
          scalesUtils.sortNodes($scope.nodes, $scope.selectedAttId)
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
        scrollSource = el[0].querySelector('#scroll-source')
        if (scrollSource) {
          $scope.viewBox = {
            x: scrollSource.scrollLeft / ($scope.viewSize - $scope.headlineSize),
            y: scrollSource.scrollTop / ($scope.viewSize - $scope.headlineSize),
            w: (el[0].offsetWidth - $scope.headlineSize) / ($scope.viewSize - $scope.headlineSize),
            h: (el[0].offsetHeight - $scope.headlineSize) / ($scope.viewSize - $scope.headlineSize)
          }
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
      nodes: '=',
      edgeIndex: '='
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
      $scope.$watch('edgeIndex', redraw)

      window.addEventListener('resize', redraw)
      $scope.$on('$destroy', function(){
        window.removeEventListener('resize', redraw)
      })

      function redraw() {
        if ($scope.nodes !== undefined && $scope.edgeIndex !== undefined){
          $timeout(function(){
            el.html('');
            draw(el[0])
          })
        }
      }

      function draw(container) {

        var settings = {}
        settings.display_labels = false

        var g = $scope.networkData.g
        var data = []
        var nsid, ntid
        for (nsid in $scope.edgeIndex) {
          for (ntid in $scope.edgeIndex[nsid]) {
            data.push({source:nsid, target:ntid})
          }
        }
        
        var margin = {top: 0, right: 0, bottom: 0, left: 0}
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

        // Background
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width )
            .attr('height', height )
            .attr('fill', 'rgba(238, 238, 238, 0.3)')

        // append the cells
        var cells = svg.selectAll('.cell')
            .data(data)

        cells.enter().append('rect')
            .attr('class', 'cell')
            .attr('x', function(d) { return x(d.target); })
            .attr('y', function(d) { return x(d.source); })
            .attr('width', $scope.cellSize )
            .attr('height', $scope.cellSize )
            .attr('fill', 'rgba(0, 0, 0, 0.9)')

      }
     
    }
  }
})

.directive('matrixViewBox', function($timeout, scalesUtils){
  return {
    restrict: 'E',
    template: '',
    scope: {
      viewBox: '=',
      viewBoxDragged: '='
    },
    link: function($scope, el, attrs) {
      
      $scope.headlineSize = 200
      $scope.cellSize = 16

      $scope.$watch('viewBox', redraw)

      // Click interactions
      var drag = false
      el[0].addEventListener('click', moveViewBox)
      el[0].addEventListener('touchmove', moveViewBox)
      el[0].addEventListener('mousedown', startDrag)
      el[0].addEventListener('mouseup', stopDrag)
      el[0].addEventListener('mouseleave', stopDrag)
      el[0].addEventListener('mousemove', moveViewBoxIfDrag)
      $scope.$on('$destroy', function(){
        el[0].removeEventListener('click', moveViewBox)
        el[0].removeEventListener('touchmove', moveViewBox)
        el[0].removeEventListener('mousedown', startDrag)
        el[0].removeEventListener('mouseup', stopDrag)
        el[0].removeEventListener('mouseleave', stopDrag)
        el[0].removeEventListener('mousemove', moveViewBoxIfDrag)
      })
      function startDrag(e){ drag = true; e.preventDefault ? e.preventDefault() : e.returnValue = false }
      function stopDrag(){ drag = false }
      function moveViewBoxIfDrag(e){ if(drag){ moveViewBox(e) } }
      function moveViewBox(e) {
        var x = e.offsetX / $scope.headlineSize - $scope.viewBox.w/2
        var y = e.offsetY / $scope.headlineSize - $scope.viewBox.h/2
        x = Math.max(0, Math.min(1 - $scope.viewBox.w, x))
        y = Math.max(0, Math.min(1 - $scope.viewBox.h, y))
        $timeout(function(){
          $scope.viewBoxDragged = {
            x: x,
            y: y,
            w: $scope.viewBox.w,
            h: $scope.viewBox.h
          }
        })
      }

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
        edgeIndex: '=',
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
        })
      }
    }
  })
