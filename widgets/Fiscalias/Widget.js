///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dojo/Deferred',
    'dojo/store/Memory',
    'dgrid/OnDemandGrid',
    'dgrid/Selection',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/popup',
    'dijit/TooltipDialog',
    'esri/geometry/Polyline',
    'esri/dijit/Search',
    'esri/tasks/locator',
    'esri/layers/FeatureLayer',
    'esri/InfoTemplate',
    'esri/symbols/SimpleLineSymbol',
    'esri/graphic',
    'esri/Color',
    'esri/tasks/query',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/geometry/geometryEngine',
    'esri/SpatialReference',
    'esri/renderers/SimpleRenderer',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/layers/LabelClass',
    'esri/dijit/PopupTemplate',
    'esri/dijit/Scalebar',
    'esri/geometry/Point',
    'esri/geometry/geodesicUtils',
    'esri/toolbars/draw',
    'esri/tasks/QueryTask',
    'jimu/BaseWidget',
    'jimu/dijit/GridLayout',
    'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    './DijitFactory',
    'jimu/DataSourceManager',
    './dijits/SourceLauncher',
    './dijits/ExtraSourceLauncher',
    './_ChartSetting',
    './IGUtils',
    './utils',
    'dijit/focus',
    './a11y/widget',
    "xstyle/css!../../libs/goldenlayout/goldenlayout-base.css"
    
  ],
  function(declare, lang, array, html, query, on, Grid, Selection, Deferred, Memory, _WidgetsInTemplateMixin, dojoPopup,
    TooltipDialog, Polyline, Search, Locator, FeatureLayer, InfoTemplate, SimpleLineSymbol, Graphic, Color, Query, SimpleMarkerSymbol, SimpleFillSymbol, geometryEngine, SpatialReference, SimpleRenderer, TextSymbol, Font, LabelClass, PopupTemplate, Scalebar, Point, geodesicUtils, Draw, QueryTask, BaseWidget, GridLayout, LayerInfos, jimuUtils, DijitFactory, DataSourceManager,
    SourceLauncher, ExtraSourceLauncher, ChartSetting, IGUtils, utils, focusUtil, a11y) {

      
      

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Fiscalias',
      baseClass: 'jimu-widget-Fiscalias',
      dijits: null,
      clientFeaturesHandle: null,
      layerInfosObj: null,
      dataSource: null,
      mainDijit: null,
      mainDijitJson: null,
      mainDijitVisible: false,

      postMixInProperties: function() {
        this.inherited(arguments);
        lang.mixin(this.nls, window.jimuNls.statisticsChart);
        this.layerInfosObj = LayerInfos.getInstanceSync();
        this._loadingTypes = {};
      },

      postCreate: function() {
        this.inherited(arguments);
        this.upgradeConfig(this.config);
        this._initGolbalInfo();
        this._listenDSManagerUpdateEvent();
        //init dijit factory to create all dijit by template
        this._initDijitFactory();
        //hide runtime setting popup when click widget
        this._initSettingIconEvent();
        this.initForA11yBeforeStartup();
      },

      upgradeConfig: function(config) {
        //2.13 update config.dijit(image).config.alt
        if (!config || !config.dijits) {
          return;
        }
        var image = config.dijits.filter(function(dijit) {
          return dijit.type === 'image';
        })[0];
        if (image && image.config && !image.config.alt) {
          image.config.alt = window.jimuNls.common.image;
        }
      },

      startup: function() {
        
        var MapaGeneral = this.map;
        
        this.inherited(arguments);
        //render ui by config
        this._renderByConfig(this.config);
        //init main dijit after dijits are created
        this.mainDijit = this._getMainDijit();
        //create run time setting icon
        this._createRuntimeSettingIocn(this.config);
        //check data source
        this._checkDataSource(this.config);
        //if main dijit is visible and data source is valid,
        //continue processing data sources for more information.
        if (this.mainDijitVisible && this._avalidDataSource) {
          this._processdsdef = this._preprocessingDataSource();
        }

        //Desde aqui empieza el código para Fiscalías.

        //Configuraciones capa de segmentos  
        console.log(this.map._layers);
        infoTemplateSeg= new InfoTemplate("Segmento vial",
        "CIV: ${CIV}</br>Código vía: ${CODIGOVIA}</br>Código UPZ: ${CODIGOUPZ}</br>Clasificación: ${TIPOCLASIFICACIONSUELO}</br>Sección vial: ${SECCIONVIAL}</br>Tipo de malla: ${TIPOMALLA}");      
        var segmentos = new FeatureLayer("https://webidu.idu.gov.co/servergis1/rest/services/DTE/InventarioIDU/MapServer/0", {
            //infoTemplate: infoTemplateSeg,
            id: "Segmentos Viales Fiscalías", 
            outFields: ["*"],
            name: "Segmentos Viales Fiscalías"
        });
        
        
        segmentos.setRenderer(new SimpleRenderer(new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0, 0]),
            8),));
        /*
        var colorEtiSeg = new Color("#f0f8ff");
        var segmentosEti = new TextSymbol({
            font: new Font("14", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "Helvetica")
          }).setColor(colorEtiSeg );
        var labelSeg = new LabelClass({"labelExpressionInfo": {"value": "{CIV}"}});
        labelSeg.labelPlacement= "below-after";
        labelSeg.symbol = segmentosEti; 
        segmentos.setLabelingInfo([labelSeg]);   

        segmentos.on('click', function (event) {
            this.map.infoWindow.setFeatures([event.graphic]);
        });      
        */        

        //Segmentos respaldo
        var segmentosRes = new FeatureLayer("https://webidu.idu.gov.co/servergis1/rest/services/DTE/InventarioIDU/MapServer/0", {
            outFields: ["*"]
        });       

        //Configuraciones capa de Puentes
        var puentes = new FeatureLayer("https://webidu.idu.gov.co/servergis1/rest/services/DTE/InventarioIDU/MapServer/1", {
        infoTemplate: new PopupTemplate({
                title:"Puente PK_ID: {PK_ID_PUENTE}", 
        description: "Uso: {USO} </br> Nivel: {NIVELPUENTE} </br> Localidad: {LOCALIDAD}</br> Tipo malla vial: {MALLAVIAL} </br>Tipo de suelo: {TIPOSUELO}</br> Cuerpo de agua: {CUERPOAGUA} </br> Ubicación: {UBICACION}</br> UPZ: {UPZ}"}), 
            outFields: ["PK_ID_PUENTE","USO","NIVELPUENTE","LOCALIDAD","VIACRUZA","MALLAVIAL","TIPOSUELO","CUERPOAGUA","UBICACION","UPZ"],
            id: "Puentes Peatonales Fiscalías",
            outFields: ["*"],
            name: "Puentes Peatonales Fiscalías"
        });  

        puentes.setDefinitionExpression("USO = 2");
        
        puentes.setRenderer(new SimpleRenderer(
            symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([0, 0, 0, 0]), 0),
                new Color([0, 0, 0, 0])),)
        );
        
        puentes.on('click', function (event) {
            this.map.infoWindow.setFeatures([event.graphic]);
        });      
        

        //console.log(puentes);
        var puentesvehiculares = new FeatureLayer("https://webidu.idu.gov.co/servergis1/rest/services/DTE/InventarioIDU/MapServer/1", {
        infoTemplate: new PopupTemplate({
                title:"Puente PK_ID: {PK_ID_PUENTE}", 
        description: "Uso: {USO} </br> Nivel: {NIVELPUENTE} </br> Localidad: {LOCALIDAD}</br> Tipo malla vial: {MALLAVIAL} </br>Tipo de suelo: {TIPOSUELO}</br> Cuerpo de agua: {CUERPOAGUA} </br> Ubicación: {UBICACION}</br> UPZ: {UPZ}"}), 
            outFields: ["PK_ID_PUENTE","USO","NIVELPUENTE","LOCALIDAD","VIACRUZA","MALLAVIAL","TIPOSUELO","CUERPOAGUA","UBICACION","UPZ"],
            id: "Puentes Vehiculares Fiscalias",
            outFields: ["*"],
            name: "Puentes Vehiculares Fiscalias"
        });  

        puentesvehiculares.setDefinitionExpression("USO = 1");
        
        
        puentesvehiculares.setRenderer(new SimpleRenderer(
            symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([0, 0, 0, 0]), 0),
                new Color([0, 0, 0, 0])),)
        ); 
                 
        puentesvehiculares.on('click', function (event) {
            this.map.infoWindow.setFeatures([event.graphic]);
        });
        
        //Configuraciones capa de calzada
        
        infoTemplateCal= new InfoTemplate("Calzadas", "CIV: ${CIV}</br>Código calzada: ${PK_ID_CALZADA}</br>Número de carriles: ${NUMEROCARRILES}");  
        
        var calzada = new FeatureLayer("https://webidu.idu.gov.co/servergis1/rest/services/DTE/InventarioIDU/MapServer/8", {
            infoTemplate: infoTemplateCal,
            id: "Calzadas",
            outFields: ["*"]
        }); 
        /*
        var calzada = new FeatureLayer(this.map._layers.InventarioIDU_6362.url + '/8', {
          infoTemplate: infoTemplateCal,
          id: "Calzadas Fiscalías",
          outFields: ["*"],
          name: "Calzadas Fiscalías"
        });*/ 
      
        calzada.setRenderer(new SimpleRenderer(
            symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_NULL,
                new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([0, 0, 0, 0]), 0),),)
        );  
        
        calzada.on('click', function (event) {
            this.map.infoWindow.setFeatures([event.graphic]);
        }); 
        


        //Configuraciones capa de seguimiento poligono
        var infoTemplateSegPol = new PopupTemplate({
        title: "Seguimiento Poligono",
        description: "CIV: {CIV}</br>PK_ELEMENTO: {PK_ELEMENTO}</br>Tipo elemento: {TIPOELEMENTO}</br>Localidad: {LOCALIDAD}</br>Contrato: {CONTRATO}</br>Estado: {ESTADO}</br>Intervencion: {INTERVENCION}</br>Entidad: {ENTIDAD}</br>Fecha reporte: {FECHAREPORTE:DateFormat(selector: 'date', local: true, fullYear: true)}" 
        }); 
        var SeguimientoPoligono = new FeatureLayer("https://services2.arcgis.com/qAnmJmgmnVso8Fzo/ArcGIS/rest/services/REPORTE_FISCALIAS/FeatureServer/0", {
            infoTemplate: infoTemplateSegPol,
            id: "Seguimiento Poligono",
        visible: false,
            outFields: ["CIV","PK_ELEMENTO","TIPOELEMENTO","LOCALIDAD","CONTRATO","ESTADO","INTERVENCION","ENTIDAD","FECHAREPORTE"]
        }); 
        SeguimientoPoligono.setRenderer(new SimpleRenderer(
          
        symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([0, 0, 0, 0]), 0),
                new Color([0, 0, 0, 0])),)
        );  

        SeguimientoPoligono.on('click', function (event) {
            this.map.infoWindow.setFeatures([event.graphic]);
        }); 

        capasAdd= [calzada, puentes, puentesvehiculares, segmentos];
        capasFin= [calzada, puentes, puentesvehiculares];
        //MapaGeneral.addLayers(capasAdd);
        //console.log(this.map);

         //Descargar imagen png

        document.getElementById('descargarPNG').onclick = function() {
          domtoimage.toPng(document.getElementById('map')).then(function(png) {
              window.saveAs(png, 'mapa.png');
            });
          /*  
          for(j=0; j< capasAdd.length; j++) {        
            MapaGeneral.removeLayer(capasAdd[j].id);
          };*/
        };

        /*
        puentes.on('click', function (event) {
          MapaGeneral.infoWindow.setFeatures([event.graphic]);
       });*/   
       

        
          //Simbología para punto de dirección
          symbolP = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_DIAMOND, 
            20, new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID, 
                    new Color([0, 0, 200, 0.5]), 10), 
                new Color([0, 0, 200, 0.9]));
        
          //Simbología segmento seleccionado
          symbolL= new SimpleLineSymbol(
                  SimpleLineSymbol.STYLE_DASH,
                  new Color([255, 159, 51,0.85]), 7);    
                 
        
          //Simbología para puentes seleccionados
          symbolSelectedP = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([70, 255, 51, 0.9]), 7
          ), new Color([70, 255, 51, 0.5]));               
        
          //Simbología para calzadas seleccionadas
          symbolSelectedC = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_NULL,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0, 0.9]), 7
            ), new Color([255, 0, 0, 0.5]));    

          //Simbología para puentes vehiculares seleccionados
          symbolSelectedPV = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([243, 255, 0, 0.9]), 7
          ), new Color([171, 10, 146, 0.5]));             
        
        //Widget de busqueda
          var search = new Search({
            map: this.map,
            allPlaceholder: "Busqueda por dirección o CIV",
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: false,                
            sources: [{
                locator: new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                singleLineFieldName: "SingleLine",
                countryCode: "COL, CO",
                outFields: ["Addr_type"],
                placeholder: "Busqueda por dirección",      
                locationType: "street",
                singleLineFieldName: "SingleLine", 
                name: "Busqueda por Direcciones"
                },{
                featureLayer: segmentos,
                highlightSymbol: symbolL,
                searchFields: ["CIV"],
                outFields: ["CIV", "CODIGOUPZ", "CODIGOVIA", "TIPOCLASIFICACIONSUELO", "SECCIONVIAL", "TIPOMALLA", "UBICACION", "CODIGOLOCALIDAD", "SHAPE.LEN"],
                placeholder: "Busqueda por CIV",                        
                name: "Busqueda por CIV - segmentos viales"
                }]
          }, "search");
          search.startup(); 
          //console.log(search);
            
          
        //Función que realiza las consultas
          var tipoMalla= "";
          function consultaCapas(capa, civ, simbolo, tipo, distancia, geometria) {
            
            var query= new Query();
            if(distancia== ""){
                query.where= "CIV= " + civ;
                //console.log(query.where);
                capa.setSelectionSymbol(simbolo);
                capa.selectFeatures(query, FeatureLayer.SELECTION_NEW);
                //console.log(capa);
                if(tipo== 0){
                    capa.on("selection-complete", function(evt) {
                        if(capa.id== "Segmentos viales") {
                            var dominioTM = segmentos.getDomain("TIPOMALLA", {feature: evt.features[0].attributes["TIPOMALLA"]});
                            tipoMalla= dominios(dominioTM, evt.features[0].attributes["TIPOMALLA"]);
                        };
                        seleccionAtr(civ, evt.features[0].geometry, 1);
                        
                    });  
                } else if (tipo== 1){
                    //capa.on("selection-complete", populateGrid, "");
                                          
                };                    
            } else {
                query.units= "meters";
                query.distance= distancia;
                query.geometry= geometria;
                capa.setSelectionSymbol(symbolSelectedP);
                capa.selectFeatures(query, FeatureLayer.SELECTION_ADD);                    
            };
          };            
        
          //Función que ancla los resultados de la busqueda con las capas
          search.on("search-results", function(e){
          document.getElementById("borrarG").style.display = 'block';
            if(e.value.length> 10){
                var graphic1 = new Graphic(e.results[0][0].feature.geometry, symbolP);
                MapaGeneral.graphics.add(graphic1); 
               
                consultaCapas(segmentosRes, "", "", "", 50, e.results[0][0].feature.geometry);
                segmentosRes.on("selection-complete", function(evt) {
                    //console.log(evt);  
                    cercaDistancia= Array();
                    for(i=0; i<evt.features.length; i++) {
                        cercaDistancia.push(geometryEngine.nearestCoordinate(evt.features[i].geometry, e.results[0][0].feature.geometry).distance);
                    };
                    var queryApp4= new Query();
                    console.log(Math.min.apply(Math, cercaDistancia));
                    
                    consultaCapas(segmentos, evt.features[cercaDistancia.indexOf(Math.min.apply(Math, cercaDistancia))].attributes.CIV, symbolL, 0, "", "");
                    //consultaCapas(calzada, evt.features[cercaDistancia.indexOf(cercaDistancia.min())].attributes.CIV, symbolSelectedC, 1, "", "");
                    //console.log("CIV = " + evt.features[cercaDistancia.indexOf(cercaDistancia.min())].attributes.CIV);
                                   
                    
                });
             } else {
                 consultaCapas(segmentos, e.value, symbolL, 0, "", "");
                 
             };
             this.map.addLayers(capasAdd);
             
             
             //console.log(capasAdd);
          });
        
        //Función que busca por atributo a calzada
          function seleccionAtr(consulta, geometriaB, tipo) {
            prueba= Array(10).fill(0);
            //console.log(consulta, geometriaB);

            consultaCapas(calzada, consulta, symbolSelectedC, 1, "", "");
            consultaCapas(puentes, "", symbolSelectedP, "", 300, geometriaB);
            consultaCapas(puentesvehiculares, "", symbolSelectedPV, "", 300, geometriaB);
            puentes.on("selection-complete", function(evt) {
                if(evt.features.length>0) {
                    
                    document.getElementById("datosPuente").style.display = 'block';
                    centroideSeg= new Point([(geometriaB.paths[0][0][0] + geometriaB.paths[0][geometriaB.paths.length][0])/2, (
                        geometriaB.paths[0][0][1] + geometriaB.paths[0][geometriaB.paths.length][1])/2],new SpatialReference({ wkid:4686 }));
                    var cercaPuente= [];
                    var lineaCerca= [];
                    for(i=0; i<evt.features.length; i++){
                        lineaCerca[i]= new Polyline([[centroideSeg.x, centroideSeg.y], [geometryEngine.nearestCoordinate(evt.features[i].geometry, centroideSeg).coordinate.x, geometryEngine.nearestCoordinate(evt.features[i].geometry, centroideSeg).coordinate.y]]);                            
                        console.log(lineaCerca[i]);
                        cercaPuente.push(geodesicUtils.geodesicLengths([lineaCerca[i]], esri.Units.METERS)[0]);
                    };
                    document.getElementById("puenteCerca").innerText= evt.features[cercaPuente.indexOf(Math.min.apply(Math, cercaPuente))].attributes.UBICACION + " (PK ID " + evt.features[cercaPuente.indexOf(Math.min.apply(Math, cercaPuente))].attributes.PK_ID_PUENTE + ")";
                    document.getElementById("distancia").innerText= Math.min.apply(Math, cercaPuente).toFixed(1) + " metros"
                    //this.map.centerAndZoom(centroideSeg, 9);
                 };
                console.log(cercaPuente);
                console.log(cercaPuente);
                //populateGrid(evt, cercaPuente);
            });
          puentesvehiculares.on("selection-complete", function(evt) {
                if(evt.features.length>0) {
                    document.getElementById("datosPuentevehi").style.display = 'block';
                    centroideSeg= new Point([(geometriaB.paths[0][0][0] + geometriaB.paths[0][geometriaB.paths.length][0])/2, (
                        geometriaB.paths[0][0][1] + geometriaB.paths[0][geometriaB.paths.length][1])/2],new SpatialReference({ wkid:4686 }));
                    var cercaPuentevehi= [];
                    var lineaCercavehi = [];
                    for(i=0; i<evt.features.length; i++){
                        lineaCercavehi[i]= new Polyline([[centroideSeg.x, centroideSeg.y], [geometryEngine.nearestCoordinate(evt.features[i].geometry, centroideSeg).coordinate.x, geometryEngine.nearestCoordinate(evt.features[i].geometry, centroideSeg).coordinate.y]]);                            
                        cercaPuentevehi.push(geodesicUtils.geodesicLengths([lineaCercavehi[i]], esri.Units.METERS)[0]);
                    };
                    document.getElementById("puenteCercavehi").innerText= evt.features[cercaPuentevehi.indexOf(Math.min.apply(Math, cercaPuentevehi))].attributes.UBICACION + " (PK ID " + evt.features[cercaPuentevehi.indexOf(Math.min.apply(Math, cercaPuentevehi))].attributes.PK_ID_PUENTE + ")";
                    document.getElementById("distanciavehi").innerText= Math.min.apply(Math, cercaPuentevehi).toFixed(2) + " metros"
                    //this.map.centerAndZoom(centroideSeg, 9);
                 };
        //console.log(cercaPuentevehi);
                populateGrid(evt, cercaPuentevehi);
            });
        };      
        
       
        
       
        
        //Funciòn que borra la selecciòn de capas
      function borrarSeleccion() {
        //console.log("Entro");
          for(j=0; j< capasFin.length; j++) {
              capasFin[j].clearSelection();
              segmentos.clearSelection();
          };               
      };
        
      function borrarSearch() {
          borrarSeleccion();
          MapaGeneral.graphics.clear();
          for(i=0; i< capasAdd.length; i++) {
              MapaGeneral.removeLayer(capasAdd[i]);
          }; 
          limpiarHTML();
          search.clear(); 
      };
        
        search.on("clear-search", function(evt) {
            borrarSearch();
        });
        
        document.getElementById('borrarG').onclick = function() {
            
            borrarSearch();
        };
        
        //Variables que almacenan los atributos
        var gridPuente = new (declare([Grid, Selection]))({
            bufferRows: Infinity,
            allowTextSelection: true,
            columns: {
                    PK_ID_PUENTE: "CÓDIGO",
                    TIPOPUENTE: "TIPO",
                    //LOCALIDAD: "LOCALIDAD",
                    UBICACION: "UBICACIÓN",                    
                    //CUERPOAGUA: "CUERPO DE AGUA",
                    DISTANCIA: "DISTANCIA AL SINIESTRO (m)"
                }
        }, "divPuente"); 


        var gridPuentevehi = new (declare([Grid, Selection]))({
            bufferRows: Infinity,
            allowTextSelection: true,
            columns: {
                    PK_ID_PUENTE: "CÓDIGO",
                    TIPOPUENTE: "TIPO",
                    //LOCALIDAD: "LOCALIDAD",
                    UBICACION: "UBICACIÓN",                    
                    //CUERPOAGUA: "CUERPO DE AGUA",
                    DISTANCIA: "DISTANCIA AL SINIESTRO (m)"
                }
        }, "divPuentevehi");
        
        var gridCalz = new (declare([Grid, Selection]))({
            bufferRows: Infinity,
            allowTextSelection: true,
            columns: {
                    CIV: "CIV", 
                    PK_ID_CALZADA: "CÓDIGO",                    
                    ANCHOCALZADA: "ANCHO",
                    LOGITUDHORIZONTAL: "LOGITUD HORIZONTAL",                    
                    TIPOSUPERFICIE: "TIPO SUPERFICIE",
                    NUMEROCARRILES: "NÚMERO CARRILES",
                    TIPOF: "TIPO FUNCIONALIDAD",
                    TIPOM: "TIPO MALLA"
                }
        }, "divCalz");    

        var gridSegpol = new (declare([Grid, Selection]))({
            bufferRows: Infinity,
            allowTextSelection: true,
            columns: {
                    CIV: "CIV", 
                    PK_ID_CALZADA: "CÓDIGO",                    
                    ANCHOCALZADA: "ANCHO",
                    LOGITUDHORIZONTAL: "LOGITUD HORIZONTAL",                    
                    TIPOSUPERFICIE: "TIPO SUPERFICIE",
                    NUMEROCARRILES: "NÚMERO CARRILES",
                    TIPOF: "TIPO FUNCIONALIDAD",
                    TIPOM: "TIPO MALLA"
                }
        }, "divSegpol");  			
        
        function numeroElementos(datos) {
            if(datos> 999){
                return "> 1000";
            } else {
                return datos;
            };                
        };
        
        //Función que retorna los nombres de los dominios
        function dominios(dominio, registro) {
        //console.log(dominio, registro);
            for(j=0; j< dominio.codedValues.length; j++) {
                if(registro== dominio.codedValues[j].code) {
                    return dominio.codedValues[j].name
                    break;
                };
            };                   
        };
        
        //Función que llena la tabla de datos
        function datosGrid(datosSeleccionados, camposCapa, nada, algo, algoB, algoC, indiceCapa, distancia){
            arregloDatos=[];
            if (datosSeleccionados.target.id == "Puentes"){
                for(i=0; i< datosSeleccionados.features.length; i++){
                    var dominioCP = puentes.getDomain("LOCALIDAD", {feature: datosSeleccionados.features[i]});
                    var dominioM = puentes.getDomain("CUERPOAGUA", {feature: datosSeleccionados.features[i]});
                    arregloDatos.push({"OBJECTID": datosSeleccionados.features[i].attributes["OBJECTID"],
                        "PK_ID_PUENTE": datosSeleccionados.features[i].attributes["PK_ID_PUENTE"],
                         "TIPOPUENTE": "Puente peatonal",                  
                         //"LOCALIDAD": dominios(dominioCP, datosSeleccionados.features[i].attributes["LOCALIDAD"]),                   
                         "UBICACION": datosSeleccionados.features[i].attributes["UBICACION"],                    
                         //"CUERPOAGUA": dominios(dominioM, datosSeleccionados.features[i].attributes["CUERPOAGUA"]),
                         "DISTANCIA": (distancia[i]).toFixed(2)
                    });
                };
            } else if (datosSeleccionados.target.id == "Calzadas"){
                for(i=0; i< datosSeleccionados.features.length; i++){
                    var domainFun = calzada.getDomain("TIPOFUNCIONALIDAD", {feature: datosSeleccionados.features[i]}); 
                    var domainCal = calzada.getDomain("TIPOSUPERFICIE", {feature: datosSeleccionados.features[i]});                   
                    arregloDatos.push({"OBJECTID": datosSeleccionados.features[i].attributes["OBJECTID"],
                         "CIV": datosSeleccionados.features[i].attributes["CIV"],
                         "PK_ID_CALZADA": datosSeleccionados.features[i].attributes["PK_ID_CALZADA"],
                         "ANCHOCALZADA": datosSeleccionados.features[i].attributes["ANCHOCALZADA"],                  
                         "LOGITUDHORIZONTAL": datosSeleccionados.features[i].attributes["LOGITUDHORIZONTAL"],                                      
                         "TIPOSUPERFICIE": dominios(domainCal, datosSeleccionados.features[i].attributes["TIPOSUPERFICIE"]),
                         "NUMEROCARRILES": datosSeleccionados.features[i].attributes["NUMEROCARRILES"],
                         "TIPOF": dominios(domainFun, datosSeleccionados.features[i].attributes["TIPOFUNCIONALIDAD"]),   
                         "TIPOM": tipoMalla
                    });
                };                           
            } else if (datosSeleccionados.target.id == "Puentesvehiculares"){
                for(i=0; i< datosSeleccionados.features.length; i++){
                    var dominioCPvehi = puentesvehiculares.getDomain("LOCALIDAD", {feature: datosSeleccionados.features[i]});
                    var dominioMvehi = puentesvehiculares.getDomain("CUERPOAGUA", {feature: datosSeleccionados.features[i]});
                    arregloDatos.push({"OBJECTID": datosSeleccionados.features[i].attributes["OBJECTID"],
                        "PK_ID_PUENTE": datosSeleccionados.features[i].attributes["PK_ID_PUENTE"],
                         "TIPOPUENTE": "Puente vehicular",                  
                         //"LOCALIDAD": dominios(dominioCP, datosSeleccionados.features[i].attributes["LOCALIDAD"]),                   
                         "UBICACION": datosSeleccionados.features[i].attributes["UBICACION"],                    
                         //"CUERPOAGUA": dominios(dominioM, datosSeleccionados.features[i].attributes["CUERPOAGUA"]),
                         "DISTANCIA": (distancia[i]).toFixed(2)
                    });
                };
            };
            var memStore = new Memory({
                data: arregloDatos
            });                 
            document.getElementById(nada).style.display = 'none';
            document.getElementById(algo).style.display = 'block';
            document.getElementById(algo).innerText = "Elemento(s) seleccionado(s): " + datosSeleccionados.features.length;
            document.getElementById(algoB).style.display = 'block';  
            document.getElementById(algoC).style.display = 'block';  
            prueba[indiceCapa]= datosSeleccionados.features.length;
            return memStore;
        };
        
        //Función que oculta html cuando se borra la consulta
        function ocultarHTML(algoB, algo, nada, algoC, datos, indiceCapa){
            datos.set("store", null);
            document.getElementById(algoB).style.display = 'none';  
            document.getElementById(algoC).style.display = 'none';  
            document.getElementById(algo).style.display = 'none';   
            document.getElementById(nada).style.display = 'block';  
            prueba[indiceCapa]= 0;
            borrarGraficos(prueba);
            capasFin[indiceCapa].clearSelection();                
        };
        
        //Función que llena la tabla de atributos
        function populateGrid(results, distancia) {
            if(results.features.length> 0) {
                //Segmentos viales
                if (results.target.id == "Puentes") {
        //console.log(results, distancia);
                    gridPuente.set("store", datosGrid(results, "PK_ID_PUENTE", "nadaPuente", 'algoPuente', 'algoPuenteB', 'algoPuenteC', 1, distancia));  
                    document.getElementById("algoPuenteB").onclick= function() {
                        ocultarHTML('algoPuenteB', 'algoPuente', 'nadaPuente', 'algoPuenteC', gridPuente, 1);
                    };                    
                } else if (results.target.id == "Calzadas") {
                    gridCalz.set("store", datosGrid(results, "PK_ID_CALZADA", "nadaCalz", 'algoCalz', 'algoCalzB', 'algoCalzC', 0));
                    document.getElementById("algoCalzB").onclick= function() {
                        ocultarHTML('algoCalzB', 'algoCalz', 'nadaCalz', 'algoCalzC', gridCalz, 0); 
                        segmentos.clearSelection();
                    };  
                } if (results.target.id == "Puentesvehiculares") {
        //console.log(results, distanciavehi);
                    gridPuentevehi.set("store", datosGrid(results, "PK_ID_PUENTE", "nadaPuentevehi", 'algoPuentevehi', 'algoPuenteBvehi', 'algoPuenteCvehi', 1, distanciavehi));  
                    document.getElementById("algoPuenteBvehi").onclick= function() {
                        ocultarHTML('algoPuenteBvehi', 'algoPuentevehi', 'nadaPuentevehi', 'algoPuenteCvehi', gridPuentevehi, 1);
                    };                    
                }
            };
        };            
        
        function borrarGraficos(indicador) {
            suma = indicador.reduce((pv, cv) => pv + cv, 0);
            if(suma== 0) {
                this.map.graphics.clear(); 
            }; 
        };             
        
        //Función que limpia elementos de html
        function limpiarHTML(){
            //gridPuente.set("store", null);
            //gridCalz.set("store", null);
            //gridPuentevehi.set("store", null); 
            /* 
            document.getElementById("nadaPuente").style.display = 'block';
            document.getElementById('algoPuente').style.display = 'none';  
            document.getElementById('algoPuenteC').style.display = 'none';  
            document.getElementById('algoPuenteB').style.display = 'none';                        
            document.getElementById("nadaCalz").style.display = 'block';
            document.getElementById('algoCalz').style.display = 'none';    
            document.getElementById('algoCalzB').style.display = 'none';  
            document.getElementById('algoCalzC').style.display = 'none'; 
            */
            document.getElementById("borrarG").style.display = 'none';
            document.getElementById("datosPuente").style.display = 'none';
            
            /*
            document.getElementById("nadaPuentevehi").style.display = 'block';
            document.getElementById('algoPuentevehi').style.display = 'none';  
            document.getElementById('algoPuenteCvehi').style.display = 'none';  
            document.getElementById('algoPuenteBvehi').style.display = 'none'; 
            */            
            document.getElementById("datosPuentevehi").style.display = 'none';
        };      
          
        

        },

      _listenDSManagerUpdateEvent: function() {
        this.exdsBeginUpdateHandle = on(this.dataSourceManager, 'begin-update',
          lang.hitch(this, function(dsid) {
            this._handleLoadingStatusForExds(dsid, true);
          }));
      },

      _checkDataSource: function(config) {
        var dataSource = config && config.dataSource;
        var res = this._checkDataSourceCode(dataSource);
        this._avalidDataSource = res.code === 0;
        if (!this._avalidDataSource && this.mainDijit) {
          this.mainDijit.showNodata(res.message);
        }
      },

      onOpen: function() {
        this.removeRootNodeRole();
        //Only once the data source is initialized in startup
        //the contents of `onOpen` will be executed after init def
        if (this._processdsdef) { //first open
          this._processDataSource();
        } else { //not first open
          this._onOpenTriger();
        }
        
      },

      _onOpenTriger: function() {
        if (!this.mainDijitVisible || !this._avalidDataSource) {
          return;
        }

        //ensure this.domNode is wide and high
        this._isDOMInitialized().then(function() {
          clearInterval(this.domReadyInterval);
          this._initSourceLaunchers();
          this.initForA11y();
          this.resize();
        }.bind(this));
      },

      initForA11y: function() {
        if (this.hasInitedForA11y) {
          return;
        }
        var as = query('.has-link', this.domNode);
        if (as && as.length) {
          jimuUtils.initLastFocusNode(this.domNode, as[as.length - 1]);
        } else if (this.runtimeSettingIcon) {
          jimuUtils.initLastFocusNode(this.domNode, this.runtimeSettingIcon);
        } else {
          this._initDomNodeAsLastNode();
        }
        if (this.virtualFocusNode) {
          html.destroy(this.virtualFocusNode);
          this.virtualFocusNode = null;
        }
        this.hasInitedForA11y = true;
      },

      removeRootNodeRole: function() {
        if (!this.domNode) {
          return;
        }
        this.domNode.removeAttribute('role');
      },

      initForA11yBeforeStartup: function() {
        if (!this.domNode.hasAttribute('aria-label')) {
          var readText = this.getTextDijitConfigText();
          if (readText) {
            html.setAttr(this.domNode, "aria-label", readText);
          }
        }
      },

      //called by source launcher, returns the calculated data to render widget
      _onMainValueUpdate: function(value) {
        if (!this.mainDijit) {
          return;
        }
        var type = 'MAIN';
        if (!this._shouldUpdateValue(value, type)) {
          return;
        }
        if (this.mainDijit.type === 'gauge') {
          value = this._spellGaugeValueObj();
          if (!this._isGaugeValueObjValid(value)) {
            return;
          }
        }
        this.mainDijit.onDataSourceDataUpdate(value);
        this.mainDijit.startRendering();
      },

      _onRangeValueUpdate: function(value, isFirst) {
        var prefix = isFirst ? 'RANGE1' : 'RANGE2';
        if (!this._shouldUpdateValue(value, prefix)) {
          return;
        }

        value = this._spellGaugeValueObj();

        if (!this._isGaugeValueObjValid(value)) {
          return;
        }
        this.mainDijit.onDataSourceDataUpdate(value);
        this.mainDijit.startRendering();
      },

      _processDataSource: function() {
        this.showLoading('process-ds');
        this._processdsdef.then(function() {
          this.hideLoading('process-ds');
          this._processdsdef = null;
          this._setDataSource();
          this._setLayerInfoToMainDijit();
          this._onOpenTriger();
        }.bind(this), function(error) {
          this.hideLoading('process-ds');
          this._processdsdef = null;
          console.error(error);
        }.bind(this));
      },

      _setDataSource: function() {
        var dataSource = this.config && this.config.dataSource;
        if (!dataSource) {
          return;
        }
        if (!this.dijits || !this.dijits.length) {
          return;
        }
        this.dijits.forEach(function(dijit) {
          dijit.setDataSource(dataSource);
        });
      },

      _initSourceLaunchers: function() {
        if (!this.config.dataSource) {
          return;
        }
        var dijitJson = this.mainDijitJson || this._getMainDijitJson();
        // If it is the first to open, create sourceLauncher, otherwise, wake up it
        if (!this.sourceLauncher) {
          this._initSourceLauncher();
          this.sourceLauncher.start();
        } else {
          this.sourceLauncher.awake();
        }
        //For gauge, we need create more extra stat source launcher for statistical range
        if (dijitJson.type === 'gauge') {
          this._initRangeSourceLauncher(dijitJson);
        }
      },

      resize: function() {
        this.inherited(arguments);
        if (this.layout) {
          this.layout.resize();
        }
        if (this.mainDijit && this.mainDijit.resize) {
          this.mainDijit.resize();
        }
      },

      onClose: function() {
        if (this.sourceLauncher) {
          this.sourceLauncher.sleep();
        }
        if (this.rangeSourceLauncher1) {
          this.rangeSourceLauncher1.sleep();
        }
        if (this.rangeSourceLauncher2) {
          this.rangeSourceLauncher2.sleep();
        }
        if (this.runtimeSettingDialog && this.runtimeSettingDialog.isShow) {
          dojoPopup.close(this.runtimeSettingDialog);
          this.runtimeSettingDialog.isShow = false;
        }
      },

      //Called when extral ds/widget output ds is changed
      onDataSourceDataUpdate: function(dsId, data) {
        this._handleLoadingStatusForExds(dsId, false);
        var ds = this.config.dataSource;
        var ds1 = this.rangeDataSource1;
        var ds2 = this.rangeDataSource2;
        if (ds && dsId === ds.frameWorkDsId) {
          if (this.sourceLauncher) {
            this.sourceLauncher.setAppConfigDSFeatures(data.features);
          }
        }
        if (ds1 && dsId === ds1.frameWorkDsId) {
          if (this.rangeSourceLauncher1) {
            this.rangeSourceLauncher1.setAppConfigDSFeatures(data.features);
          }
        }
        if (ds2 && dsId === ds2.frameWorkDsId) {
          if (this.rangeSourceLauncher2) {
            this.rangeSourceLauncher2.setAppConfigDSFeatures(data.features);
          }
        }
      },

      _handleLoadingStatusForExds: function(dsid, show) {
        var ds = this.config.dataSource;
        var ds1 = this.rangeDataSource1;
        var ds2 = this.rangeDataSource2;
        var mdsid = ds && ds.frameWorkDsId;
        var ds1id = ds1 && ds1.frameWorkDsId;
        var ds2id = ds2 && ds2.frameWorkDsId;
        if (dsid === mdsid || dsid === ds1id || dsid === ds2id) {
          if (show) {
            this.showLoading(dsid);
          } else {
            this.hideLoading(dsid);
          }

        }
      },

      destroy: function() {
        if (this.sourceLauncher) {
          this.sourceLauncher.destroy();
        }
        if (this.rangeSourceLauncher1) {
          this.rangeSourceLauncher1.destroy();
        }
        if (this.rangeSourceLauncher2) {
          this.rangeSourceLauncher2.destroy();
        }
        if (this.runtimeSettingDialog) {
          this.runtimeSettingDialog.destroy();
          this.runtimeSettingDialog = null;
        }
        if (this.exdsBeginUpdateHandle && this.exdsBeginUpdateHandle.remove) {
          this.exdsBeginUpdateHandle.remove();
          this.exdsBeginUpdateHandle = null;
        }
        this._loadingTypes = {};
        this.inherited(arguments);
      },

      // -------- init ------
      _initGolbalInfo: function() {
        this.dataSourceManager = DataSourceManager.getInstance();
        this._features = [];
        this.layerObject = null;
        this.popupInfo = null;
        this.featureLayerForFrameWork = null;

        this.mainDijitJson = this._getMainDijitJson();
        if (!this.mainDijitJson) {
          return;
        }
        this._initRangeValue(this.mainDijitJson);
        this._ininRangeDataSource(this.mainDijitJson);
        this.mainDijitVisible = this.mainDijitJson && this.mainDijitJson.visible;
        this.dijits = [];
        //igUtils used to process map data: definition, layer object, popup info ...
        this.igUtils = new IGUtils({
          appConfig: this.appConfig,
          map: this.map
        });
         
  
      },

      _initDijitFactory: function() {
        DijitFactory.setNls(this.nls);
        DijitFactory.setMap(this.map);
        DijitFactory.setInSettingPage(false);
        DijitFactory.setAppConfig(this.appConfig);
        DijitFactory.setContext({
          folderUrl: this.folderUrl
        });
      },

      _initSettingIconEvent: function() {
        this.on('click', lang.hitch(this, function() {
          if (this.runtimeSettingDialog) {
            dojoPopup.close(this.runtimeSettingDialog);
          }
        }));
      },

      _renderByConfig: function(config) {
        if (!config || !config.layout || !config.dijits) {
          return;
        }
        this._clearDijits();
        this._createLayoutWithDijits(config);
      },

      _initRangeSourceLauncher: function(dijitJson) {
        var rangeStatistic = this._initRangeData(dijitJson);
        var rst1 = rangeStatistic.rst1;
        var rst2 = rangeStatistic.rst2;
        if (!this.rangeSourceLauncher1) {
          if (rst1 && this.rangeDataSource1) {
            this._initRangeLauncher(rst1, this.rangeDataSource1, true);
            this.rangeSourceLauncher1.start();
          }
        } else {
          this.rangeSourceLauncher1.awake();
        }
        if (!this.rangeSourceLauncher2) {
          if (rst2 && this.rangeDataSource2) {
            this._initRangeLauncher(rst2, this.rangeDataSource2, false);
            this.rangeSourceLauncher2.start();
          }
        } else {
          this.rangeSourceLauncher2.awake();
        }
      },

      //------------- tools ----------------------

      showLoading: function(id) {
        this._loadingTypes[id] = true;
        this._showLoading();
      },

      hideLoading: function(id) {
        this._loadingTypes[id] = false;
        var shouldHide = this._shouldHideLoading();
        if (shouldHide) {
          this._hideLoading();
        }
      },

      _shouldHideLoading: function() {
        if (!this._loadingTypes) {
          return;
        }
        var ids = Object.keys(this._loadingTypes);
        var values = ids.map(function(id) {
          return this._loadingTypes[id];
        }.bind(this));
        return values.every(function(value) {
          return !value;
        });
      },

      _showLoading: function() {
        if (html.hasClass(this.shelter, 'hide')) {
          html.removeClass(this.shelter, 'hide');
        }
      },

      _hideLoading: function() {
        if (!html.hasClass(this.shelter, 'hide')) {
          html.addClass(this.shelter, 'hide');
        }
      },

      _HandlingOutliers: function(value) {
        if (!this.mainDijit) {
          return;
        }
        if (!utils.isValidValue(value)) {
          this.mainDijit.showNodata();
          return true;
        }
      },

      _spellGaugeValueObj: function() {
        return {
          value: this.MAIN_VALUE,
          ranges: [this.RANGE1_VALUE, this.RANGE2_VALUE]
        };
      },

      _isGaugeValueObjValid: function(value) {
        var valueObj = value;
        var ranges = valueObj && valueObj.ranges;
        if (!valueObj || !ranges) {
          return false;
        }
        var mainValue = valueObj.value;
        var range1Value = ranges[0];
        var range2Value = ranges[1];

        var vaild = utils.isValidValue(mainValue) &&
          utils.isValidValue(range1Value) &&
          utils.isValidValue(range2Value);

        if (!vaild) {
          this.mainDijit.showNodata();
        }
        return vaild;
      },

      _checkDataSourceCode: function(dataSource) {
        var mainDijitJson = this.mainDijitJson;
        if (!mainDijitJson) {
          return {};
        }
        var main, r1, r2;
        main = utils.checkDataSourceIsVaild(dataSource, mainDijitJson, this.map, this.appConfig, 'value');

        if (mainDijitJson.type === 'gauge') {
          if (this.rangeDataSource1) {
            r1 = utils.checkDataSourceIsVaild(this.rangeDataSource1, mainDijitJson, this.map, this.appConfig, 'range1');
          }
          if (this.rangeDataSource2) {
            r2 = utils.checkDataSourceIsVaild(this.rangeDataSource2, mainDijitJson, this.map, this.appConfig, 'range2');
          }
        }
        var results = [main, r1, r2];
        var message = '';
        var code = utils.getCheckDataSourceResultCode(results);
        results.forEach(function(res) {
          message += this._getDSErrorString(res);
        }.bind(this));

        return {
          code: code,
          message: message
        };
      },

      _getDSErrorString: function(reslut) {
        var errorString = '';
        if (!reslut) {
          return errorString;
        }
        if (reslut.code === 1 || reslut.code === 3) {
          if (reslut.label === this._lastDataSourceLabel) {
            errorString = "";
          } else {
            errorString = this.nls.dataSource + ' ' + reslut.label + ' ' + this.nls.dsErrorTipSuf;
            this._lastDataSourceLabel = reslut.label;
          }
        }
        if (reslut.code === 2) {
          errorString = this.nls.fieldString + ' ' + reslut.fields.join(',') + ' ' + this.nls.dsErrorTipSuf;
        }
        return errorString;
      },

      _clearDijits: function() {
        if (this.dijits && this.dijits.length) {
          this.dijits.forEach(lang.hitch(this, function(dijit) {
            dijit.destroy();
          }));
        }
        this.dijits = [];
      },

      _createLayoutWithDijits: function(config) {
        var dijitJsons = config.dijits;
        if (!dijitJsons || !dijitJsons.length) {
          return;
        }
        var components = dijitJsons.map(function(d) {
          var dijit = DijitFactory.createDijit(d);
          this.dijits.push(dijit);
          return {
            id: d.id,
            dijit: dijit
          };
        }, this);

        this.layout = new GridLayout({
          components: components,
          layoutDefinition: config.layout.definition,
          container: this.container,
          editable: false
        });

        this.layout.on('initialised', lang.hitch(this, function() {
          array.forEach(this.dijits, lang.hitch(this, function(dijit) {
            dijit.startup();
          }));
        }));
      },

      _getMainDijit: function() {
        if (!this.dijits || !this.dijits.length) {
          return;
        }
        var dijit = null;
        var validTypes = ['number', 'gauge', 'chart'];
        dijit = this.dijits.filter(function(dijit) {
          return validTypes.indexOf(dijit.type) > -1;
        })[0]; //Now wo only support one data-needed dijit in a widget

        return dijit;
      },

      _getMainDijitJson: function() {
        if (!this.config || !this.config.dijits || !this.config.dijits.length) {
          return;
        }
        var dijit = null;
        var validTypes = ['number', 'gauge', 'chart'];
        dijit = this.config.dijits.filter(function(dijit) {
          return validTypes.indexOf(dijit.type) > -1;
        })[0]; //Now wo only support one data-needed dijit in a widget

        return dijit;
      },

      getTextDijitConfigText: function() {
        if (!this.config || !this.config.dijits || !this.config.dijits.length) {
          return;
        }
        var text = "";
        this.config.dijits.forEach(function(dijit) {
          var t = '';
          if (dijit.visible) {
            if (dijit.type === 'text') {
              t = (dijit.config && dijit.config.text) || '';
            } else if (dijit.type === 'image') {
              t = (dijit.config && dijit.config.alt) || '';
            }
            text += (' ' + t);
          }
        });
        return text;
      },

      _initRangeValue: function(dijitJson) {
        if (!dijitJson || dijitJson.type !== 'gauge') {
          return;
        }
        var fixedValue = utils.getRangeFixedValue(dijitJson);
        this.RANGE1_VALUE = fixedValue.range1;
        this.RANGE2_VALUE = fixedValue.range2;
      },

      _ininRangeDataSource: function(dijitJson) {
        var rds = utils.getRangeDataSource(dijitJson);
        this.rangeDataSource1 = rds.range1;
        this.rangeDataSource2 = rds.range2;
      },

      _setLayerInfoToMainDijit: function() {
        if (!this.mainDijit) {
          return;
        }
        this.mainDijit.setLayerInfo(this.layerObject, this.featureLayerForFrameWork,
          this.popupInfo);
      },

      _createRuntimeSettingIocn: function(config) {
        if (!this.mainDijitVisible) {
          return;
        }
        if (!config.dijits || !config.dijits.length) {
          return;
        }

        if (!config.dijits.some(function(d) {
            return d.visible && d.type === 'chart';
          }, this)) {
          return;
        }

        this.runtimeSettingIcon = html.create('div', {
          'tabindex': "0",
          'role': "button",
          'title': this.nls.setting,
          'class': 'chart-setting'
        }, this.setting);

        this.own(on(this.runtimeSettingIcon, 'click', lang.hitch(this, this._onRuntimeSettingIconClicked)));
        this.own(on(this.runtimeSettingIcon, 'keydown', lang.hitch(this, this._onRuntimeSettingIconKeydown)));

        this.runtimeSettingDialog = new TooltipDialog({
          content: this._createChartSettingContent(config)
        });

        this.runtimeSettingDialog.isShow = false;
      },

      _onRuntimeSettingIconClicked: function(evt) {
        if (this.runtimeSettingDialog.isShow) {
          dojoPopup.close(this.runtimeSettingDialog);
          this.runtimeSettingDialog.isShow = false;
          focusUtil.focus(this.runtimeSettingIcon);
        } else {
          dojoPopup.open({
            popup: this.runtimeSettingDialog,
            around: this.runtimeSettingIcon
          });
          if (this.chartSetting) {
            this.chartSetting.focusFirst();
          }
          this.runtimeSettingDialog.isShow = true;
        }
        evt.stopPropagation();
      },

      _createChartSettingContent: function(config) {
        var chartJson = config.dijits.filter(function(d) {
          return d.type === 'chart';
        })[0]; //we don't care more than one chart.
        if (!chartJson) {
          console.error('Unknow error');
          return '<div></div>';
        }

        if (!chartJson.config) {
          return '<div></div>';
        }

        this.chartSetting = new ChartSetting({
          chartJson: chartJson,
          chartDijit: this.dijits.filter(function(d) {
            return d.jsonId === chartJson.id;
          })[0],
          nls: this.nls
        });
        this.own(on(this.chartSetting, 'escape', function() {
          dojoPopup.close(this.runtimeSettingDialog);
          this.runtimeSettingDialog.isShow = false;
          focusUtil.focus(this.runtimeSettingIcon);
        }.bind(this)));
        return this.chartSetting.domNode;
      },

      //Check whether DOM has been initialized, return a deferred
      _isDOMInitialized: function() {
        var deferred = new Deferred();
        setTimeout(function() {
          this.domReadyInterval = setInterval(function() {
            var dijitDomNode = this.mainDijit && this.mainDijit.domNode;
            if (dijitDomNode) {
              var box = html.getMarginBox(dijitDomNode);
              if (box.w && box.h) {
                deferred.resolve();
              }
            }
          }.bind(this), 200);
        }.bind(this), 200);

        return deferred;
      },

      _initSourceLauncher: function() {
        var ds = this.config.dataSource;
        if (!ds) {
          return;
        }
        var dijitJson = this._getMainDijitJson();
        if (!dijitJson || !dijitJson.config) {
          return;
        }
        //rds means range data source, rst means range statistic
        var mainStatistic = null;
        if (dijitJson.type === 'chart') {
          mainStatistic = utils.getStatisticForChart(dijitJson.config.data);
        } else {
          var statistic = utils.getStatisticForGauge(dijitJson.config);
          mainStatistic = statistic.value;
        }

        if (ds.dataSourceType === 'DATA_SOURCE_FROM_FRAMEWORK') {
          this.sourceLauncher = new ExtraSourceLauncher({
            appConfig: this.appConfig,
            dataSource: ds,
            statistic: mainStatistic,
            returnFeatures: dijitJson.type === 'chart',
            formatResult: false
          });
        } else {
          this.sourceLauncher = new SourceLauncher({
            layerObject: this.layerObject,
            map: this.map,
            appConfig: this.appConfig,
            useSelection: ds.useSelection,
            filterByExtent: ds.filterByExtent,
            dataSource: ds,
            config: dijitJson.config,
            statistic: mainStatistic,
            returnFeatures: dijitJson.type === 'chart'
          });
        }

        this._listenSourceLauncherEvent();
      },

      _initRangeData: function(dijitJson) {
        if (dijitJson.type !== 'gauge') {
          return;
        }
        if (!dijitJson || !dijitJson.config) {
          return;
        }
        //rds means range data source, rst means range statistic
        var rst1, rst2;

        var statistic = utils.getStatisticForGauge(dijitJson.config);
        rst1 = statistic.range1;
        rst2 = statistic.range2;
        return {
          rst1: rst1,
          rst2: rst2
        };
      },

      _initRangeLauncher: function(rst, rds, isFirst) {
        if (isFirst) {
          if (rst) {
            this.rangeSourceLauncher1 = new ExtraSourceLauncher({
              appConfig: this.appConfig,
              dataSource: rds,
              statistic: rst,
              returnFeatures: false,
              formatResult: true
            });
            this._listenRangeLauncherEvent(this.rangeSourceLauncher1, true);
          }
        } else {
          if (rst) {
            this.rangeSourceLauncher2 = new ExtraSourceLauncher({
              appConfig: this.appConfig,
              dataSource: rds,
              statistic: rst,
              returnFeatures: false,
              formatResult: true
            });
            this._listenRangeLauncherEvent(this.rangeSourceLauncher2, false);
          }
        }

      },

      _listenSourceLauncherEvent: function() {
        this.own(on(this.sourceLauncher, 'data-update', lang.hitch(this, function(value) {
          this._onMainValueUpdate(value);

        })));
        this.own(on(this.sourceLauncher, 'loading', lang.hitch(this, function(id) {
          this.showLoading(id);
        })));
        this.own(on(this.sourceLauncher, 'unloading', lang.hitch(this, function(id) {
          this.hideLoading(id);
        })));
        this.own(on(this.sourceLauncher, 'failed', lang.hitch(this, function() {
          this._HandlingOutliers();
        })));

        this.own(on(this.sourceLauncher, 'start', lang.hitch(this, function() {
          this._onMainSourceLauncherStart();
        })));
        this.own(on(this.sourceLauncher, 'done', lang.hitch(this, function() {
          this._onMainSourceLauncherDone();
        })));
      },

      _onMainSourceLauncherStart: function() {
        if (this.mainDijit && typeof this.mainDijit.onUpdateDataStart === 'function') {
          this.mainDijit.onUpdateDataStart();
        }
      },

      _onMainSourceLauncherDone: function() {
        if (this.mainDijit && typeof this.mainDijit.onUpdateDataDone === 'function') {
          this.mainDijit.onUpdateDataDone();
        }
      },

      _listenRangeLauncherEvent: function(rangeLauncher, isFirstRange) {
        if (!rangeLauncher) {
          return;
        }
        this.own(on(rangeLauncher, 'data-update', lang.hitch(this, function(value) {
          this._onRangeValueUpdate(value, isFirstRange);
        })));
      },

      _isDifferentValues: function(value, type) {
        var different = true;
        var oldValue = this[type + '_VALUE'];

        if (value && typeof value.hasStatisticsed !== 'undefined') {
          var newAttrs = null,
            oldAttrs = null;
          if (value.features) {
            newAttrs = value.features.map(function(f) {
              return f.attributes;
            });
          }
          if (oldValue && oldValue.features) {
            oldAttrs = oldValue.features.map(function(f) {
              return f.attributes;
            });
          }
          if (jimuUtils.isEqual(oldAttrs, newAttrs)) {
            different = false;
          }
        } else {
          different = value !== oldValue;
        }
        if (different) {
          this[type + '_VALUE'] = value;
        }
        return different;
      },

      _shouldUpdateValue: function(value, type) {
        var isDifferent = this._isDifferentValues(value, type);
        var isOutliers = this._HandlingOutliers(value);
        return isDifferent && !isOutliers;
      },

      //get value for this.popupInfo, this.layerObject, this.featureLayerForFrameWork
      _preprocessingDataSource: function() {
        var dataSource = this.config && this.config.dataSource;
        var deferred = new Deferred();
        if (!dataSource) {
          deferred.reject('Empty data source');
          return deferred;
        }
        return this.igUtils.preprocessingDataSource(dataSource).then(function(res) {
          this.layerObject = res && res.layerObject;
          this.popupInfo = res && res.popupInfo;
          this.featureLayerForFrameWork = res && res.featureLayerForFrameWork;
          return;
        }.bind(this));
      }

    });
    



    clazz.extend(a11y); //for a11y
    return clazz;

    
  });