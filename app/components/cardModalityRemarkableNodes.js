'use strict';

angular.module('app.components.cardModalityRemarkableNodes', [])

.directive('cardModalityRemarkableNodes', function($timeout, networkData, scalesUtils){
  return {
    restrict: 'A',
    templateUrl: 'components/cardModalityRemarkableNodes.html',
    scope: {
      attId: '=',
      modValue: '=',
      detailLevel: '=',
      printMode: '='
    },
    link: function($scope, el, attrs) {
      var g = networkData.g
      console.log(networkData)
      $scope.attribute = networkData.nodeAttributesIndex[$scope.attId]
      $scope.modality = $scope.attribute.modalitiesIndex[$scope.modValue]
      $scope.modalityFlow = $scope.attribute.data.modalityFlow[$scope.modValue][$scope.modValue]
      $scope.topCut
      $scope.sortedNodes = {
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

      $scope.$watch('detailLevel', buildAllSortedNodes)

      function buildAllSortedNodes(){
        $scope.topCut = ($scope.detailLevel > 1) ? (10) : (3)
        if (g.type == 'directed' || g.type == 'mixed') {
          $scope.sortedNodes.inside.citedFromInside = buildSortedNodes('INSIDE', 'CITED_FROM', 'INSIDE')
          $scope.sortedNodes.inside.citedFromOutside = buildSortedNodes('INSIDE', 'CITED_FROM', 'OUTSIDE')
          $scope.sortedNodes.inside.pointingToInside = buildSortedNodes('INSIDE', 'POINTING_TO', 'INSIDE')
          $scope.sortedNodes.inside.pointingToOutside = buildSortedNodes('INSIDE', 'POINTING_TO', 'OUTSIDE')
          $scope.sortedNodes.outside.citedFromInside = buildSortedNodes('OUTSIDE', 'CITED_FROM', 'INSIDE')
          // $scope.sortedNodes.outside.citedFromOutside = buildSortedNodes('OUTSIDE', 'CITED_FROM', 'OUTSIDE')
          $scope.sortedNodes.outside.pointingToInside = buildSortedNodes('OUTSIDE', 'POINTING_TO', 'INSIDE')
          // $scope.sortedNodes.outside.pointingToOutside = buildSortedNodes('OUTSIDE', 'POINTING_TO', 'OUTSIDE')
        }
        if (g.type == 'undirected' || g.type == 'mixed') {
          $scope.sortedNodes.inside.connectedInside = buildSortedNodes('INSIDE', 'CONNECTED', 'INSIDE')
          $scope.sortedNodes.inside.connectedOutside = buildSortedNodes('INSIDE', 'CONNECTED', 'OUTSIDE')
          $scope.sortedNodes.outside.connectedInside = buildSortedNodes('OUTSIDE', 'CONNECTED', 'INSIDE')
          // $scope.sortedNodes.outside.connectedOutside = buildSortedNodes('OUTSIDE', 'CONNECTED', 'OUTSIDE')
        }
      }

      function buildSortedNodes(pool, mode, extremity_pool) {
        var result = g.nodes()
        var pool_condition
        var extremity_pool_condition

        // Filter pool
        if (pool == 'INSIDE') {
          pool_condition = function(nid) {
            return g.getNodeAttribute(nid, $scope.attribute.id) == $scope.modality.value
          }
        } else {
          pool_condition = function(nid) {
            return g.getNodeAttribute(nid, $scope.attribute.id) != $scope.modality.value
          }
        }
        result = result.filter(function(nid){
          return pool_condition(nid)
        })

        // Results items
        result = result.map(function(nid){
          return {
            id: nid,
            node: g.getNodeAttributes(nid)
          }
        })

        // Compute edge scores
        if (extremity_pool == 'INSIDE') {
          extremity_pool_condition = function(nid) {
            return g.getNodeAttribute(nid, $scope.attribute.id) == $scope.modality.value
          }
        } else {
          extremity_pool_condition = function(nid) {
            return g.getNodeAttribute(nid, $scope.attribute.id) != $scope.modality.value
          }
        }
        if (mode == 'CITED_FROM') {
          result.forEach(function(item){
            item.score = g.inEdges(item.id)
              .filter(function(eid){
                return extremity_pool_condition(g.source(eid))
              })
              .length
          })
        } else if (mode == 'POINTING_TO') {
          result.forEach(function(item){
            item.score = g.outEdges(item.id)
              .filter(function(eid){
                return extremity_pool_condition(g.target(eid))
              })
              .length
          })
        } else {
          result.forEach(function(item){
            item.score = g.edges(item.id)
              .filter(function(eid){
                return extremity_pool_condition(g.opposite(eid))
              })
              .length
          })
        }
        result = result.filter(function(item){ return item.score > 0 }) // Ignore if 0 edges
        result.sort(function(a, b){
          return b.score - a.score
        })

        if (result.length > $scope.topCut) {
          result = result.filter(function(item, i){
            return i < $scope.topCut || item.score == result[$scope.topCut - 1].score
          })
        }
        return result
      }
	  }
  }
})
