'use strict';

angular.module('app.prepare', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/prepare', {
    templateUrl: 'views/prepare.html'
  , controller: 'PrepareController'
  })
}])

.controller('PrepareController', function(
	$scope,
	$location,
	$timeout,
	$routeParams,
	dataLoader,
	netBundleManager,
	FileLoader,
	droppable,
	$mdToast
) {
	// DEV MODE: auto load
	netBundleManager.importBundle('data/BUNDLE - Sample Rio+20.json', initBundle)

	$scope.attMode = undefined
	$scope.attId = undefined
	$scope.attData = undefined
	$scope.att = undefined

	$scope.downloadBundle = function() {
		var json = netBundleManager.exportBundle($scope.networkData)
    var blob = new Blob([json], {'type':'application/json;charset=utf-8'});
    saveAs(blob, 'BUNDLE - ' + $scope.networkData.title + '.json');
	}

  // File upload interactions
  $scope.uploadFile = function(){
    document.querySelector('input#hidden-upload-file-input').click()
  }

  $scope.setUploadFile = function(element) {
    var i
    for (i=0; i< element.files.length; i++){
      var file = element.files[i]
      $scope.readUploadFile(file)
      return // We just expect one file, so we stop here.
    }
  }

  $scope.readUploadFile = function(file){
    var fileName = file.name
    var fileLoader = new FileLoader()
    fileLoader.read(file, {
      onloadstart: function(evt){
        $scope.uploadingMessage = 'UPLOADING...'
        $scope.uploadingDropClass = 'loading'
        $scope.$apply()
      }
      ,onprogress: function(evt){
        // evt is a ProgressEvent
        if (evt.lengthComputable) {
          $scope.uploadingMessage = 'UPLOADING ' + Math.round((evt.loaded / evt.total) * 100) + '%'
          $scope.$apply()
        }
      }
      ,onload: function(evt){
        var target = evt.target || evt.srcElement

        if (target.result) {
          try {
            var success = parseUpload(target.result, fileName);
            if(success) {
	            uploadParsingSuccess()
	          } else {
	            uploadParsingFail(fileName)
	          }

          } catch(e) {
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
  $scope.initDroppable = function(){
	  droppable(document.getElementById("file-uploader"), 'uploadingDropClass', $scope, $scope.readUploadFile)
  }

  $scope.editNodeAttribute = function(id) {
  	$scope.attMode = 'node'
  	$scope.attData = $scope.nodeAttributesIndex[id]
  	$scope.attId = id
  	$scope.att = angular.copy($scope.networkData.nodeAttributesIndex[id])
  }

  $scope.editEdgeAttribute = function(id) {
  	$scope.attMode = 'edge'
  	$scope.attData = $scope.edgeAttributesIndex[id]
  	$scope.attId = id
  	$scope.att = $scope.networkData.edgeAttributesIndex[id]
  }

  $scope.cancelEditAttribute = function() {
  	$scope.attMode = undefined
  	$scope.attData = undefined
  	$scope.attId = undefined
  	$scope.att = undefined
  }

  $scope.validateEditAttribute = function() {
  	$scope.attMode = undefined
  	$scope.attData = undefined
  	$scope.attId = undefined
  	$scope.att = undefined
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
      $mdToast.simple()
        .textContent(message)
        .hideDelay(3000)
    )
  }

  // Init at bundle build
  function initBundle(bundle) {
  	console.log("networkData", bundle)
  	dataLoader.set(bundle)
		$scope.networkData = bundle
		$scope.networkData.loaded = true
  	$scope.nodeAttributesIndex = netBundleManager.buildNodeAttributesIndex(bundle.g)
  	netBundleManager.ignored_node_attributes.forEach(function(d){
  		if ($scope.nodeAttributesIndex[d]) { delete $scope.nodeAttributesIndex[d] }
  	})
  	console.log('Node attributes', $scope.nodeAttributesIndex)
  	$scope.edgeAttributesIndex = netBundleManager.buildEdgeAttributesIndex(bundle.g)
  	netBundleManager.ignored_edge_attributes.forEach(function(d){
  		if ($scope.edgeAttributesIndex[d]) { delete $scope.edgeAttributesIndex[d] }
  	})
  }

  // Parsing functions
  function parseUpload(data, fileName) {
  	if (!fileName) return false
		var bundle_import
  	if (fileName.substr(-5).toUpperCase() == '.GEXF') {
  		var title = netBundleManager._toTitleCase(fileName.substring(fileName.lastIndexOf('/')+1).replace('_', ' ').replace(/\..*/gi, ''))
  		netBundleManager.parseGEXF(data, title, initBundle)
  	} else if (fileName.substr(-5).toUpperCase() == '.JSON' || fileName.substr(-3).toUpperCase() == '.JS') {
  		netBundleManager.parseBundle(JSON.parse(data), initBundle)
  	} else return false

		return true
  }
})

.factory('FileLoader', ['$window', function(win){
  return function(){
    this.read = function(file, settings){
      this.reader = new FileReader()

      // Settings
      if(settings.onerror === undefined)
        this.reader.onerror = this.errorHandler
      else
        this.reader.onerror = settings.onerror

      if(settings.onprogress === undefined)
        this.reader.onprogress = function(evt) {
          console.log('file loader: progress ', evt)
        }
      else
        this.reader.onprogress = settings.onprogress

      if(settings.onabort === undefined)
        this.reader.onabort = function(e) {
          alert('File read cancelled')
        }
      else
        this.reader.onabort = settings.onabort

      if(settings.onloadstart === undefined)
        this.reader.onloadstart = function(evt) {
          console.log('file loader: Load start ', evt)
        }
      else
        this.reader.onloadstart = settings.onloadstart

      if(settings.onload === undefined)
        this.reader.onload = function(evt) {
          console.log('file loader: Loading complete ', evt)
        }
      else
        this.reader.onload = settings.onload

      this.reader.readAsText(file)
    }

    this.abortRead = function(){
        this.reader.abort()
    }

    this.reader = undefined

    this.errorHandler = function(evt){
      var target = evt.target || evt.srcElement
      switch(target.error.code) {
        case target.error.NOT_FOUND_ERR:
          alert('File Not Found!')
          break
        case target.error.NOT_READABLE_ERR:
          alert('File is not readable')
          break
        case target.error.ABORT_ERR:
          break // noop
        default:
          alert('An error occurred reading this file.');
      }
    }
  }

}])

.factory('droppable', [function(){
  return function(droppable, classReference, $scope, callback){
  	if (droppable === undefined || droppable == null) return

    //============== DRAG & DROP =============
    // adapted from http://jsfiddle.net/danielzen/utp7j/

    // init event handlers
    function dragEnterLeave(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope[classReference] = ''
      })
    }
    droppable.addEventListener("dragenter", dragEnterLeave, false)
    droppable.addEventListener("dragleave", dragEnterLeave, false)
    droppable.addEventListener("dragover", function(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
      $scope.$apply(function(){
        $scope[classReference] = ok ? 'over' : 'over-error'
      })
    }, false)
    droppable.addEventListener("drop", function(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope[classReference] = 'over'
      })
      var files = evt.dataTransfer.files
      $scope.$apply(function(){
        Array.from(files).forEach(function(file){
          callback(file)
        })
        $scope[classReference] = ''
      })
    }, false)
  }
}])