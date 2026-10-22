/* Huellita de papel · dibujo de tapas y páginas en canvas.
   Lo usa el diario 3D (libro.js) como texturas y, si no hay WebGL,
   la página muestra estas mismas tapas en 2D. */
(function () {
  "use strict";

  var FOOT_BODY = "M21 20C29.5 20 32 29 30.5 38.5C29 48.5 25 55 19 55C13 55 10.5 49.5 11.5 43.5C12.5 37.5 9.5 32 11 26C12.3 21.5 15.5 20 21 20Z";
  var FOOT_HEART = "M20.5 42l-4-3.8c-1.8-1.9-.3-4.8 2.2-4.2.8.2 1.4.8 1.8 1.4.4-.6 1-1.2 1.8-1.4 2.5-.6 4 2.3 2.2 4.2z";
  var TOES = [[13.5, 12, 4.2], [21, 8.5, 3], [26.8, 10, 2.5], [31, 13.8, 2.1], [33.6, 18.6, 1.7]];

  var TAPAS = {
    lavanda: { bg: "#E6E0E8", ink: "#6F7590", line: "rgba(111,117,144,.45)", label: "Lavanda" },
    azul:    { bg: "#A8BDD6", ink: "#463F4E", line: "rgba(70,63,78,.35)",    label: "Azul suave" },
    algodon: { bg: "#ECE7E1", ink: "#6F7590", line: "rgba(111,117,144,.4)",  label: "Algodón" },
    tinta:   { bg: "#463F4E", ink: "#F7F3EE", line: "rgba(247,243,238,.35)", label: "Tinta" }
  };

  var PAPEL_HOJA = "#FBF8F3";
  var PIZARRA = "#6F7590";
  var MANO = "#5B5470";
  var CW = 1024, CH = 1366;

  var ready = document.fonts && document.fonts.load
    ? Promise.all([
        document.fonts.load('400 80px "Gloock"'),
        document.fonts.load('400 80px "Allura"'),
        document.fonts.load('400 30px "Jost"')
      ]).catch(function () {})
    : Promise.resolve();

  var noise = (function () {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var x = c.getContext("2d");
    var img = x.createImageData(256, 256);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  })();

  function grain(c, w, h, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.globalCompositeOperation = "overlay";
    c.fillStyle = c.createPattern(noise, "repeat");
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  function foot(c, cx, cy, h, color, lw) {
    var s = h / 58;
    c.save();
    c.translate(cx - 21 * s, cy - 29 * s);
    c.scale(s, s);
    c.strokeStyle = color;
    c.lineWidth = lw || 1.3;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke(new Path2D(FOOT_BODY));
    c.stroke(new Path2D(FOOT_HEART));
    TOES.forEach(function (t) {
      c.beginPath();
      c.arc(t[0], t[1], t[2], 0, Math.PI * 2);
      c.stroke();
    });
    c.restore();
  }

  function heart(c, cx, cy, size, color) {
    var s = size / 10;
    c.save();
    c.translate(cx - 20.5 * s, cy - 38 * s);
    c.scale(s, s);
    c.strokeStyle = color;
    c.lineWidth = 1.1;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke(new Path2D(FOOT_HEART));
    c.restore();
  }

  // Texto centrado con espaciado entre letras (rótulos en mayúsculas)
  function spaced(c, text, x, y, sp) {
    var chars = Array.from(text);
    var widths = chars.map(function (ch) { return c.measureText(ch).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + sp * (chars.length - 1);
    var cur = x - total / 2;
    c.textAlign = "left";
    chars.forEach(function (ch, i) {
      c.fillText(ch, cur, y);
      cur += widths[i] + sp;
    });
  }

  function fit(c, text, family, start, maxW) {
    var s = start;
    c.font = "400 " + s + "px " + family;
    while (c.measureText(text).width > maxW && s > 24) {
      s -= 4;
      c.font = "400 " + s + "px " + family;
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function prep(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
    return canvas.getContext("2d");
  }

  /* ---------- tapa ---------- */
  function drawCover(canvas, st) {
    st = st || {};
    var t = TAPAS[st.tapa] || TAPAS.lavanda;
    var c = prep(canvas, CW, CH);
    var cx = CW / 2 + 22;

    c.fillStyle = t.bg;
    c.fillRect(0, 0, CW, CH);
    var g = c.createLinearGradient(0, 0, CW, CH);
    g.addColorStop(0, "rgba(255,255,255,.12)");
    g.addColorStop(1, "rgba(0,0,0,.07)");
    c.fillStyle = g;
    c.fillRect(0, 0, CW, CH);
    grain(c, CW, CH, 0.07);

    // canaleta de la bisagra
    c.fillStyle = "rgba(0,0,0,.07)";
    c.fillRect(0, 0, 58, CH);
    c.fillStyle = "rgba(255,255,255,.10)";
    c.fillRect(58, 0, 4, CH);

    c.strokeStyle = t.line;
    c.lineWidth = 3;
    roundRect(c, 104, 64, CW - 168, CH - 128, 16);
    c.stroke();

    c.fillStyle = t.ink;
    c.font = '400 27px "Jost"';
    spaced(c, "HUELLITA DE PAPEL", cx, 172, 13);

    foot(c, cx, 450, 210, t.ink, 1.25);

    var frase = st.frase || "esperándote";
    c.textAlign = "center";
    fit(c, frase, '"Allura"', 176, 700);
    c.fillText(frase, cx, 770);

    var personal = st.version !== "clasico";
    if (personal && st.nombre) {
      fit(c, st.nombre, '"Gloock"', 150, 660);
      c.fillText(st.nombre, cx, 935);
    }

    c.font = '400 23px "Jost"';
    spaced(c, personal ? "DE LA PANZA A TUS BRAZOS" : "DIARIO DE EMBARAZO", cx, CH - 158, 11);
    return canvas;
  }

  /* ---------- páginas ---------- */
  function paper(c, gutter) {
    c.fillStyle = PAPEL_HOJA;
    c.fillRect(0, 0, CW, CH);
    grain(c, CW, CH, 0.05);
    var g = gutter === "left"
      ? c.createLinearGradient(0, 0, 170, 0)
      : c.createLinearGradient(CW, 0, CW - 170, 0);
    g.addColorStop(0, "rgba(70,63,78,.18)");
    g.addColorStop(1, "rgba(70,63,78,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, CW, CH);
  }

  function label(c, text, x, y) {
    c.fillStyle = PIZARRA;
    c.font = '400 24px "Jost"';
    spaced(c, text, x, y, 11);
  }

  function title(c, text, x, y, size) {
    c.fillStyle = PIZARRA;
    c.textAlign = "center";
    fit(c, text, '"Gloock"', size, 760);
    c.fillText(text, x, y);
  }

  function ruled(c, x0, x1, y0, n, gap) {
    c.strokeStyle = "rgba(111,117,144,.24)";
    c.lineWidth = 2;
    for (var i = 0; i < n; i++) {
      c.beginPath();
      c.moveTo(x0, y0 + i * gap);
      c.lineTo(x1, y0 + i * gap);
      c.stroke();
    }
  }

  function hand(c, text, x, y, size, align) {
    c.fillStyle = MANO;
    c.font = "400 " + (size || 60) + 'px "Allura"';
    c.textAlign = align || "left";
    c.fillText(text, x, y);
  }

  var PAGES = {
    dedicatoria: function (c) {
      var cx = CW / 2 - 22;
      paper(c, "right");
      label(c, "DEDICATORIA", cx, 180);
      foot(c, cx, 330, 110, PIZARRA, 1.4);
      title(c, "Para vos,", cx, 540, 92);
      hand(c, "que todavía no llegaste", cx, 680, 84, "center");
      hand(c, "y ya cambiaste todo.", cx, 780, 84, "center");
      c.strokeStyle = "rgba(168,189,214,.9)";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - 90, 880); c.lineTo(cx + 90, 880); c.stroke();
      hand(c, "mamá", cx, 1000, 78, "center");
      label(c, "HUELLITA DE PAPEL", cx, CH - 120);
    },

    ecografia: function (c) {
      var cx = CW / 2 + 22;
      paper(c, "left");
      label(c, "PRIMERA ECOGRAFÍA", cx, 150);

      c.save();
      c.translate(cx, 500);
      c.rotate(-0.035);
      c.shadowColor = "rgba(70,63,78,.18)";
      c.shadowBlur = 30;
      c.shadowOffsetY = 10;
      c.fillStyle = "#fff";
      c.fillRect(-330, -270, 660, 590);
      c.shadowColor = "transparent";
      c.fillStyle = "#17151b";
      c.fillRect(-300, -240, 600, 450);
      c.save();
      c.beginPath();
      c.rect(-300, -240, 600, 450);
      c.clip();
      var g = c.createRadialGradient(0, -230, 20, 0, -230, 470);
      g.addColorStop(0, "rgba(210,210,215,.55)");
      g.addColorStop(0.6, "rgba(140,140,150,.32)");
      g.addColorStop(1, "rgba(80,80,90,0)");
      c.beginPath();
      c.moveTo(0, -230);
      c.arc(0, -230, 470, Math.PI * 0.27, Math.PI * 0.73);
      c.closePath();
      c.fillStyle = g;
      c.fill();
      c.fillStyle = "rgba(230,230,235,.22)";
      for (var i = 0; i < 1400; i++) {
        var a = Math.PI * (0.28 + Math.random() * 0.44);
        var r = 40 + Math.random() * 420;
        c.fillRect(Math.cos(a) * r, -230 + Math.sin(a) * r, 2, 2);
      }
      if ("filter" in c) c.filter = "blur(7px)";
      c.fillStyle = "rgba(240,240,245,.75)";
      c.beginPath(); c.ellipse(-55, 20, 72, 66, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(55, 55, 105, 62, 0.35, 0, Math.PI * 2); c.fill();
      if ("filter" in c) c.filter = "none";
      c.restore();
      hand(c, "semana 12", -300, 292, 58);
      heart(c, 270, 275, 26, PIZARRA);
      c.restore();

      ruled(c, 160, 900, 960, 4, 86);
      hand(c, "Te vimos por primera vez.", 175, 945, 60);
      hand(c, "Tu corazoncito latía rapidísimo", 175, 1031, 60);
      hand(c, "y papá no paraba de llorar.", 175, 1117, 60);
      heart(c, cx, CH - 110, 30, PIZARRA);
    },

    mes: function (c) {
      var cx = CW / 2 - 22;
      paper(c, "right");
      label(c, "MES A MES", cx, 160);
      title(c, "Así crecés", cx, 300, 92);
      for (var i = 0; i < 9; i++) {
        var x = cx + ((i % 3) - 1) * 250;
        var y = 470 + Math.floor(i / 3) * 235;
        c.fillStyle = "rgba(230,224,232,.7)";
        c.beginPath(); c.arc(x, y, 88, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "rgba(111,117,144,.35)";
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = "#A8BDD6";
        c.beginPath(); c.arc(x, y, 10 + i * 8.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = PIZARRA;
        c.font = '400 21px "Jost"';
        spaced(c, "MES " + (i + 1), x, y + 128, 6);
      }
      hand(c, "hoy ya sos del tamaño de una palta", cx, CH - 140, 62, "center");
    },

    semana: function (c) {
      var cx = CW / 2 + 22;
      paper(c, "left");
      label(c, "SEMANA 20", cx, 160);
      title(c, "Tu primera patadita", cx, 300, 80);
      ruled(c, 160, 900, 440, 4, 88);
      hand(c, "Estaba en el sillón con papá", 175, 425, 62);
      hand(c, "y de repente... ¡pum!", 175, 513, 62);
      hand(c, "Nos miramos y nos reímos", 175, 601, 62);
      hand(c, "como dos chicos.", 175, 689, 62);
      heart(c, 640, 668, 30, PIZARRA);

      c.fillStyle = "rgba(230,224,232,.55)";
      roundRect(c, 160, 860, 740, 330, 22);
      c.fill();
      label(c, "ANTOJOS DE LA SEMANA", cx, 940);
      hand(c, "helado de dulce de leche", cx, 1040, 62, "center");
      hand(c, "y mandarinas, muchas mandarinas", cx, 1125, 62, "center");
    }
  };

  function drawPage(canvas, name) {
    var c = prep(canvas, CW, CH);
    PAGES[name](c);
    return canvas;
  }

  function drawSpine(canvas, tapa) {
    var t = TAPAS[tapa] || TAPAS.lavanda;
    var w = 192, h = CH;
    var c = prep(canvas, w, h);
    c.fillStyle = t.bg;
    c.fillRect(0, 0, w, h);
    var g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,.10)");
    g.addColorStop(0.5, "rgba(255,255,255,.08)");
    g.addColorStop(1, "rgba(0,0,0,.10)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    grain(c, w, h, 0.07);
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(Math.PI / 2);
    c.fillStyle = t.ink;
    c.textAlign = "center";
    c.font = '400 64px "Gloock"';
    c.fillText("Huellita", -40, 4);
    c.font = '400 58px "Allura"';
    c.fillText("de papel", 190, 22);
    c.restore();
    foot(c, w / 2, 150, 70, t.ink, 1.6);
    return canvas;
  }

  // Cantos de las hojas: rayas finas en tonos papel
  function drawEdges(canvas, vertical) {
    var c = prep(canvas, vertical ? 256 : 32, vertical ? 32 : 256);
    c.fillStyle = "#F4EFE7";
    c.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < 256; i += 2) {
      c.fillStyle = Math.random() > 0.5 ? "#E6DED3" : "#FCFAF6";
      if (vertical) c.fillRect(i, 0, 1, 32);
      else c.fillRect(0, i, 32, 1);
    }
    return canvas;
  }

  function drawShadow(canvas) {
    var c = prep(canvas, 256, 256);
    var g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, "rgba(70,63,78,.42)");
    g.addColorStop(0.55, "rgba(70,63,78,.16)");
    g.addColorStop(1, "rgba(70,63,78,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    return canvas;
  }

  function drawSparkle(canvas) {
    var c = prep(canvas, 64, 64);
    c.translate(32, 32);
    c.fillStyle = "#fff";
    c.beginPath();
    c.moveTo(0, -30);
    c.quadraticCurveTo(3, -3, 30, 0);
    c.quadraticCurveTo(3, 3, 0, 30);
    c.quadraticCurveTo(-3, 3, -30, 0);
    c.quadraticCurveTo(-3, -3, 0, -30);
    c.fill();
    return canvas;
  }

  window.HuellitaTapa = {
    TAPAS: TAPAS,
    ready: ready,
    drawCover: drawCover,
    drawPage: drawPage,
    drawSpine: drawSpine,
    drawEdges: drawEdges,
    drawShadow: drawShadow,
    drawSparkle: drawSparkle
  };
})();
