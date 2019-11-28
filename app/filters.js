'use strict'

/* Services */

angular
  .module('app.filters', [])

  .filter('defined', function() {
    return function(item) {
      return item !== undefined
    }
  })

  .filter('equals', function() {
    return angular.equals
  })

  .filter('simpleAttType', function() {
    return function(attType) {
      if (attType == 'ranking-size' || attType == 'ranking-color')
        return 'ranking'
      else return attType
    }
  })

  .filter('encodeURIComponent', function() {
    return function(txt) {
      return encodeURIComponent(txt)
    }
  })

  .filter('cameraX', function() {
    return function(renderer) {
      if (!renderer) {
        return
      }
      return renderer.getCamera().getState().x
    }
  })

  .filter('cameraY', function() {
    return function(renderer) {
      if (!renderer) {
        return
      }
      return renderer.getCamera().getState().y
    }
  })

  .filter('cameraRatio', function() {
    return function(renderer) {
      if (!renderer) {
        return
      }
      return renderer.getCamera().getState().ratio
    }
  })

  .filter('values', function() {
    return function(o) {
      if (!o) return

      return Object.values(o)
    }
  })
