/* Huellita de papel · interacción de la página (sin dependencias). */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- WhatsApp ---------- */
  // 221 351-2482 (La Plata, AR) en formato internacional
  var WA_NUMERO = "5492213512482";
  var MENSAJES = {
    general: "¡Hola! 🤍 Vi la web de Huellita de papel y quiero saber más sobre los diarios de embarazo.",
    regalo: "¡Hola! 🤍 Quiero regalar un diario de Huellita de papel a una futura mamá.",
    clasico: "¡Hola! 🤍 Me interesa el diario clásico de Huellita de papel."
  };
  function waLink(msg) {
    return "https://wa.me/" + WA_NUMERO + "?text=" + encodeURIComponent(msg);
  }
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink(MENSAJES[a.dataset.msg] || MENSAJES.general);
  });

  /* ---------- títulos palabra por palabra ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    (function recorrer(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              var s = document.createElement("span");
              s.className = "pal";
              s.style.setProperty("--i", i++);
              s.textContent = parte;
              frag.appendChild(s);
            }
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          recorrer(n);
        }
      });
    })(el);
  });

  /* ---------- aparición al hacer scroll ---------- */
  var revelables = document.querySelectorAll(".revelar");
  if ("IntersectionObserver" in window && !reduce) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revelables.forEach(function (el) { obs.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- header y botón flotante ---------- */
  var header = document.querySelector(".header");
  var flotante = document.querySelector(".wa-flotante");
  function alScrollear() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);
    flotante.classList.toggle("visible", y > window.innerHeight * 0.8);
  }
  window.addEventListener("scroll", alScrollear, { passive: true });
  alScrollear();

  /* ---------- diseñá tu tapa ---------- */
  var form = document.getElementById("disena-form");
  var nombre = document.getElementById("nombre");
  var campoNombre = document.getElementById("campo-nombre");
  var ayuda = document.getElementById("ayuda-version");
  var cta = document.getElementById("disena-cta");
  var resumen = document.getElementById("disena-resumen");
  var lienzos = [];
  var AYUDAS = {
    personalizado: "Hecho a pedido, con el nombre y los detalles que elijas.",
    clasico: "Como el de librería, con la tapa de diseño de la marca. Listo para llevar."
  };

  function leer() {
    var fd = new FormData(form);
    return {
      version: fd.get("version"),
      nombre: (fd.get("nombre") || "").trim(),
      frase: fd.get("frase"),
      tapa: fd.get("tapa")
    };
  }

  function actualizar() {
    var st = leer();
    var T = window.HuellitaTapa;
    var color = T ? T.TAPAS[st.tapa].label : st.tapa;
    var personal = st.version !== "clasico";
    window.huellitaTapa = st;

    nombre.disabled = !personal;
    campoNombre.classList.toggle("apagado", !personal);
    ayuda.textContent = AYUDAS[st.version];

    var lineas = personal
      ? ["Versión: Personalizado", "Nombre: " + (st.nombre || "a definir"), "Frase: " + st.frase, "Tapa: " + color]
      : ["Versión: Clásico", "Frase: " + st.frase, "Tapa: " + color];
    resumen.textContent = lineas.join(" · ");
    cta.href = waLink("¡Hola! 🤍 Diseñé mi diario en la web y quiero pedirlo:\n• " + lineas.join("\n• "));

    window.dispatchEvent(new CustomEvent("tapa:cambio", { detail: st }));
    pintar2D(st);
  }

  // Tapas en 2D: vista previa en celular y reemplazo si no hay WebGL
  function pintar2D(st) {
    if (!window.HuellitaTapa) return;
    lienzos.forEach(function (c) { window.HuellitaTapa.drawCover(c, st); });
  }

  var mini = document.getElementById("mini-tapa");
  if (mini) lienzos.push(mini);
  if ("IntersectionObserver" in window) {
    var vista = document.getElementById("mini-vista");
    new IntersectionObserver(function (e) {
      vista.classList.toggle("activa", e[0].isIntersecting);
    }, { rootMargin: "-35% 0px -25% 0px" }).observe(form);
  }
  if (window.HuellitaTapa) window.HuellitaTapa.ready.then(function () { pintar2D(leer()); });

  form.addEventListener("input", actualizar);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  actualizar();

  document.addEventListener("DOMContentLoaded", function () {
    if (root.classList.contains("con-3d") || !window.HuellitaTapa) return;
    root.classList.add("sin-3d");
    document.querySelectorAll(".slot-2d").forEach(function (slot) {
      var c = document.createElement("canvas");
      slot.appendChild(c);
      lienzos.push(c);
    });
    pintar2D(leer());
  });

  /* ---------- dedicatoria que se escribe sola ---------- */
  var escrita = document.getElementById("dedicatoria");
  var DEDICATORIAS = [
    "Para Sofi, que está por vivir la aventura más linda de todas.",
    "Para mi hermana: ya te imagino con tu bebé en brazos.",
    "Para vos, mamá primeriza. Lo vas a hacer hermoso."
  ];
  if (escrita) {
    if (reduce || !("IntersectionObserver" in window)) {
      escrita.textContent = DEDICATORIAS[0];
    } else {
      var empezo = false;
      new IntersectionObserver(function (e, o) {
        if (e[0].isIntersecting && !empezo) {
          empezo = true;
          o.disconnect();
          escribir(0);
        }
      }, { threshold: 0.4 }).observe(escrita);
    }
  }
  function escribir(n) {
    var texto = DEDICATORIAS[n % DEDICATORIAS.length];
    var i = 0;
    (function sumar() {
      escrita.textContent = texto.slice(0, ++i);
      if (i < texto.length) setTimeout(sumar, 55);
      else setTimeout(borrar, 2600);
    })();
    function borrar() {
      (function quitar() {
        escrita.textContent = texto.slice(0, --i);
        if (i > 0) setTimeout(quitar, 18);
        else setTimeout(function () { escribir(n + 1); }, 400);
      })();
    }
  }

  document.getElementById("anio").textContent = new Date().getFullYear();
})();
