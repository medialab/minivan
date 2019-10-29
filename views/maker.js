'use strict'

angular
  .module('app.maker', ['ngRoute'])

  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/maker', {
        templateUrl: 'views/maker.html',
        controller: 'MakerController'
      })
    }
  ])

  .controller('MakerController', function(
    $scope,
    dataLoader,
    netBundleManager,
    FileLoader,
    droppable,
    $mdToast
  ) {
    // DEV MODE: auto load
    // netBundleManager.importBundle('data/BUNDLE - Sample Rio+20.json', initBundle)
    $scope.$watch('networkData.loaded', function() {
      if ($scope.networkData && $scope.networkData.loaded) {
        $scope.infered = minivan.performTypeInference($scope.networkData.g)
      }
    })

    $scope.$watch('att.type', function(newVal, oldVal) {
      if ($scope.att && $scope.att.type && oldVal !== undefined) {
        const nodeOrEdge = $scope.attMode + 'Attributes'
        const newBundle = minivan.buildBundle($scope.networkData.g, {
          model: {
            [nodeOrEdge]: [
              $scope.networkData[nodeOrEdge + 'Index'][$scope.att.slug]
            ]
          }
        })
        const indexOf = $scope.networkData.model[nodeOrEdge].findIndex(function(
          attribute
        ) {
          return attribute.slug === $scope.att.slug
        })
        $scope.att = newBundle.model[nodeOrEdge][0]
        $scope.networkData.model[nodeOrEdge][indexOf] = $scope.att
        $scope.networkData[nodeOrEdge + 'Index'][$scope.att.slug] = $scope.att
      }
    })

    $scope.attMode = undefined
    $scope.attId = undefined
    $scope.attData = undefined
    $scope.att = undefined
    $scope.colorScales = netBundleManager.colorScales
    $scope.maxColors = 5
    $scope.defaultColor = '#FFF'
    $scope.colorPalettes = [
      {
        name: 'Default',
        settings: {
          cmin: 30,
          cmax: 60,
          lmin: 60,
          lmax: 80
        }
      },
      {
        name: 'Light',
        settings: {
          cmin: 25,
          cmax: 60,
          lmin: 80,
          lmax: 100
        }
      },
      {
        name: 'Dark',
        settings: {
          cmin: 25,
          cmax: 60,
          lmin: 40,
          lmax: 80
        }
      },
      {
        name: 'Colorful',
        settings: {
          cmin: 60,
          cmax: 90,
          lmin: 30,
          lmax: 95
        }
      },
      {
        name: 'Dull',
        settings: {
          cmin: 10,
          cmax: 50,
          lmin: 60,
          lmax: 100
        }
      }
    ]
    $scope.paletteIndex = 0

    $scope.downloadBundle = function() {
      var json = netBundleManager.exportBundle($scope.networkData)
      var blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      saveAs(blob, 'BUNDLE - ' + $scope.networkData.title + '.json')
    }

    // File upload interactions
    $scope.uploadFile = function() {
      document.querySelector('input#hidden-upload-file-input').click()
    }

    $scope.setUploadFile = function(element) {
      var i
      for (i = 0; i < element.files.length; i++) {
        var file = element.files[i]
        $scope.readUploadFile(file)
        return // We just expect one file, so we stop here.
      }
    }

    $scope.readUploadFile = function(file) {
      var fileName = file.name
      var fileLoader = new FileLoader()
      fileLoader.read(file, {
        onloadstart: function(evt) {
          $scope.uploadingMessage = 'UPLOADING...'
          $scope.uploadingDropClass = 'loading'
          $scope.$apply()
        },
        onprogress: function(evt) {
          // evt is a ProgressEvent
          if (evt.lengthComputable) {
            $scope.uploadingMessage =
              'UPLOADING ' + Math.round((evt.loaded / evt.total) * 100) + '%'
            $scope.$apply()
          }
        },
        onload: function(evt) {
          var target = evt.target || evt.srcElement

          if (target.result) {
            try {
              var success = parseUpload(target.result, fileName)
              if (success) {
                uploadParsingSuccess()
              } else {
                uploadParsingFail(fileName)
              }
            } catch (e) {
              console.error(e)
              uploadParsingFail(fileName)
            }
          } else {
            uploadParsingFail(fileName)
          }
        }
      })
    }

    // Make the text area droppable
    $scope.initDroppable = function() {
      droppable(
        document.getElementById('file-uploader'),
        'uploadingDropClass',
        $scope,
        $scope.readUploadFile
      )
    }

    $scope.editNodeAttribute = function(attribute) {
      $scope.attMode = 'node'
      $scope.attData = attribute
      $scope.attId = attribute.key
      $scope.att = attribute
      $scope.originalAtt = angular.copy($scope.att)
    }

    $scope.editEdgeAttribute = function(attribute) {
      $scope.attMode = 'edge'
      $scope.attData = $scope.edgeAttributesIndex[attribute.key]
      $scope.attId = attribute.key
      $scope.att = attribute
      $scope.originalAtt = angular.copy($scope.att)
    }

    $scope.cancelEditAttribute = function() {
      if ($scope.attMode === 'node') {
        var index = $scope.networkData.model.nodeAttributes.indexOf($scope.att)
        if (index >= 0) {
          $scope.networkData.model.nodeAttributes[index] = $scope.originalAtt
          $scope.networkData.nodeAttributesIndex[$scope.originalAtt.key] =
            $scope.originalAtt
        }
      } else if ($scope.attMode) {
        var index = $scope.networkData.model.edgeAttributes.indexOf($scope.att)
        if (index >= 0) {
          $scope.networkData.model.edgeAttributes[index] = $scope.originalAtt
          $scope.networkData.edgeAttributesIndex[$scope.originalAtt.key] =
            $scope.originalAtt
        }
      }
      $scope.attMode = undefined
      $scope.attData = undefined
      $scope.attId = undefined
      $scope.att = undefined
      $scope.originalAtt = undefined
    }

    $scope.validateEditAttribute = function() {
      $scope.attMode = undefined
      $scope.attData = undefined
      $scope.attId = undefined
      $scope.att = undefined
    }

    $scope.modalityUp = function(i) {
      var m = $scope.att.modalitiesOrder[i - 1]
      $scope.att.modalitiesOrder[i - 1] = $scope.att.modalitiesOrder[i]
      $scope.att.modalitiesOrder[i] = m
    }

    $scope.modalityDown = function(i) {
      var m = $scope.att.modalitiesOrder[i + 1]
      $scope.att.modalitiesOrder[i + 1] = $scope.att.modalitiesOrder[i]
      $scope.att.modalitiesOrder[i] = m
    }

    $scope.repaint = function() {
      var colors = netBundleManager.getColors(
        Math.min($scope.maxColors, Object.keys($scope.att.modalities).length),
        undefined,
        $scope.colorPalettes[$scope.paletteIndex].settings
      )
      $scope.att.modalitiesOrder.forEach(function(key, i) {
        $scope.att.modalities[key].color = colors[i] || $scope.defaultColor
      })
    }

    /// Functions
    function uploadParsingSuccess() {
      $scope.uploadingMessage = ''
      $scope.uploadingDropClass = ''
      $scope.$apply()
    }

    function uploadParsingFail(fileName) {
      $scope.uploadingMessage = ''
      $scope.uploadingDropClass = ''
      $scope.$apply()
      showSimpleToast('/!\\ ' + fileName + ' PARSING FAILED')
    }

    function showSimpleToast(message) {
      $mdToast.show(
        $mdToast
          .simple()
          .textContent(message)
          .hideDelay(3000)
      )
    }

    // Init at bundle build
    function initBundle(bundle) {
      $scope.g = bundle.g
      dataLoader.set(bundle)
      $scope.networkData = bundle
      $scope.nodeAttributesIndex = bundle.nodeAttributesIndex
      $scope.edgeAttributesIndex = bundle.edgeAttributesIndex
      $scope.networkData.loaded = true
      // It's possible, when loading an existing bundle, that some attributes registered in the
      // node attributes index or edge attribute index are not listed in the bundle.
      // This may cause some issues, so we create them with no type, as this means that
      // they are not published.
    }

    // Parsing functions
    function parseUpload(data, fileName) {
      if (!fileName) {
        return false
      }
      if (fileName.substr(-5).toUpperCase() == '.GEXF') {
        var title = netBundleManager._toTitleCase(
          fileName
            .substring(fileName.lastIndexOf('/') + 1)
            .replace('_', ' ')
            .replace(/\..*/gi, '')
        )
        netBundleManager.parseGEXF(data, title, initBundle)
      } else if (
        fileName.substr(-5).toUpperCase() == '.JSON' ||
        fileName.substr(-3).toUpperCase() == '.JS'
      ) {
        netBundleManager.parseBundle(JSON.parse(data), initBundle)
      } else {
        return false
      }
      return true
    }
  })

  .factory('FileLoader', [
    '$window',
    function(win) {
      return function() {
        this.read = function(file, settings) {
          this.reader = new FileReader()

          // Settings
          if (settings.onerror === undefined)
            this.reader.onerror = this.errorHandler
          else this.reader.onerror = settings.onerror

          if (settings.onprogress === undefined)
            this.reader.onprogress = function(evt) {
              console.log('file loader: progress ', evt)
            }
          else this.reader.onprogress = settings.onprogress

          if (settings.onabort === undefined)
            this.reader.onabort = function(e) {
              alert('File read cancelled')
            }
          else this.reader.onabort = settings.onabort

          if (settings.onloadstart === undefined)
            this.reader.onloadstart = function(evt) {
              console.log('file loader: Load start ', evt)
            }
          else this.reader.onloadstart = settings.onloadstart

          if (settings.onload === undefined)
            this.reader.onload = function(evt) {
              console.log('file loader: Loading complete ', evt)
            }
          else this.reader.onload = settings.onload

          this.reader.readAsText(file)
        }

        this.abortRead = function() {
          this.reader.abort()
        }

        this.reader = undefined

        this.errorHandler = function(evt) {
          var target = evt.target || evt.srcElement
          switch (target.error.code) {
            case target.error.NOT_FOUND_ERR:
              alert('File Not Found!')
              break
            case target.error.NOT_READABLE_ERR:
              alert('File is not readable')
              break
            case target.error.ABORT_ERR:
              break // noop
            default:
              alert('An error occurred reading this file.')
          }
        }
      }
    }
  ])

  .factory('droppable', [
    function() {
      return function(droppable, classReference, $scope, callback) {
        if (droppable === undefined || droppable == null) return

        //============== DRAG & DROP =============
        // adapted from http://jsfiddle.net/danielzen/utp7j/

        // init event handlers
        function dragEnterLeave(evt) {
          evt.stopPropagation()
          evt.preventDefault()
          $scope.$apply(function() {
            $scope[classReference] = ''
          })
        }
        droppable.addEventListener('dragenter', dragEnterLeave, false)
        droppable.addEventListener('dragleave', dragEnterLeave, false)
        droppable.addEventListener(
          'dragover',
          function(evt) {
            evt.stopPropagation()
            evt.preventDefault()
            var ok =
              evt.dataTransfer &&
              evt.dataTransfer.types &&
              evt.dataTransfer.types.indexOf('Files') >= 0
            $scope.$apply(function() {
              $scope[classReference] = ok ? 'over' : 'over-error'
            })
          },
          false
        )
        droppable.addEventListener(
          'drop',
          function(evt) {
            evt.stopPropagation()
            evt.preventDefault()
            $scope.$apply(function() {
              $scope[classReference] = 'over'
            })
            var files = evt.dataTransfer.files
            $scope.$apply(function() {
              Array.from(files).forEach(function(file) {
                callback(file)
              })
              $scope[classReference] = ''
            })
          },
          false
        )
      }
    }
  ])
