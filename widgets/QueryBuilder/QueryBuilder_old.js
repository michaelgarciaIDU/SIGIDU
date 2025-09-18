define(
	[ 'dojo/_base/declare', 
	  'dijit/_WidgetBase',
	  'dijit/_TemplatedMixin',
	  'dijit/_WidgetsInTemplateMixin', 
	  'dijit/form/Form',
	  'dojo/text!./templates/QueryBuilder.html',
	  'dojo/_base/array',
	  'dijit/form/Select',
	  'dijit/form/MultiSelect',
      'dijit/form/Button',
      'dijit/form/Textarea',
	  'esri/layers/ArcGISDynamicMapServiceLayer',
      'dojo/dom',
      'dojo/query',
      'dijit/layout/ContentPane',
      'dojox/form/CheckedMultiSelect',
      'dijit/form/CheckBox',
      'dijit/form/TextBox',
      'esri/tasks/QueryTask',
      'esri/tasks/query',
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/Color',
      'esri/geometry/Point',
      'esri/geometry/webMercatorUtils',
      'esri/graphic',
      'esri/InfoTemplate',
	  'jimu/PanelManager',
	  'esri/layers/FeatureLayer',
		'esri/tasks/GeometryService',
		'esri/tasks/ProjectParameters',
		'esri/SpatialReference',
		'esri/graphicsUtils',
		'dojox/widget/Toaster',
		'dojox/widget/Standby',
		'dijit/layout/ContentPane',
		'dijit/registry',
		'dijit/layout/TabContainer','esri/graphic','esri/dijit/FeatureTable','dojox/grid/EnhancedGrid','dojo/data/ItemFileReadStore',
		'dojo/dom-style'
	],
	function(declare, _WidgetBase, _TemplatedMixin,
		_WidgetsInTemplateMixin, Form, qbTemplate,array,Select,MultiSelect,Button,Textarea,ArcGISDynamicMapServiceLayer,dom,
			 query,ContentPane,CheckedMultiSelect,CheckBox,
             TextBox,QueryTask,query,SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,Color,Point,webMercatorUtils,
			 graphic,InfoTemplate,PanelManager,FeatureLayer,GeometryService,ProjectParameters,SpatialReference,graphicsUtils,
			 Toaster,Standby,ContentPane,registry,TabContainer,Graphic,FeatureTable,EnhancedGrid,ItemFileReadStore,domStyle) {

	    var qbDijit = declare([ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
			widgetsInTemplate : true,
			templateString : qbTemplate,
			postCreate : function() {
			    this.inherited(arguments);
				this.initQueryBuilder();
			},


			initQueryBuilder: function() {
				console.log("DO initQueryBuilder ");
				qb = new QueryBuilder("querybuilder",this.map,this.geometryService,this.layerGrafico,this.layerGraficoSeleccionado,this.layers);
				qb.getListaCapas();
			}

		});


		function QueryBuilder(id,mapObj,geometryService,layerGrafico,layerGraficoSeleccionado,layers) {
			var self = this;
            var mapObj=mapObj;
			var geometryService=geometryService;
			var layerGrafico=layerGrafico;
			var layerGraficoSeleccionado=layerGraficoSeleccionado;
			var capaspermitidas=layers;
			var layerLabel =  dijit.byId(id + "-layername");
			var valuesButton = dijit.byId(id + "-getvalues");
			var clearButton = dijit.byId(id + "-clear");
			var undoButton = dijit.byId(id + "-undo");
			var cancelButton = dijit.byId(id + "-cancel");
			var goButton = dijit.byId(id + "-go");
			var layerpicker = dijit.byId(id + "-layers");
			var fieldpicker = dijit.byId(id + "-fieldnames");
			var valuepicker = dijit.byId(id + "-fieldvalues");
			var sqlbox = dijit.byId(id + "-where");
			var checklist = dijit.byId(id + "-columns");
			var exportarButton=dijit.byId("exportar");
			var grid;
            var fieldSkipList = "|Shape|SHAPE|shape|";
			var fieldsactiveLayer;
            self.mapObj=mapObj
			self.geometryService=geometryService;
			self.layerGrafico=layerGrafico;
			self.layerGraficoSeleccionado=layerGraficoSeleccionado;
            self.fieldSkipList=fieldSkipList;
			self.layerLabel = layerLabel;
			self.valuesButton = valuesButton;
			self.layerpicker = layerpicker;
			self.fieldpicker = fieldpicker;
			self.valuepicker = valuepicker;
			self.sqlbox = sqlbox;
			self.checklist = checklist;
			self.fieldsactiveLayer=fieldsactiveLayer;
			self.capaspermitidas=capaspermitidas;
			self.grid=grid;
			self.campospermitidos=null;
			//--Inner Properties
			var sqlWhere = "";
			var outFields =["OBJECTID"];
			var result = null;
			var lySeleleccionadoDefinition=null;
			self.lySeleleccionadoDefinition=lySeleleccionadoDefinition;
			//--Public Properties
			self.sqlWhere = sqlWhere;
			self.outFields = outFields;
			self.results = result;
			//--Model + Constants
			var operators = {
				"lpar": {
					value: "(",
					title: "Left Parenthesis",
					text: "("
				},
				"rpar": {
					value: ")",
					title: "Right Parenthesis",
					text: ")"
				},
				"not": {
					value: "Not",
					title: "Is Not",
					text: "NOT"
				},
				"eq": {
					value: "=",
					title: "Equal To",
					text: "="
				},
				"ne": {
					value: "&lt;&gt;",
					title: "Not Equal To",
					text: "<>"
				},
				"like": {
					value: "=",
					title: "Equal To",
					text: "LIKE"
				},
				"gt": {
					value: "&gt;",
					title: "Greater Than",
					text: ">"
				},
				"gte": {
					value: "&gt;=",
					title: "Greater Than or Equal To",
					text: ">="
				},
				"and": {
					value: "And",
					title: "Equal To",
					text: "AND"
				},
				"lt": {
					value: "&lt;",
					title: "Less Than",
					text: "<"
				},
				"lte": {
					value: "&lt;=",
					title: "Less Than or Equal To",
					text: "<="
				},
				"or": {
					value: "Or",
					title: "Or",
					text: "OR"
				},
				"isnull": {
					value: "IsNull",
					title: "Is Null",
					text: "IS NULL"
				},
				"notnull": {
					value: "NotNull",
					title: "Is Not Null",
					text: "IS NOT NULL"
				},
				"in": {
					value: "IN()",
					title: "In",
					text: "IN ("
				}
			}//end operators

			//--UI Actions ------------------------
			for (var oper in operators) {
                var boton=dijit.byId(id + "-" + oper);
                dojo.connect(boton,"onClick",function (e) {
                    var iop = this.id.split("-")[1];
                    sqlWhere = sqlbox.get("value");
                    sqlbox.set("value",sqlbox.get("value")+  " " + operators[iop].text);
                });
			}

            dojo.connect(layerpicker,"onChange",function (e) {
				var layerName = layerpicker.get("displayedValue");
				var layerUrlId = layerpicker.get("value");
				console.log("Layer cambia: " + layerUrlId);
				console.log(layerName);
				console.log(mapObj);
				sqlbox.set("value","");
				//self.open();
				self.getFields(layerUrlId);
			});
			
            dojo.connect(fieldpicker,"onDblClick",function (e) {
				sqlWhere = sqlbox.get("value");
				var vlr=fieldpicker.get("value")[0];
				var fieldname = vlr.split("$")[0];
                sqlbox.set("value",sqlbox.get("value")+  " " + fieldname);
			});

            dojo.connect(valuesButton,"onClick",function (e) {
                self.getValues(e);
				//console.log(e);
            });

			
			


            dojo.connect(valuepicker,"onDblClick",function (e) {
                sqlWhere = sqlbox.get("value");
                var valor = valuepicker.get("value");
                sqlbox.set("value",sqlbox.get("value")+  " " + valor);
			});

            dojo.connect(clearButton,"onClick",function (e) {
				sqlbox.set("value", "");
				self.layerGrafico.clear();
				self.layerGraficoSeleccionado.clear();
				document.getElementById("TablaDominios").style.display = 'none';
			});
            dojo.connect(undoButton,"onClick",function (e) {
                sqlbox.set("value", sqlWhere);
			});

            dojo.connect(goButton,"onClick",function (e) {
				//TODO: Validate SQL
				if (sqlbox.get("value") == "") {
					self.showEstado("La consulta no es valida","error");
				} else {
					self.queryGo(e);
				}
			});

            dojo.connect(cancelButton,"onClick",function (e) {
				PanelManager.getInstance().closePanel("_10_panel");
				document.getElementById("TablaDominios").style.display = 'none';
			});

			dojo.connect(exportarButton,"onClick",function (e) {
				if(self.datosultimaconsulta!=null)
					self.downloadCSV(self.datosultimaconsulta);
			});
			//DONE QueryBuilder class
		}

		/*
		 * -------------- QUERY BUILDER METHODS --------------------
		 * picklistLayers(mapLayer, sel, layerId)_
		 * = List layers from Active Layer map service in layerpicker.
		 * getFields(url)_
		 * = get fieldnames to list in fieldslist and checkboxlist,
		 *   equal to activate or switch Active Layer.
		 */

		QueryBuilder.prototype.llenarComboLayers = function (mapLayer, sel) {
			var msid = mapLayer.id;
			var uig = sel.id.split("-")[0];
			//var layerInfos = mapLayer.layerInfos;
			var layerInfos = mapLayer.dynamicLayerInfos;
			//console.log(msid);
			layerInfos.sort(ordenarPor("id"));
			if(layerInfos!=undefined){
				
				for (var i in layerInfos) {
					var lid = layerInfos[i].id;
					var name = layerInfos[i].name;
					
					var sids = layerInfos[i].subLayerIds;
					//console.log(sids);
					if (sids == null) {
						var urid = msid + ":" + lid;
						var url = mapLayer.url;
						var opt = document.createElement("option");
						opt.id = uig + "-" + urid;
						opt.value = url+"/"+lid;
						opt.innerHTML = name;
						sel.addOption(opt);
					}
				}
				//LLena la lista de campos
				//console.log(mapLayer.url+"/0");
				this.getFields(mapLayer.url+"/0");
			}
		}
		
		function ordenarPor (propiedadLayer){
			return function(a, b){
				if (a[propiedadLayer] < b[propiedadLayer]){
					return -1;
				}else if(a[propiedadLayer] > b[propiedadLayer]){
					return 1;
				}else{
					return 0;
				}
			}
		}
		/*
		 *
		 */
		QueryBuilder.prototype.getListaCapas = function () {
			var existeMapLayer=false;;
			var self=this;
			var layers = self.mapObj.layerIds;
			//var layers2 = self.mapObj.attribution._activeLayers;
			
			
			for (var i = 0; i < layers.length; i++) {
				var idlayer=layers[i];
				var mapLayer=self.mapObj.getLayer(idlayer);
				console.log(mapLayer);
				if(mapLayer.declaredClass=="esri.layers.ArcGISDynamicMapServiceLayer" || mapLayer.declaredClass=="ArcGISTiledMapServiceLayer"){
					this.llenarComboLayers(mapLayer, this.layerpicker);
					existeMapLayer=true;
				}
			}
			var featurelayers=self.mapObj.graphicsLayerIds;
			//console.log(featurelayers);
			for (var i = 0; i < featurelayers.length; i++) {
				var idlayer=featurelayers[i];
				var fLayer=self.mapObj.getLayer(idlayer);
				
				if(fLayer.declaredClass=="esri.layers.FeatureLayer"){
					if(fLayer.url!=null){
						var opt = document.createElement("option");
						opt.id = fLayer.id;
						opt.value = fLayer.url;
						opt.innerHTML = fLayer.name;
						//console.log(fLayer);
						this.layerpicker.addOption(opt);
						if(existeMapLayer==false){
							this.getFields(fLayer.url);
							existeMapLayer=true;
						}
					}
				}
			}
		}


		QueryBuilder.prototype.getFields = function (url) {
			console.log("DO QueryBuilder.getFields: " + url);
            var self=this;
			self.showBusy();
			var sender = this;
			var sel = this.fieldpicker;
			var checklist = this.checklist;
			var sqlbox = this.sqlbox;
			var layerLabel = this.layerLabel;
            //var fieldSkipList=this.fieldSkipList;
			var campospermitidos=self.getCamposPermitidos(url);
			self.campospermitidos=campospermitidos;
			var callback = function (json) {
				self.hideBusy();
				console.log("DO QueryBuilder.getFields CALLBACK: " + json.name);
                //console.log(json.fields);
				if (json.fields != undefined && json.fields != null && json.fields.length > 1) {
					self.fieldsactiveLayer=json.fields;
					self.picklistFields(json.fields, sel, json.displayField,campospermitidos);
					//self.checklistFields(json.fields,checklist, json.displayField,fieldSkipList);
					self.outFields.push(campospermitidos);
				}else{
					console.log("No hay campos para traer");
					var selectbox = sel.domNode;
					while(selectbox.options.length>0){
						console.log("REMOVING PICKLISTFIELDS");
						selectbox.remove(0);
					}
				}
				sender.layerLabel.set("value",json.name);
			}
			esrequest(url, { f: "json" }, "json", callback);
		}



		/*
		**Llena los valores cuando se da click en el boton Listar Valores
		 */
		QueryBuilder.prototype.getValues = function (e) {
			console.log("DO " + this.id + ".getValues onclick of " + this.targetId(e));
			var self=this;
			self.showBusy();
			var fieldpicker = this.fieldpicker;
			var vlr=fieldpicker.get("value")[0];
			
			var fieldname = vlr.split("$")[0];
			var fieldtype = vlr.split("$")[1];
			//console.log(vlr);
			var valuepicker = this.valuepicker;
			//console.log(fieldtype);
			
			var callback = function (res) {
				self.hideBusy();
				console.log("DO CALLBACK queryBuilder.getFieldValues to create values picklist");
				//console.log(res);
				self.picklistFieldValuesQueryResult(res, valuepicker, fieldname, fieldtype);
			}
			var TypesEsri = ['esriFieldTypeInteger','esriFieldTypeSingle','esriFieldTypeOID'];
			
			for (var i = 0; i < TypesEsri.length; i++) {
				console.log(TypesEsri[i], fieldtype);
				if(fieldtype === TypesEsri[i]){
					document.getElementById("TablaDominios").style.display = 'none';
					//document.getElementById("myTableNode2").style.display = 'none';
					break;
					
				}else{
					document.getElementById("TablaDominios").style.display = 'block';
					//var ValueDomain = this.queryListOfValues(fieldname, this.layerpicker.get("value"), callback);
					
					
				}
				
			}
			/*
			if(fieldtype !== 'esriFieldTypeInteger' || fieldtype !== 'esriFieldTypeSingle' || fieldtype !== 'esriFieldTypeOID'){
				document.getElementById("TablaDominios").style.display = 'block';
				var ValueDomain = this.queryListOfValues(fieldname, this.layerpicker.get("value"), callback);
				document.getElementById("myTableNode2").innerHTML = ValueDomain;

			} else{
				document.getElementById("TablaDominios").style.display = 'none';
			}*/
			
			
			this.queryListOfValues(fieldname, this.layerpicker.get("value"), callback);
			//console.log(this.layerpicker.get("value"));
		}

		//--- Run query on Active Layer with SQL Where clause constructed
		QueryBuilder.prototype.queryGo = function (e) {
			console.log("DO queryGo");
            var self=this;
			var sqlWhere = this.sqlbox.get("value");
			var callback = function (res) {
				queryResult = res;
				self.gtableQueryResult(res);
			}
            var errorcallback=function(error){
				self.hideBusy();
				self.showEstado("La sentencia de la consulta es invalida","error");
            }
			self.showBusy();
			console.log(self.outFields);
			this.queryFeaturesWhere(this.layerpicker.get("value"), true, callback,errorcallback, sqlWhere, self.outFields);

		}
		QueryBuilder.prototype.close = function () {
			this.close();
		}


        QueryBuilder.prototype.targetId=function(e) {
            if (window.event) {
                return window.event.srcElement.id;
            } else {
                return e.target.id;
            }
        }
        //==== EVENT HANDLERS =================================================
        /*
         * --- Crea una lista de campos
         * @param {Array} fields: array of fields info in format from rest service json
         * @param {Object} sel: the select element to list the fields as options.
         * @param {String} fieldname: the layer displayField or other field to set as selected.
         * CALLER: QueryBuilder.getFields/callback
         */
        QueryBuilder.prototype.picklistFields=function(fields, sel, fieldname,campospermitidos) {
            console.log("DO picklistFields: (" + fields.length + ") in " + sel.id+",fieldname:"+fieldname);
			var selectbox = sel.domNode;
			while(selectbox.options.length>0){
				console.log("REMOVING PICKLISTFIELDS");
				selectbox.remove(0);
			}
			var allfields=campospermitidos[0];
			//console.log(fields);
            for (var i = 0; i < fields.length; i++) {
                var name = fields[i].name;
                var type = fields[i].type;
                var alias = fields[i].alias;
                var domain = fields[i].domain;
				if(allfields=="ALL"){
					var opt = document.createElement("option");
					opt.id = sel.id + ":" + i;
					opt.value = name+"$"+type;
					opt.innerHTML = alias;
					opt.title = type;

					if (fieldname != undefined
						&& fieldname.toUpperCase() == name.toUpperCase()) {
						opt.selected = "selected";
					}
					selectbox.options.add(opt);
				}else{
					for(var j=0;j<=campospermitidos.length-1;j++){
						if (name==campospermitidos[j]) {
							var opt = document.createElement("option");
							opt.id = sel.id + ":" + i;
							opt.value = name+"$"+type;
							opt.innerHTML = alias;
							opt.title = type;

							if (fieldname != undefined
								&& fieldname.toUpperCase() == name.toUpperCase()) {
								opt.selected = "selected";
							}
							selectbox.options.add(opt);
							break;
						}
					}
				}
            }
        }//DONE picklistFields

        /*
         * --- Crea una lista de checkbox con nombres de campos
         * for the target object (query builder) in designated container.
         * @param {Array} fields: field info from feature layer JSON.
         * @param {Object} target: an app object like a query builder instance.
         * @param {String} fieldname: if arg included check the field checkbox.
         * Skip OBJECTID since auto included in query output fields.
         */
        QueryBuilder.prototype.checklistFields=function(fields, checklist, fieldname,fieldSkipList) {
			console.log("DO checklistFields: (" + fields.length + ") ");
			while (checklist.options.length>0) {
				console.log("REMOVING CHECKLIST");
				checklist.removeOption(0);
			}
			var outFields = this.outFields;
			for (var i = 0; i < fields.length; i++) {
				var name = fields[i].name;
				var type = fields[i].type;
				var alias = fields[i].alias;
				if (fieldSkipList.indexOf("|" + name + "|") < 0 && name.toUpperCase() != "OBJECTID") {
					var opt = document.createElement("option");
					opt.value = name;
					opt.innerHTML = name;

					if (fieldname != undefined
						&& fieldname.toUpperCase() == name.toUpperCase()) {
						opt.selected = "selected";
					}
					checklist.addOption(opt);
				}
			}
		}

		/*
		 * ---- Esri Request Call Wrapper
		 * @param {String} url: the REST resource to get data from.
		 * @param {Object} paramson: parameters in JSON.
		 * @param {String} format: return data format - 'json'|'text'|'xml'
		 * @param {Object} callback: ref to a function to handle response.
		 * REQ: Proxy page setup for XSS call
		 * @return {void}: asynchronously executes callback on data response.
		 */
        esrequest=function(url, paramson, format, callback) {
			console.log("DO esrequest: " + url);
			var reqson = {
				url: url,
				content: paramson,
				handleAs: format
			}
			var request = esri.request(reqson);
			request.then(callback, this.callbackFailed);
		}

        QueryBuilder.prototype.callbackFailed=function(error) {
			console.log("Error: ", error.message);
			//alert(error.message);
			//console.log("DO callbackFailed: ERROR: " + error.message);
		}


        /*
         * --- Query for all values of a data field and returns a featureSet
         * @param {String} fieldname: attribute name to get list of values
         * @param {String} url: REST URL to the Active Layer
         * @param {Object} callback: a function to process the query results
         */
        QueryBuilder.prototype.queryListOfValues=function(fieldname, url, callback) {
            console.log("DO getFieldValues: " + [fieldname, url].join(", "));
            //build query
            queryTask = new esri.tasks.QueryTask(url);
            //build query filter
            query = new esri.tasks.Query();
            query.returnGeometry = false;
            query.outFields = [fieldname];
            query.where = fieldname + " IS NOT NULL ";
            query.returnDistinctValues=true;
            //execute query
            queryTask.execute(query, callback);
        }

        /*
         * --- Crea una lista de los valores de un campo
         * @param {JSON} res: query task result.
         * @param {Object} sel: a select element.
         * @param {String} fieldname: the field in the query result to get the values.
         * @param {String} fieldtype: the field datatype to determine whether to wrap
         *  the value with single quotes to aid in SQL WHERE clause.
         * CALLER: QueryBuilder.getValues - a callback fxn arg for queryListOfValues
         */
        QueryBuilder.prototype.picklistFieldValuesQueryResult=function(res, sel, fieldname, fieldtype) {
            console.log("DO picklistFieldValuesQueryResult: (" + res.features.length + ") " + sel.id);
            selectbox = sel.domNode;
			selectbox2 = document.getElementById("myTableNode2");
			
            while(selectbox.options.length>0){
                selectbox.remove(0);
            }
			while(selectbox2.options.length>0){
                selectbox2.remove(0);
            }
            var fields=this.fieldsactiveLayer;
            //console.log(fields);
            for (var i = 0; i < res.features.length; i++) {
                var valor="INDEFINIDO";
                var label="INDEFINIDO";
                var feature = res.features[i];
                for (var j = 0; j < fields.length; j++) {
                    if(fields[j].name==fieldname){
                        var domain=fields[j].domain;
                        if(domain!=undefined){
                            if(domain.type="codedValue"){
                                var codedvalues=domain.codedValues;
                                for (var k = 0; k < codedvalues.length; k++) {
                                    var coded=codedvalues[k];
                                    if(feature.attributes[fieldname]==coded.code){
                                        valor=coded.code;
                                        label=coded.name;
                                        break;
                                    }
                                }
                            }
                        }else{
                            if(fields[j].type=="esriFieldTypeDate"){
                                var nd = new Date(feature.attributes[fieldname]);
                                valor=dojo.date.locale.format(nd, {datePattern: "dd-MM-yyyy", selector: "date"})
                                label=dojo.date.locale.format(nd, {datePattern: "dd-MM-yyyy", selector: "date"})
                            }else{
                                valor=feature.attributes[fieldname];
                                label=feature.attributes[fieldname];
                            }
                        }

                    }
                    //console.log("---------------------------------");
                    //console.log(domain);
                    //console.log("---------------------------------");
                }

                var opt = document.createElement("option");
                opt.id = sel.id + ":" + i;
                if (fieldtype.toLowerCase().indexOf("string") >= 0) {
                    opt.innerHTML = "'" + label + "'";
					opt.value ="'" + valor + "'";
                } else {
                    opt.innerHTML = label
					opt.value = valor;
                }
				var opt2 = document.createElement("option");
                opt2.id = document.getElementById("myTableNode2") + ":" + i;
                if (fieldtype.toLowerCase().indexOf("string") >= 0) {
                    opt2.innerHTML = "'" + label + "'" + "' = '" + valor;
					opt2.value ="'" + valor + "'";
                } else {
                    opt2.innerHTML = label + ' = ' + valor;
					opt2.value = valor;
                }
				console.log(opt2);
                selectbox.options.add(opt);
				selectbox2.options.add(opt2);
				//document.getElementById("myTableNode2").innerHTML = label;
				//console.log(myTableNode2);
            }
        }//DONE picklistFieldValuesQueryResult

        /*
         * --- Generic Feature Layer Query wrapper
         * @param {String} url: REST URL to the feature layer, REQUIRED
         * @param {String} sql: WHERE clause to send to query.
         * @param {Boolean} getshape: whether to return geometry from query.
         * @param {Array} outfields: output field names to query.
         *   If not set returns only default display field.
         * @param {Object} callback: a function to process successful response.
         * A very forgiving function that will do something unless missing url.
         */
        QueryBuilder.prototype.queryFeaturesWhere= function(url, getshape, callback,errorcallback, sql, outfields) {
            console.log("DO queryFeaturesWhere: " + sql + " on " + url);
            if (getshape == undefined) {
                var getshape = false;
            }
            if (callback == undefined) {
                var callback = function (res) {
                    console.log("DO CALLBACK on queryFeatureWhere/queryTask.execute: " + res);
                }
            }
            if (errorcallback == undefined) {
                var errorcallback = function (res) {
                    console.log("DO ERROR CALLBACK on queryFeatureWhere/queryTask.execute: " + res);
                }
            }

            if (sql == undefined) {
                var sql = "OBJECTID >= 0 AND OBJECTID < 500";
            }
            queryTask = new esri.tasks.QueryTask(url);
            query = new esri.tasks.Query();
			query.outFields = ["*"];
            query.returnGeometry = getshape;//true
            query.where = sql;
            // Execute query
            queryTask.execute(query, callback,errorcallback);
        }

        /*
         * --- Muestra los resultados de la consulta en el mapa
         */
        QueryBuilder.prototype.gtableQueryResult=function(featureSet){
            console.log("DO gtableQueryResult: " + featureSet.fields.length + " cols, " + featureSet.features.length + " rows (" + featureSet.geometryType);
            var self=this;
            self.mapObj.infoWindow.hide();
			self.layerGrafico.clear();
			self.layerGraficoSeleccionado.clear();
			if(featureSet.features.length>0){
				var symbol=null;
				var symbolSel=null;
				//console.log(featureSet.geometryType);
				if(featureSet.geometryType=="esriGeometryPoint"){
					symbol = new SimpleMarkerSymbol().setColor(new Color([255, 0, 0])).setSize(12);
					symbolSel = new SimpleMarkerSymbol().setColor(new Color([0, 255, 255])).setSize(14);
				}else if(featureSet.geometryType=="esriGeometryLine"){
					symbol=new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]),3);
					symbolSel=new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255]),3);
				}else if(featureSet.geometryType=="esriGeometryPolyline"){
					symbol=new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]),3);
					symbolSel=new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255]),3);
				}else if(featureSet.geometryType=="esriGeometryPolygon"){
					//symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]),3), new Color([255,255,204,128]));
					symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([102,51,0]),3), new Color([255,255,0,0.25])),
					symbolSel = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255]),3), new Color([255,255,204,128]));
				}
				var spatrefmapa=self.mapObj.spatialReference.wkid;
				console.log("Encontrados: "+featureSet.features.length+" Features");
				self.arregloAttributes=new Array();
				dojo.forEach(featureSet.features,dojo.hitch(self, function(feature){
					var graphic = feature;
					var atributos=graphic.attributes;

					console.log(graphic.geometry.spatialReference.wkid+"--->"+spatrefmapa);
					console.log(graphic);
					//alert("wkid geometria: " + graphic.geometry.spatialReference.wkid + "| spatrefmapa: " + spatrefmapa)
					if(graphic.geometry.spatialReference.wkid==spatrefmapa){
						graphic.setSymbol(symbol);
						self.layerGrafico.add(graphic);
						atributos.grafico=graphic;
						if(atributos.OBJECTID==null){
							if(atributos.objectid==null){
								alert("la capa no tiene el campo OBJECTID");
								return;;
							}else{
								atributos.OBJECTID=atributos.objectid;
							}
						}
						self.arregloAttributes.push(atributos);
					}else if(graphic.geometry.spatialReference.wkid==4326) {
						graphic.geometry = esri.geometry.geographicToWebMercator(feature.geometry);
						graphic.setSymbol(symbol);
						self.layerGrafico.add(graphic);
						atributos.grafico=graphic;
						if(atributos.OBJECTID==null){
							if(atributos.objectid==null){
								alert("la capa no tiene el campo OBJECTID");
								return;;
							}else{
								atributos.OBJECTID=atributos.objectid;
							}
						}
						self.arregloAttributes.push(atributos);
					}else{
						var projectService = new GeometryService(self.geometryService);
						var params = new ProjectParameters();
						params.geometries = [graphic.geometry];
						params.outSR = new SpatialReference(spatrefmapa);
						projectService.project(params,dojo.hitch(self,function(result) {
							graphic.geometry = result[0];
							graphic.setSymbol(symbol);
							self.layerGrafico.add(graphic);
							atributos.grafico=graphic;
							if(atributos.OBJECTID==null){
								if(atributos.objectid==null){
									alert("la capa no tiene el campo OBJECTID");
									return;;
								}else{
									atributos.OBJECTID=atributos.objectid;
								}
							}
							self.arregloAttributes.push(atributos);
						}));
					}
				}));
				setTimeout(function(){
					self.hideBusy();
					var gExtent = graphicsUtils.graphicsExtent(self.layerGrafico.graphics);
					//console.log("--------------->"+self.layerGrafico.graphics.length);
					self.mapObj.setExtent(gExtent,true);
					var layout=new Array();
					for(var k=0;k<=featureSet.fields.length-1;k++){
						var fieldk=featureSet.fields[k];
						layout.push({'name':fieldk.alias,'field':fieldk.name});
					}


					var data={
						"identifier":"OBJECTID",
						"items":self.arregloAttributes
					}
                    console.log(layout);
					console.log(data);
					var store=new ItemFileReadStore({data:data});
					if(self.grid!=null) {
						try {
							self.grid.destroy();
						}catch (er){}
					}

					self.grid = new EnhancedGrid({
						id: 'grid',
						store: store,
						structure: [layout],
						rowSelector: '20px'});
					self.grid.placeAt("myTableNode");
					self.grid.startup();
					var tabcontenedor=dijit.byId("contenedor_tab");
					var contenido=dijit.byId("querybuildertabla");
					tabcontenedor.selectChild(contenido);

					self.datosultimaconsulta=self.arregloAttributes;
					domStyle.set(registry.byId("exportar").domNode, 'display', 'inline');

					dojo.connect(self.grid,"onSelected",function (e) {
						console.log("Grid Seleccionado");
						self.mapObj.infoWindow.hide();
						self.layerGraficoSeleccionado.clear();
						var selected=self.grid.getItem(e);
						var grafico=selected.grafico[0];
						var graficoNew=new Graphic(grafico.geometry,symbolSel,grafico.attributes);
						self.layerGraficoSeleccionado.add(graficoNew);
						var gExtent = graphicsUtils.graphicsExtent([grafico]);
						self.mapObj.setExtent(gExtent,true);
						var geometria=grafico.geometry;
						var content = "";
						for (var key in graficoNew.attributes) {
							if (graficoNew.attributes.hasOwnProperty(key)) {
								content =content +  key + " : " + graficoNew.attributes[key] + "<br>"
							}
						}
						if(geometria.type=="point") {
							var punto = geometria;
							self.mapObj.infoWindow.setTitle("Informacion");
							self.mapObj.infoWindow.setContent(content);
							setTimeout(function(){
								self.mapObj.infoWindow.show(punto);
							}, 500);
						}else if(geometria.type=="polygon"){
							var poligono=geometria;
							var punto=poligono.getCentroid();
							self.mapObj.infoWindow.setTitle("Informacion");
							self.mapObj.infoWindow.setContent(content);
							setTimeout(function(){
								self.mapObj.infoWindow.show(punto);
							}, 500);
						}
					});
				}, 2000);
			}else{
				self.hideBusy();
				if(self.grid!=null){
					try{
						self.grid.destroy();
					}catch (er){}
				}
				self.datosultimaconsulta=null;
				domStyle.set(registry.byId("exportar").domNode, 'display', 'none');
				self.showEstado("La consulta no arrojo resultados","message")
			}

            //DONE gtableQueryResult
        }

		QueryBuilder.prototype.showEstado=function(texto,tipo){
			registry.byId('mensajesqb').setContent(texto, tipo);
			registry.byId('mensajesqb').show();
		}

		QueryBuilder.prototype.showBusy= function(){
			registry.byId("ocupadoqb").show();
		},

		QueryBuilder.prototype.hideBusy= function(){
			registry.byId("ocupadoqb").hide();
		}

		QueryBuilder.prototype.getCamposPermitidos=function(url){
			var self=this;
			var capaenlista=false;
			console.log(self.capaspermitidas);
			var campospermitidos=new Array();
			for(var i=0;i<=self.capaspermitidas.length-1;i++){
				var urlconid=self.capaspermitidas[i].url+"/"+this.capaspermitidas[i].id;
				if(url==urlconid){
					//console.log("------------------------>"+self.capaspermitidas[i].name);
					var allfields=self.capaspermitidas[i].fields.all;
					var fieldsper=self.capaspermitidas[i].fields.field;
					if(allfields){
						campospermitidos.push("ALL");
					}else{
						for(var j=0;j<=fieldsper.length-1;j++){
							campospermitidos.push(fieldsper[j].name);
						}
					}
					capaenlista=true;
					break;
				}
			}
			if(!capaenlista){
				campospermitidos.push("ALL");
			}
			console.log(capaenlista);
			console.log("********************************");
			console.log(campospermitidos);
			console.log("********************************");
			return campospermitidos;
		}

		QueryBuilder.prototype.convertArrayOfObjectsToCSV=function(args) {
			var result, ctr, keys, columnDelimiter, lineDelimiter, data;

			data = args.data || null;
			if (data == null || !data.length) {
				return null;
			}

			columnDelimiter = args.columnDelimiter || ',';
			lineDelimiter = args.lineDelimiter || '\n';

			keys = Object.keys(data[0]);

			result = '';
			result += keys.join(columnDelimiter);
			result += lineDelimiter;

			data.forEach(function(item) {
				ctr = 0;
				keys.forEach(function(key) {
					if (ctr > 0) result += columnDelimiter;

					result += item[key];
					ctr++;
				});
				result += lineDelimiter;
			});

			return result;
		}

		QueryBuilder.prototype.downloadCSV=function(datos) {
			var data, filename, link;

			var csv = this.convertArrayOfObjectsToCSV({
				data: datos
			});
			if (csv == null) return;

			filename = 'export.csv';

			if (!csv.match(/^data:text\/csv/i)) {
				csv = 'data:text/csv;charset=utf-8,' + csv;
			}
			data = encodeURI(csv);

			link = document.createElement('a');
			link.setAttribute('href', data);
			link.setAttribute('download', filename);
			link.click();
		}
		return qbDijit;
	});