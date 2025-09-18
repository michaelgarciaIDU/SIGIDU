define(['dojo/_base/declare', 'jimu/BaseWidget', 'dojo/dom', "dojo/on",'dojo/_base/lang', "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
		"esri/Color", "esri/tasks/locator", "esri/geometry/Point", "esri/tasks/GeometryService", "esri/SpatialReference", "esri/tasks/ProjectParameters",
		"esri/geometry/webMercatorUtils", "esri/InfoTemplate", "esri/graphic", 'jimu/dijit/TabContainer','jimu/utils', 'jimu/SpatialReference/utils'],
function(declare, BaseWidget, dom, on, lang, SimpleMarkerSymbol, SimpleLineSymbol, Color, Locator, Point,
		 GeometryService, SpatialReference, ProjectParameters, webMercatorUtils, InfoTemplate, Graphic ,TabContainer,utils, Spatialutils) {
  //To create a widget, you need to derive from BaseWidget.
  var mapClick;
  return declare([BaseWidget], {
    onOpen: function(){
      console.log('It is open, come on in!');
	  var mapFrame = this;
	  var map = this.map;
	  mapClick = map.on("click", clickLoc);
	  
	  var Long, Lat, Latdegrees, Latminutes, Latseconds, projectPoint, Spat, myClickPoint;
	  var Longdegrees, Longminutes, Longseconds;
	  var degrees, minutes, seconds, m;
	  var LocPoint, graphic, NGfunction, point;
	  //Get Locator URL from settings
	  var locator = new Locator(this.config.AddressURL);
	  //Get Zoom level from settings
	  var ZoomIt = Number(this.config.ZoomLvlconfig);
	  //Get Grid URL from settings
	  var Gridlocator = new Locator(this.config.GridURL);

	  var ProjWKIDnum, ProjWKID;
	  //Get Geometry URL from settings
	  var gsvc = new GeometryService(this.config.GeometryURL);
	  var gsvc2 = new GeometryService(this.config.GeometryURL);
	  var gsvc3 = new GeometryService(this.config.GeometryURL);
	  var infoTemplate = new InfoTemplate("Location", "Dirección: ${Address}");
	  var MyMapwkid = map.spatialReference.wkid;
	  function sniffWKID (){
		if (map.spatialReference.wkid == "102100") {
			console.log("Good to go!");
		} else {
			Spatialutils.loadResource();
			var WKTCurrent = Spatialutils.getCSStr(map.spatialReference.wkid);
			function mapSpat (){
				console.log("test");
				if (WKTCurrent.charAt(0) == 'G'){
					Spat = "geo";
				} else {
					Spat = "proj";
				}
			};
			mapSpat();
		}
	  };
	  
	  sniffWKID ();
	  
	  function currentWKID (){
		ProjWKIDnum = 3116;
		ProjWKID = new SpatialReference(ProjWKIDnum);
	  };

	  
	  function clickLoc (evt){
		if (Spat == "proj") {
			console.log("Yup projected");
			var params2 = new ProjectParameters();
			params2.geometries = [evt.mapPoint];
			params2.outSR = new SpatialReference(102100);
			gsvc3.project(params2, function (evt2) {
					LocPoint = evt2[0];
					map.graphics.clear();
					map.infoWindow.hide();
					var mySpatial = new SpatialReference(4326);
					locator.locationToAddress(webMercatorUtils.webMercatorToGeographic(LocPoint), 100);
					Gridlocator.locationToAddress(webMercatorUtils.webMercatorToGeographic(LocPoint), 100);			
					LocPoint = webMercatorUtils.webMercatorToGeographic(LocPoint);
					currentWKID();
					gsvc.project([LocPoint], ProjWKID);
					mapFrame.LatTextBox.value = LocPoint.y;
					mapFrame.LongTextBox.value = LocPoint.x;
					Lat = LocPoint.y;
					Long = LocPoint.x;

			});
		} else {
			LocPoint = evt.mapPoint;
			    map.graphics.clear();
			map.infoWindow.hide();
			var mySpatial = new SpatialReference(4326);
			locator.locationToAddress(webMercatorUtils.webMercatorToGeographic(LocPoint), 100);
			Gridlocator.locationToAddress(webMercatorUtils.webMercatorToGeographic(LocPoint), 100);			
			LocPoint = webMercatorUtils.webMercatorToGeographic(LocPoint);
			currentWKID();
			gsvc.project([LocPoint], ProjWKID);
			mapFrame.LatTextBox.value = LocPoint.y;
			mapFrame.LongTextBox.value = LocPoint.x;
			Lat = LocPoint.y;
			Long = LocPoint.x;
		}
	
		
    };
	  gsvc.on("project-complete", projectComplete);
	  function projectComplete(evt){
		if ( evt.geometries[0].spatialReference.wkid == 4326){
			LocPoint = evt.geometries[0];
			locator.locationToAddress(LocPoint , 100);	
			Lat = LocPoint.y;
			Long = LocPoint.x;
			Gridlocator.locationToAddress(LocPoint, 100);
			mapFrame.LatTextBox.value = Lat;
			mapFrame.LongTextBox.value = Long;
			map.graphics.clear();
		} else {
			projectPoint = evt.geometries[0];
			console.log("break");
		}
	  }
	  
	  locator.on("location-to-address-complete", locateMe);
	  locator.on("error", function(evt){
		if (Spat == "geo"){
			graphic = new Graphic(LocPoint, symbol);
			map.graphics.add(graphic);
			map.infoWindow.resize(200,100);
			map.infoWindow.setTitle("Result");
			map.infoWindow.setContent("No Address has been found");
			map.infoWindow.show(LocPoint, map.getInfoWindowAnchor(LocPoint));
			map.centerAndZoom(LocPoint,ZoomIt);
		} else {
			var ProjSR = new SpatialReference(MyMapwkid);
			var params = new ProjectParameters();
			params.geometries = [LocPoint];
			params.outSR = ProjSR;
			gsvc2.project(params, function(projectedPoints) {
				zoomPoint = projectedPoints[0];
				graphic = new Graphic(zoomPoint, symbol);
				map.graphics.add(graphic);
				map.infoWindow.resize(200,100);
				map.infoWindow.setTitle("Result");
				map.infoWindow.setContent("No Address has been found");
				map.infoWindow.show(zoomPoint, map.getInfoWindowAnchor(zoomPoint));
				map.centerAndZoom(zoomPoint,ZoomIt);
			});
		}
			
		});
	  
	  function locateMe(evt) {
		if (evt.address.address) {
			var address = evt.address.address;
			if (Spat == "geo"){
				LocPoint = webMercatorUtils.geographicToWebMercator(evt.address.location);
				graphic = new Graphic(LocPoint, symbol, address, infoTemplate);
				map.graphics.add(graphic);
				map.infoWindow.setTitle("Resultado");
				map.infoWindow.setContent("<b>Dirección:</b> "  + evt.address.address.Address + "<br></br>" + "<b>Ciudad:</b> " + evt.address.address.City + "<br></br>" + 
				"<b><a href='http://maps.google.com/?cbll="+LocPoint.y+","+LocPoint.x+"&cbp=12,220,0,0,5&layer=c' target='_blank'>Ver ubicación en Gooogle Maps</a></b>");
				map.infoWindow.resize(250,100);
				map.infoWindow.show(LocPoint, map.getInfoWindowAnchor(LocPoint));
				map.centerAndZoom(LocPoint,ZoomIt);
			} else {
				LocPoint = evt.address.location;
				var ProjSR = new SpatialReference(MyMapwkid);
				var params = new ProjectParameters();
				params.geometries = [LocPoint];
				params.outSR = ProjSR;
				gsvc2.project(params, function(projectedPoints) {
					zoomPoint = projectedPoints[0];
					graphic = new Graphic(zoomPoint, symbol, address, infoTemplate);
					map.graphics.add(graphic);
					map.infoWindow.setTitle("Localización");
					map.infoWindow.setContent("<b>Dirección:</b> "  + evt.address.address.Address + "<br></br>" + "<b>Ciudad:</b> " + evt.address.address.City + "<br></br>" + 
					"<b><a href='http://maps.google.com/?cbll="+LocPoint.y+","+LocPoint.x+"&cbp=12,220,0,0,5&layer=c' target='_blank'>Ver ubicación en Gooogle Maps</a></b>");
					map.infoWindow.resize(250,100);
					map.infoWindow.show(zoomPoint, map.getInfoWindowAnchor(LocPoint));
					map.centerAndZoom(zoomPoint,ZoomIt);
				})
			}

		}
	   };
	  Gridlocator.on("address-to-locations-complete", locateMeGridAddress);
	  
	  function locateMeGridAddress(evt){    
		FoundPointAr = evt.addresses;
		FoundPoint = FoundPointAr[0];
		LocPoint = FoundPoint.location;
		currentWKID();
		gsvc.project([LocPoint], ProjWKID);
		locator.locationToAddress(LocPoint , 100);	
		Lat = LocPoint.y;
		Long = LocPoint.x;
		mapFrame.LatTextBox.value = Lat;
		mapFrame.LongTextBox.value = Long;
		map.graphics.clear();
    }
	  	var symbol = new SimpleMarkerSymbol(
        SimpleMarkerSymbol.STYLE_CIRCLE, 15, 
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID, 
            new Color([0, 0, 255, 0.5]), 8), 
          new Color([0, 0, 255])
		);
	  
	  //Clear button click event
	  on(this.clear, 'click', lang.hitch(this, function(evt){  
			console.log("It is clear!");
			mapFrame.LatTextBox.value = "";
			mapFrame.LongTextBox.value = "";

		}));
	  //Lat/Long button click event
	  on(this.latlong, 'click', lang.hitch(this, function(evt){  
			map.graphics.clear();
			Lat = this.LatTextBox.value;
			Long = this.LongTextBox.value;
			LocPoint = new Point([Long,Lat]);
			currentWKID();
			gsvc.project([LocPoint], ProjWKID);
			locator.locationToAddress(LocPoint , 100);
			Gridlocator.locationToAddress(LocPoint, 100);
		}));

	//When the popup is closed remove the graphic
	map.infoWindow.on("hide", function (){
		map.graphics.clear();
	});

    },
///////////////////////////////////////////////////////////////////////////////////////////////////////////
    onClose: function(){
      console.log('onClose');
	  var test = this;
	  mapClick.remove();
	  
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});