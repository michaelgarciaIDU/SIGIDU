define({
  root: ({
    _widgetLabel: "Añadir datos",

    noOptionsConfigured: "No se ha configurado ninguna opción.",

    tabs: {
      search: "Buscar",
      url: "Dirección URL",
      file: "Archivo"
    },

    search: {
      featureLayerTitlePattern: "{serviceName} - {layerName}",
      layerInaccessible: "No se puede acceder a la capa.",
      loadError: "AddData, no se puede cargar:",
      searchBox: {
        search: "Buscar",
        placeholder: "Buscar..."
      },
      bboxOption: {
        bbox: "En el mapa"
      },
      scopeOptions: {
        anonymousContent: "Contenido",
        myContent: "Mi contenido",
        myOrganization: "Mi organización",
        curated: "Depurado",
        ArcGISOnline: "ArcGIS Online"
      },
      sortOptions: {
        prompt: "Ordenar por:",
        relevance: "Relevancia",
        title: "Título",
        owner: "Propietario",
        rating: "Calificación",
        views: "Vistas",
        date: "fecha",
        switchOrder: "Cambiar"
      },
      typeOptions: {
        prompt: "Tipo",
        mapService: "Servicio de mapas",
        featureService: "Servicio de entidades",
        imageService: "Servicio de imágenes",
        vectorTileService: "Servicio de teselas vectoriales",
        kml: "KML",
        wms: "WMS"
      },
      resultsPane: {
        noMatch: "No se han encontrado resultados."
      },
      paging: {
        first: "<<",
        firstTip: "Primero",
        previous: "<",
        previousTip: "Anterior",
        next: ">",
        nextTip: "Siguiente",
        pagePattern: "{page}"
      },
      resultCount: {
        countPattern: "{count} {type}",
        itemSingular: "Elemento",
        itemPlural: "Elementos"
      },

      item: {
        actions: {
          add: "Agregar",
          close: "Cerrar",
          remove: "Quitar",
          details: "Detalles",
          done: "Hecho",
          editName: "Editar nombre"
        },
        messages: {
          adding: "Agregando...",
          removing: "Eliminando...",
          added: "Agregado",
          addFailed: "Error al agregar",
          unsupported: "No permitido"
        },
        typeByOwnerPattern: "{type} de {owner}",
        dateFormat: "MMMM d, aaaa",
        datePattern: "{date}",
        ratingsCommentsViewsPattern: "{ratings} {ratingsIcon} {comments} {commentsIcon} {views} {viewsIcon}",
        ratingsCommentsViewsLabels: {"ratings": "ratings", "comments": "comments", "views": "views"},
        types: {
          "Map Service": "Servicio de mapas",
          "Feature Service": "Servicio de entidades",
          "Image Service": "Servicio de imágenes",
          "Vector Tile Service": "Servicio de teselas vectoriales",
          "WMS": "WMS",
          "KML": "KML"
        }
      }
    },

    addFromUrl: {
      type: "Tipo",
      url: "Dirección URL",
      types: {
        "ArcGIS": "Un servicio web de ArcGIS for Server",
        "WMS": "Un servicio web de WMS OGC",
        "WMTS": "Un servicio web de WMTS OGC",
        "WFS": "Un servicio Web de WFS OGC",
        "KML": "Un archivo KML",
        "GeoRSS": "Un archivo GeoRSS",
        "CSV": "Un archivo CSV"
      },
      samplesHint: "Direcciones URL de muestra",
      invalidURL: "Introduzca una URL que comience por http:// o https://. "
    },

    addFromFile: {
      intro: "Puede colocar o buscar uno de los tipos de archivo siguientes:",
      types: {
        "Shapefile": "Un Shapefile (.zip, archivo ZIP que contiene todos los archivos shapefile)",
        "CSV": "Un archivo CSV (.csv, con dirección o latitud, longitud y delimitados por comas, puntos o tabuladores)",
        "KML": "Un archivo KML (.kml)",
        "GPX": "Un archivo (.gpx, formato de intercambio GPS)",
        "GeoJSON": "Un archivo GeoJSON (.geo.json o .geojson)"
      },
      generalizeOn: "Generalizar entidades para visualización web",
      dropOrBrowse: "Colocar o buscar",
      browse: "Examinar",
      invalidType: "Este tipo de archivo no es compatible.",
      addingPattern: "{filename}: agregando...",
      addFailedPattern: "{filename}: error al agregar",
      featureCountPattern: "{filename}: {count} entidad(es)",
      invalidTypePattern: "{filename}: este tipo no es compatible",
      maxFeaturesAllowedPattern: "Se permite un máximo de {count} entidades",
      layerNamePattern: "{filename} - {name}",
      generalIssue: "Se ha producido un problema.",
      kmlProjectionMismatch: "La referencia espacial del mapa y la capa KML no coinciden y no es posible hacer la conversión en el cliente.",
      featureLocationsCouldNotBeFound: "No se pudieron localizar las funciones: los campos de ubicación son desconocidos o no son válidos. El archivo se añadirá como tabla."
    },

    layerList: {
      caption: "Capas",
      noLayersAdded: "No se ha agregado ninguna capa.",
      removeLayer: "Quitar capa",
      back: "Atrás"
    }

  }),
  "ar": 1,
  "bg": 1,
  "bs": 1,
  "ca": 1,
  "cs": 1,
  "da": 1,
  "de": 1,
  "el": 1,
  "es": 1,
  "et": 1,
  "fi": 1,
  "fr": 1,
  "he": 1,
  "hr": 1,
  "hu": 1,
  "it": 1,
  "id": 1,
  "ja": 1,
  "ko": 1,
  "lt": 1,
  "lv": 1,
  "nb": 1,
  "nl": 1,
  "pl": 1,
  "pt-br": 1,
  "pt-pt": 1,
  "ro": 1,
  "ru": 1,
  "sk": 1,
  "sl": 1,
  "sr": 1,
  "sv": 1,
  "th": 1,
  "tr": 1,
  "uk": 1,
  "vi": 1,
  "zh-cn": 1,
  "zh-hk": 1,
  "zh-tw": 1
});
