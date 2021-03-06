Ext.define('TAGGUI.training-data.controller.TrainingDataController', {
	extend: 'Ext.app.Controller',

	views: [
	        'TrainingDataPanel'
	        ],
	        // href="' + BASE_URL + '/protected/' + CRISIS_CODE + '/' + MODEL_ID + '/' + MODEL_FAMILY_ID +/training-examples
	        init: function () {

	        	this.control({

	        		'training-data-view': {
	        			beforerender: this.beforeRenderView
	        		},

	        		"#addNewTrainingData": {
	        			click: function (btn, e, eOpts) {
	        				this.addNewTrainingData();
	        			}
	        		},
	        		'button[action=deleteTrainingExample]': {
	        			click: this.deleteTrainingExample
	        		}

	        	});

	        },

	        beforeRenderView: function (component, eOpts) {
	        	AIDRFMFunctions.initMessageContainer();
	        	this.mainComponent = component;
	        	taggerCollectionDetailsController = this;

	        	this.loadModelData();
	        },

	        addNewTrainingData: function() {
	        	document.location.href = BASE_URL + "/protected/" + CRISIS_CODE + '/' + MODEL_ID + '/'
	        	+ MODEL_FAMILY_ID + '/' + ATTRIBUTE_ID +'/training-examples';
	        },

	        loadModelData: function() {
	        	var me = this,
	        	status = '',
	        	detailsForModel = '';

	        	if (MODEL_ID) {
	        		status = AIDRFMFunctions.getStatusWithStyle("RUNNING", TYPE);
	        		detailsForModel = '<a href="' + BASE_URL +  '/protected/' + CRISIS_CODE + '/' + MODEL_ID + '/model-details">Details of running classifier &raquo;</a>';

	        		Ext.Ajax.request({
	        			url: BASE_URL + '/protected/tagger/getAllLabelsForModel.action',
	        			method: 'GET',
	        			params: {
	        				id: MODEL_ID,
	        				code: CRISIS_CODE
	        			},
	        			headers: {
	        				'Accept': 'application/json'
	        			},
	        			success: function (response) {
	        				var resp = Ext.decode(response.responseText);
	        				if (resp.success && resp.data) {
	        					var count = resp.data.length;
	        					if (count > 0) {
	        						var totalMessages = 0,
	        						totalExamples = 0;

	        						Ext.Array.each(resp.data, function(r, index) {
//	        							do not count any data from labels with code == null
	        							if (!r.nominalLabel || !r.nominalLabel.nominalLabelCode || r.nominalLabel.nominalLabelCode == 'null'){
	        								return true;
	        							}

	        							if (r.classifiedDocumentCount && r.classifiedDocumentCount > 0) {
	        								totalMessages += r.classifiedDocumentCount;

	        							}
	        							if (r.trainingDocuments && r.trainingDocuments > 0) {
	        								totalExamples += r.trainingDocuments;
	        							}
	        						});
	        						// var self = this;
	        						//me.getRetrainingThreshold()
	        						me.getRetrainingThreshold(totalMessages, count);
	        						me.mainComponent.taggerDescription.setText('Status: <b><small>' + status + '</small></b>. ' +
	        								'Machine-tagged '+ COLLECTION_TYPES[TYPE]["plural"] + ': <b>' + totalMessages + '</b> (since last change of the classifier).&nbsp;' + detailsForModel, false);


	        						//  me.mainComponent.taggerDescription2line.setText('<b>' + totalExamples + '</b> training examples. Note: Value \"N/A\" doesn\'t count as training example.', false);
	        					}
	        				} else {
	        					AIDRFMFunctions.setAlert("Error", resp.message);
	        				}
	        			}
	        		});
	        	} else {
	        		this.getRetrainingThreshold(0,0);
	        		me.mainComponent.breadcrumbs.setText('<div class="bread-crumbs">' +
	        				'<a href="' + BASE_URL + '/protected/home">My Collections</a><span>&nbsp;>&nbsp;</span>' +
	        				'<a href="' + BASE_URL + '/protected/' + CRISIS_CODE + '/tagger-collection-details">' + CRISIS_NAME + '</a><span>&nbsp;>&nbsp;' +
	        				MODEL_NAME + '&nbsp;>&nbsp;Human-tagged '+ COLLECTION_TYPES[TYPE]["plural"] + '</span></div>', false);

	        	}


	        },

	        getRetrainingThreshold: function(trainingExamplesCount, countTrainingExample){
	        	var me = this;
	        	Ext.Ajax.request({
	        		url: BASE_URL + '/protected/tagger/getTrainingDataCountByModelIdAndCrisisId.action',
	        		method: 'GET',
	        		params: {
	        			modelFamilyId: MODEL_FAMILY_ID,
	        			crisisId: CRISIS_ID
	        		},
	        		headers: {
	        			'Accept': 'application/json'
	        		},
	        		success: function (response) {
	        			var resp = Ext.decode(response.responseText);
	        			if (resp.success && resp.data) {
	        				var totalHumanLabeledCount = resp.data;
	        				var sampleCountThreshold = RETRAINING_THRESHOLD;
	        	        	var retrainingThresholdCount = 0;
	        	        	var statusMessage='';
	        	        	var y = TRAINING_EXAMPLE % sampleCountThreshold;
	        	        	if(y < 0){
	        	        		y = y * sampleCountThreshold;
	        	        	}
	        	        	retrainingThresholdCount = sampleCountThreshold - y;

	        	        	if( countTrainingExample > 0){
	        	        		statusMessage = retrainingThresholdCount + ' more needed to re-train. Note: Value \"N/A\" doesn\'t count for training.';
	        	        		//me.mainComponent.taggerDescription2line.setText('<b>' + TRAINING_EXAMPLE + '</b> human-tagged '+ COLLECTION_TYPES[TYPE]["plural"] + '. '+ statusMessage, false);
	        	        		me.mainComponent.taggerDescription2line.setText('<b>' + totalHumanLabeledCount + '</b> human-tagged '+ COLLECTION_TYPES[TYPE]["plural"] + '. '+ statusMessage, false);
	        	        	}
	        	        	else{

	        	        		statusMessage = retrainingThresholdCount + ' more needed to re-train. Note: Value \"N/A\" doesn\'t count for training.';
	        	        		// TRAINING_EXAMPLE, this.trainingDataStore.getReader().getTotal()
	        	        		me.mainComponent.taggerDescription2line.setText('<b>'+ totalHumanLabeledCount +'</b> human-tagged '+ COLLECTION_TYPES[TYPE]["plural"] + '. ' + statusMessage, false);
	        	        	}

	        			} else {
	        				AIDRFMFunctions.setAlert("Info", "No human tagged "+ COLLECTION_TYPES[TYPE]["plural"] + " present for this classifier.");
	        			}
	        		}
	        	});

	        },

	        deleteTrainingExample: function(button){
	        	if (!button.exampleId){
	        		AIDRFMFunctions.setAlert("Error", "Error while delete human-tagged "+ COLLECTION_TYPES[TYPE]["singular"] + ". Document Id not available.");
	        	}

	        	var me = this;

	        	Ext.Ajax.request({
	        		url: BASE_URL + '/protected/tagger/deleteTrainingExample.action',
	        		method: 'GET',
	        		params: {
	        			id: button.exampleId
	        		},
	        		headers: {
	        			'Accept': 'application/json'
	        		},
	        		success: function (response) {
	        			var resp = Ext.decode(response.responseText);
	        			if (resp.success) {
	        				AIDRFMFunctions.setAlert("Info", "Human-tagged "+ COLLECTION_TYPES[TYPE]["singular"] + " is removed successfully. Note: this removal will be reflected on the automatic classifier the next time it is retrained.");
	        				me.mainComponent.trainingDataStore.load();
	        			} else {
	        				AIDRFMFunctions.setAlert("Error", resp.message);
	        			}
	        		}
	        	});
	        }

});