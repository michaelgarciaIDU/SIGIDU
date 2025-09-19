define([
  'dojo/_base/declare',
  'jimu/BaseWidget'
], function(declare, BaseWidget) {

  return declare([BaseWidget], {
    baseClass: 'chatbot-widget',

    postCreate: function() {
      this.inherited(arguments);
      console.log(this.map);
    },

    startup: function() {
      this.inherited(arguments);
      this._initChatbot();
      this.genAI = new window.GoogleGenerativeAI("AIzaSyDhnRMS1d7m3HdasX6Se2Yi2Ig-9NxwzBY");
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    },

    _initChatbot: function() {
      const chatWin   = this.domNode.querySelector("#chatbot-window");
      const input     = this.domNode.querySelector("#chatbot-input");
      const send      = this.domNode.querySelector("#chatbot-send");
      const messages  = this.domNode.querySelector("#chatbot-messages");
      const clearBtn  = this.domNode.querySelector("#chatbot-clear");


      send.onclick = () => this._sendMessage(input, messages);
      input.addEventListener("keypress", e => {
        if (e.key === "Enter") this._sendMessage(input, messages);
      });


      if (clearBtn) {
        clearBtn.onclick = function() {
          messages.innerHTML = "<div><b>SIGI:</b> Hola 👋 ¿Qué deseas consultar en el Visor?</div>";
        };
      }
      
    },

    _sendMessage: function(input, messages) {
      let text = input.value.trim();
      if (!text) return;

      messages.innerHTML += `<div><b>Tú:</b> ${text}</div>`;
      input.value = "";
      messages.scrollTop = messages.scrollHeight;

      this._askGemini(text, messages);
    },

   _askGemini: function(text, messages) {
  let capasDisponibles = [];
  this.map.layerIds.forEach(id => {
    let lyr = this.map.getLayer(id);

    if (lyr.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" && lyr.layerInfos) {
      lyr.layerInfos.forEach(sub => {
        capasDisponibles.push({
          id: `${lyr.id}_${sub.id}`,
          title: sub.name,
          url: `${lyr.url}/${sub.id}`,
          layerObject: lyr
        });
      });
    } else {
      capasDisponibles.push({
        id: lyr.id,
        title: lyr.name || lyr.id,
        url: lyr.url,
        layerObject: lyr
      });
    }
  });
  console.log("Capas disponibles:", capasDisponibles.map(c => c.title).join(", "));

  const prompt = `
Eres un asistente dentro de un visor SIG. 
Responde SIEMPRE en formato JSON con la siguiente estructura:

{
  "accion": "cuenta | zoom | muestra | oculta",
  "capa": "nombre de la capa",
  "filtro": "expresión opcional"
}

Funciones que conoces:
- "capas disponibles": ${capasDisponibles.map(c => c.title).join(", ")}
- "muestra" o "enciende": activar una capa.
- "oculta" o "apaga": desactivar una capa.
- "zoom": acercar a la extensión de una capa.
- "cuántos" o "cantidad": devolver el total de registros de una capa.
- "muestra registros": devolver ejemplos de registros de una capa.

Pregunta: ${text}
  `;

  this.model.generateContent(prompt).then(result => {
    let responseText = result.response.text();
    console.log("Respuesta cruda:", responseText);

    // 🔹 Limpiar respuesta de bloques de código ```json ... ```
    let clean = responseText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let action;
    try {
      action = JSON.parse(clean);
      console.log("JSON interpretado:", action);
    } catch (e) {
      messages.innerHTML += `<div><b>SIGI:</b> No pude interpretar la respuesta como JSON: <pre>${responseText}</pre></div>`;
      return;
    }

    // Buscar capa
    const capa = capasDisponibles.find(c => c.title.toLowerCase() === action.capa.toLowerCase());
    if (!capa) {
      messages.innerHTML += `<div><b>SIGI:</b> Capa no encontrada: ${action.capa}</div>`;
      return;
    }

    // 🔹 Ejecutar acción según el JSON
    switch (action.accion) {
      case "cuenta":
       var qt = new esri.tasks.QueryTask("https://webidu.idu.gov.co/servergis1/rest/services/DTE/SIGIDU/MapServer/3");
        var q = new esri.tasks.Query();
        q.where = "1=1";
        q.returnCountOnly = true;

        qt.executeForCount(q, function (count) {
          console.log("Total:", count);
        });
        break;

      case "zoom":
        const qZoom = new esri.tasks.Query();
        qZoom.where = action.filtro || "1=1";
        qZoom.returnGeometry = true;
        qZoom.outSpatialReference = this.map.spatialReference;
        const qtZoom = new esri.tasks.QueryTask(capa.url);
        qtZoom.execute(qZoom, (res) => {
          if (res.features.length > 0) {
            this.map.setExtent(res.features[0].geometry.getExtent().expand(1.5));
            messages.innerHTML += `<div><b>SIGI:</b> Zoom aplicado en <b>${capa.title}</b></div>`;
          } else {
            messages.innerHTML += `<div><b>SIGI:</b> No se encontraron registros para el filtro</div>`;
          }
        });
        break;

      case "muestra":
        capa.layerObject.setVisibility(true);
        messages.innerHTML += `<div><b>SIGI:</b> Capa <b>${capa.title}</b> activada</div>`;
        break;

      case "oculta":
        capa.layerObject.setVisibility(false);
        messages.innerHTML += `<div><b>SIGI:</b> Capa <b>${capa.title}</b> desactivada</div>`;
        break;

      default:
        messages.innerHTML += `<div><b>SIGI:</b> Acción no reconocida: ${action.accion}</div>`;
    }

    messages.scrollTop = messages.scrollHeight;
  }).catch(err => {
    console.error(err);
    messages.innerHTML += `<div><b>SIGI:</b> Error al conectar con Gemini</div>`;
  });
}


  });
});