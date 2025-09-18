define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  "esri/tasks/QueryTask",
  "esri/tasks/query"
], function(declare, BaseWidget, QueryTask, Query) {

  return declare([BaseWidget], {
    baseClass: 'chatbot-widget',

    postCreate: function() {
      this.inherited(arguments);
      console.log('✅ Chatbot widget cargado');
      console.log(this.map);
    },

    startup: function() {
      this.inherited(arguments);
      this._initChatbot();
    },

    _initChatbot: function() {
      const chatWin   = this.domNode.querySelector("#chatbot-window");
      const input     = this.domNode.querySelector("#chatbot-input");
      const send      = this.domNode.querySelector("#chatbot-send");
      const messages  = this.domNode.querySelector("#chatbot-messages");
      const clearBtn  = this.domNode.querySelector("#chatbot-clear");

      // Botón enviar
      send.onclick = () => this._sendMessage(input, messages, chatWin);
      input.addEventListener("keypress", e => {
        if (e.key === "Enter") this._sendMessage(input, messages, chatWin);
      });

      // Botón limpiar chat
      if (clearBtn) {
        clearBtn.onclick = function() {
          messages.innerHTML = "<div><b>SIGI:</b> Hola 👋 ¿Qué deseas consultar en el Visor?</div>";
        };
      }
    },

    _sendMessage: function(input, messages, chatWin) {
      let text = input.value.trim();
      if (!text) return;

      messages.innerHTML += `<div><b>Tú:</b> ${text}</div>`;
      input.value = "";

      this._processMessage(text, messages, chatWin);
      messages.scrollTop = messages.scrollHeight;
    },

    _processMessage: function(text, messages, chatWin) {
      let response = "";

      // 🔹 Salida rápida
      if (text.toLowerCase().includes("adiós") || 
          text.toLowerCase().includes("gracias") || 
          text.toLowerCase().includes("adios")) {
        response = "¡Hasta pronto! 👋";
        messages.innerHTML += `<div><b>SIGI:</b> ${response}</div>`;
        setTimeout(() => { chatWin.style.display = "none"; }, 2000);
        return;
      }

      // 🔹 Obtener capas (incluyendo subcapas)
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

      // 🔹 Listar capas disponibles
      if (text.toLowerCase().includes("capas disponibles")) {
        let lista = capasDisponibles.map(c => c.title).join(", ");
        response = `Las capas disponibles son: <br><i>${lista}</i>`;
        messages.innerHTML += `<div><b>SIGI:</b> ${response}</div>`;
        return;
      }

      // 🔹 Buscar capa mencionada
      let capa = capasDisponibles.find(c =>
        text.toLowerCase().includes(c.title.toLowerCase())
      );

      if (capa) {
        response = `Encontré la capa <b>${capa.title}</b>. 🔍`;

        // ✅ Mostrar / encender
        if (text.toLowerCase().includes("muestra") || text.toLowerCase().includes("enciende")) {
          capa.layerObject.setVisibility(true);
          response += " La he activado en el mapa ✅";
        }

        // ✅ Ocultar / apagar
        if (text.toLowerCase().includes("oculta") || text.toLowerCase().includes("apaga")) {
          capa.layerObject.setVisibility(false);
          response += " La he desactivado ❌";
        }

        // ✅ Zoom
        if (text.toLowerCase().includes("zoom")) {
          if (capa.layerObject.fullExtent) {
            this.map.setExtent(capa.layerObject.fullExtent.expand(1.2));
            response += " y he hecho zoom a su extensión 🔎";
          }
        }

        // ✅ Consultar cantidad de registros
        if (text.toLowerCase().includes("cuántos") || text.toLowerCase().includes("cantidad")) {
          let qt = new QueryTask(capa.url);
          let q = new Query();
          q.where = "1=1";
          q.returnGeometry = false;
          q.outFields = ["*"];
          qt.execute(q, (res) => {
            let total = res.features.length;
            messages.innerHTML += `<div><b>SIGI:</b> La capa <b>${capa.title}</b> tiene <b>${total}</b> registros 📊</div>`;
            messages.scrollTop = messages.scrollHeight;
          });
          return;
        }

        // ✅ Mostrar algunos registros
        if (text.toLowerCase().includes("muestra") && text.toLowerCase().includes("registros")) {
          let qt = new QueryTask(capa.url);
          let q = new Query();
          q.where = "1=1";
          q.returnGeometry = false;
          q.outFields = ["*"];
          qt.execute(q, (res) => {
            let sample = res.features.slice(0, 5).map(f => {
              return Object.entries(f.attributes)
                .slice(0, 3) // 👈 solo algunos campos
                .map(([k,v]) => `${k}: ${v}`)
                .join(", ");
            }).join("<br>---<br>");
            messages.innerHTML += `<div><b>SIGI:</b> Aquí tienes algunos registros de <b>${capa.title}</b>: <br>${sample}</div>`;
            messages.scrollTop = messages.scrollHeight;
          });
          return;
        }

      } else {
        response = "Lo siento, no encontré esa capa en el mapa 😅. Prueba escribiendo *capas disponibles*.";
      }

      messages.innerHTML += `<div><b>SIGI:</b> ${response}</div>`;
    }

  });
});
