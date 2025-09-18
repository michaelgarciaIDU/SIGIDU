define([
  'dojo/_base/declare',
  'jimu/BaseWidget'
], function(declare, BaseWidget) {

  return declare([BaseWidget], {
    baseClass: 'chatbot-widget',

    postCreate: function() {
      this.inherited(arguments);
      console.log('Chatbot widget cargado ✅');
      console.log(this.map)
    },

    startup: function() {
      this.inherited(arguments);
      this._initChatbot();
    },

    _initChatbot: function() {
      const chatWin = this.domNode.querySelector("#chatbot-window");
      const input = this.domNode.querySelector("#chatbot-input");
      const send = this.domNode.querySelector("#chatbot-send");
      const messages = this.domNode.querySelector("#chatbot-messages");
      const clearBtn = document.getElementById("chatbot-clear");


     
      // 🔹 Enviar mensaje
      send.onclick = () => this._sendMessage(input, messages, chatWin);
      input.addEventListener("keypress", e => {
        if (e.key === "Enter") this._sendMessage(input, messages, chatWin);
      });
        clearBtn.onclick = function() {
            messages.innerHTML = "<div><b>SIGI:</b> Hola 👋 ¿Qué deseas consultar en el Visor?</div>";
        };
      
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

      // 🔹 Cerrar conversación
      if (text.toLowerCase().includes("adiós") || text.toLowerCase().includes("gracias") || text.toLowerCase().includes("adios")) {
        response = "¡Hasta pronto! 👋";
        messages.innerHTML += `<div><b>SIGI:</b> ${response}</div>`;
        setTimeout(() => {
          chatWin.style.display = "none";
        }, 2000);
        return;
      }

      // 🔹 Listar capas disponibles
      let capasDisponibles = this.map.layerIds.map(id => {
        let lyr = this.map.getLayer(id);
        return {
          id: lyr.id,
          title: lyr.name || lyr.id,
          url: lyr.url,
          layerObject: lyr
        };
      });

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

        if (text.toLowerCase().includes("muestra") || text.toLowerCase().includes("enciende")) {
          capa.layerObject.setVisibility(true);
          response += " La he activado en el mapa ✅";
        }

        if (text.toLowerCase().includes("oculta") || text.toLowerCase().includes("apaga")) {
          capa.layerObject.setVisibility(false);
          response += " La he desactivado ❌";
        }

        if (text.toLowerCase().includes("zoom")) {
          if (capa.layerObject.fullExtent) {
            window.map.setExtent(capa.layerObject.fullExtent.expand(1.2));
            response += " y he hecho zoom a su extensión 🔎";
          }
        }
      } else {
        response = "Lo siento, no encontré esa capa en el mapa 😅. Prueba escribiendo *capas disponibles*.";
      }

      messages.innerHTML += `<div><b>SIGI:</b> ${response}</div>`;
    }

  });
});
