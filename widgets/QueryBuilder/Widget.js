define(['dojo/_base/declare',
        'dojo/_base/html',
        'dojo/query',
        'dojo/dom',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        './QueryBuilder'
    ],
    function(declare, html, query, dom, _WidgetsInTemplateMixin, BaseWidget,QueryBuilder) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-querybuilder',
            name: 'QueryBuilder',
            className: 'esri.widgets.QueryBuilder',
            layerGrafico : new esri.layers.GraphicsLayer({
                "opacity": 0.7
            }),
            layerGraficoSeleccionado : new esri.layers.GraphicsLayer({
                "opacity": 0.8
            }),

            postCreate: function() {
                this.inherited(arguments);
                this.map.addLayer(this.layerGrafico);
                this.map.addLayer(this.layerGraficoSeleccionado);
            },

            startup: function() {
                this.inherited(arguments);

                this.qb = new QueryBuilder({
                    map: this.map,
                    geometryService: this.config.geometryService,
                    layerGrafico: this.layerGrafico,
                    layerGraficoSeleccionado: this.layerGraficoSeleccionado,
                    layers:this.config.layers
                });
                
                this.qb.placeAt(this.qbNode);
                this.qb.startup();
            },

            onOpen: function(){
                var panel = this.getPanel();    
                //panel.position.height = 900; 
                //panel.setPosition(panel.position);        
                panel.panelManager.normalizePanel(panel); 
                console.log('onOpenWidget');
                console.log(panel);
                //console.log(this.map);
                

            },

            onClose: function(){
                this.layerGrafico.clear();
                this.layerGraficoSeleccionado.clear();

            },

            onMinimize: function(){
                console.log('onMinimize');
            },

            onMaximize: function(){
                console.log('onMaximize');
            }
        });
        return clazz;
    });