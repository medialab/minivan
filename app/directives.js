'use strict'

/* Services */

angular
  .module('app.directives', [])

  .directive('toolbarViewmodeItem', function() {
    return {
      restrict: 'E',
      scope: {
        viewmodeTarget: '=',
        viewmode: '=',
        url: '=',
        icon: '=',
        label: '='
      },
      templateUrl: 'components/toolbarViewmodeItem.html',
      link: function($scope, el, attrs) {
        $scope.go = function() {
          $scope.viewmode = $scope.viewmodeTarget
        }
      }
    }
  })

  .directive('printButtonOverlay', function() {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'components/printButtonOverlay.html',
      link: function($scope, el, attrs) {
        $scope.print = function() {
          window.print()
        }
      }
    }
  })

  .directive('leftSideBar', function(dataLoader) {
    return {
      restrict: 'E',
      scope: {
        title: '='
      },
      templateUrl: 'components/leftSideBar.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
      }
    }
  })

  .directive('projectTitleBar', function($location, dataLoader) {
    return {
      restrict: 'E',
      scope: {
        title: '='
      },
      templateUrl: 'components/projectTitleBar.html',
      link: function($scope, el, attrs) {
        $scope.goHome = function() {
          $location.url('/?' + dataLoader.getLocation())
        }
      }
    }
  })

  .directive('nodeListElement', function() {
    return {
      restrict: 'A',
      scope: {
        node: '=',
        printMode: '=',
        att: '=',
        getRadius: '=',
        getColor: '='
      },
      templateUrl: 'components/nodeListElement.html',
      link: function($scope, el, attrs) {}
    }
  })

  .directive('attributeListElement', function(dataLoader) {
    return {
      restrict: 'A',
      scope: {
        att: '=',
        obj: '=',
        panel: '=',
        printMode: '=',
        detailLevel: '=',
        selectedAttId: '='
      },
      templateUrl: 'components/attributeListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
        $scope.isSelected = false
        $scope.$watch('selectedAttId', function() {
          $scope.isSelected =
            $scope.att && $scope.att.id && $scope.selectedAttId == $scope.att.id
        })
        $scope.selectAtt = function() {
          if (!$scope.printMode) {
            if ($scope.selectedAttId == $scope.att.id) {
              $scope.isSelected = false
              $scope.selectedAttId = undefined
            } else {
              $scope.isSelected = true
              $scope.selectedAttId = $scope.att.id
            }
          }
        }
      }
    }
  })

  .directive('modalityPartitionListElement', function(dataLoader) {
    return {
      restrict: 'A',
      scope: {
        attributeId: '=',
        panel: '=',
        mod: '=',
        maxModCount: '=',
        printMode: '=',
        detailLevel: '=',
        isSelected: '='
      },
      templateUrl: 'components/modalityPartitionListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
        $scope.toggleSelection = function() {
          $scope.isSelected = !$scope.isSelected
        }
        $scope.networkData = dataLoader.get()
        $scope.labelThreshold = 40
      }
    }
  })

  .directive('modalityRankingListElement', function(dataLoader) {
    return {
      restrict: 'A',
      scope: {
        mod: '=',
        att: '=',
        panel: '=',
        maxModCount: '=',
        printMode: '=',
        detailLevel: '=',
        isSelected: '='
      },
      templateUrl: 'components/modalityRankingListElement.html',
      link: function($scope, el, attrs) {
        $scope.bundleLocation = dataLoader.getLocation()
        $scope.toggleSelection = function() {
          $scope.isSelected = !$scope.isSelected
        }
        $scope.networkData = dataLoader.get()
        $scope.labelThreshold = 40
      }
    }
  })

  .directive('vColorKey', function($timeout, dataLoader, scalesUtils) {
    return {
      restrict: 'E',
      template: '<small style="opacity:0.5;">.<br>.<br>.</small>',
      scope: {
        att: '='
      },
      link: function($scope, el, attrs) {
        $scope.$watch('att', redraw, true)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function() {
          window.removeEventListener('resize', redraw)
        })

        var g = dataLoader.get().g

        var container = el[0]

        function redraw() {
          $timeout(function() {
            container.innerHTML = ''

            var settings = {}

            // Canvas size
            settings.oversampling = 2
            settings.width = container.offsetWidth
            settings.height = container.offsetHeight

            var y
            var width = settings.oversampling * settings.width
            var height = settings.oversampling * settings.height

            // Create the canvas
            container.innerHTML =
              '<div style="width:' +
              settings.width +
              '; height:' +
              settings.height +
              ';"><canvas id="cnvs" width="' +
              width +
              '" height="' +
              height +
              '" style="width: 100%;"></canvas></div>'
            var canvas = container.querySelector('#cnvs')
            var ctx = canvas.getContext('2d')

            // Color scale
            var getColor = scalesUtils.getColorScale(
              height,
              0,
              $scope.att.colorScale,
              $scope.att.invertScale,
              $scope.att.truncateScale
            )

            for (y = 0; y < height; y++) {
              ctx.beginPath()
              ctx.lineCap = 'square'
              ctx.strokeStyle = getColor(y)
              ctx.fillStyle = 'rgba(0, 0, 0, 0)'
              ctx.lineWidth = 1
              ctx.moveTo(0, y)
              ctx.lineTo(width, y)
              ctx.stroke()
              ctx.closePath()
            }
          })
        }
      }
    }
  })

  // Thanks HomerJam!
  // From https://gist.github.com/homerjam/aec5bb1c68a3bfb0ae95c1b83344a4cf
  .directive('mdChipDraggable', function() {
    return {
      restrict: 'A',
      scope: {},
      bindToController: true,
      controllerAs: 'vm',
      controller: [
        '$document',
        '$scope',
        '$element',
        '$timeout',
        function($document, $scope, $element, $timeout) {
          var vm = this

          var options = {
            axis: 'horizontal'
          }
          var handle = $element[0]
          var draggingClassName = 'dragging'
          var droppingClassName = 'dropping'
          var droppingBeforeClassName = 'dropping--before'
          var droppingAfterClassName = 'dropping--after'
          var dragging = false
          var preventDrag = false
          var dropPosition
          var dropTimeout

          var move = function(from, to) {
            this.splice(to, 0, this.splice(from, 1)[0])
          }

          $element = angular.element($element[0].closest('md-chip'))

          $element.attr('draggable', true)

          $element.on('mousedown', function(event) {
            if (event.target !== handle) {
              preventDrag = true
            }
          })

          $document.on('mouseup', function() {
            preventDrag = false
          })

          $element.on('dragstart', function(event) {
            if (preventDrag) {
              event.preventDefault()
            } else {
              dragging = true

              $element.addClass(draggingClassName)

              var dataTransfer =
                event.dataTransfer || event.originalEvent.dataTransfer

              dataTransfer.effectAllowed = 'copyMove'
              dataTransfer.dropEffect = 'move'
              dataTransfer.setData(
                'text/plain',
                $scope.$parent.$mdChipsCtrl.items.indexOf($scope.$parent.$chip)
              )
            }
          })

          $element.on('dragend', function() {
            dragging = false

            $element.removeClass(draggingClassName)
          })

          var dragOverHandler = function(event) {
            if (dragging) {
              return
            }

            event.preventDefault()

            var bounds = $element[0].getBoundingClientRect()

            var props = {
              width: bounds.right - bounds.left,
              height: bounds.bottom - bounds.top,
              x: (event.originalEvent || event).clientX - bounds.left,
              y: (event.originalEvent || event).clientY - bounds.top
            }

            var offset = options.axis === 'vertical' ? props.y : props.x
            var midPoint =
              (options.axis === 'vertical' ? props.height : props.width) / 2

            $element.addClass(droppingClassName)

            if (offset < midPoint) {
              dropPosition = 'before'
              $element.removeClass(droppingAfterClassName)
              $element.addClass(droppingBeforeClassName)
            } else {
              dropPosition = 'after'
              $element.removeClass(droppingBeforeClassName)
              $element.addClass(droppingAfterClassName)
            }
          }

          var dropHandler = function(event) {
            event.preventDefault()

            var droppedItemIndex = parseInt(
              (event.dataTransfer || event.originalEvent.dataTransfer).getData(
                'text/plain'
              ),
              10
            )
            var currentIndex = $scope.$parent.$mdChipsCtrl.items.indexOf(
              $scope.$parent.$chip
            )
            var newIndex = null

            if (dropPosition === 'before') {
              if (droppedItemIndex < currentIndex) {
                newIndex = currentIndex - 1
              } else {
                newIndex = currentIndex
              }
            } else {
              if (droppedItemIndex < currentIndex) {
                newIndex = currentIndex
              } else {
                newIndex = currentIndex + 1
              }
            }

            // prevent event firing multiple times in firefox
            $timeout.cancel(dropTimeout)
            dropTimeout = $timeout(function() {
              dropPosition = null

              move.apply($scope.$parent.$mdChipsCtrl.items, [
                droppedItemIndex,
                newIndex
              ])

              $scope.$apply(function() {
                $scope.$emit('mdChipDraggable:change', {
                  collection: $scope.$parent.$mdChipsCtrl.items,
                  item: $scope.$parent.$mdChipsCtrl.items[droppedItemIndex],
                  from: droppedItemIndex,
                  to: newIndex
                })
              })

              $element.removeClass(droppingClassName)
              $element.removeClass(droppingBeforeClassName)
              $element.removeClass(droppingAfterClassName)

              $element.off('drop', dropHandler)
            }, 1000 / 16)
          }

          $element.on('dragenter', function() {
            if (dragging) {
              return
            }

            $element.off('dragover', dragOverHandler)
            $element.off('drop', dropHandler)

            $element.on('dragover', dragOverHandler)
            $element.on('drop', dropHandler)
          })

          $element.on('dragleave', function(event) {
            $element.removeClass(droppingClassName)
            $element.removeClass(droppingBeforeClassName)
            $element.removeClass(droppingAfterClassName)
          })
        }
      ]
    }
  })
