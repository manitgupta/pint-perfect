// Shrink each page's base font until its content fits, then record the result
// on the page element (read back by check.py via --dump-dom).
(function () {
  function fits(inner) { return inner.scrollHeight <= inner.clientHeight + 1; }
  function fit() {
    document.querySelectorAll('.page').forEach(function (p) {
      var inner = p.querySelector('.inner');
      if (!inner) return;
      // put the nutrition card under whichever recipe column is shorter
      var nutri = inner.querySelector('.nutri'), ci = inner.querySelector('.col-ing'), cm = inner.querySelector('.col-method');
      if (nutri && ci && cm && ci.scrollHeight > cm.scrollHeight + nutri.offsetHeight * 0.5) { cm.appendChild(nutri); nutri.classList.add('in-method'); }
      var egg = inner.querySelector('.egg');
      if (egg && ci && cm) {
        // try full-width, ingredients column, method column; keep the one needing the least height
        var anchor = inner.querySelector('.shop'), best = null, bestH = 1e9;
        [null, ci, cm].forEach(function (col) {
          if (col) { col.appendChild(egg); egg.classList.add('in-col'); }
          else { inner.insertBefore(egg, anchor); egg.classList.remove('in-col'); }
          var notes = inner.querySelector('.notes'), mh = notes.style.minHeight;
          var h = inner.scrollHeight - notes.offsetHeight;
          if (h < bestH - 1) { bestH = h; best = col; }
        });
        if (best) { best.appendChild(egg); egg.classList.add('in-col'); }
        else { inner.insertBefore(egg, anchor); egg.classList.remove('in-col'); }
      }
      var fs = parseFloat(getComputedStyle(p).fontSize);
      var start = fs, n = 0;
      while (!fits(inner) && n < 40) { fs -= 0.15; p.style.fontSize = fs + 'px'; n++; }
      p.dataset.fs = (fs / start).toFixed(3);
      if (!fits(inner)) p.dataset.overflow = String(inner.scrollHeight - inner.clientHeight);
      var notes = inner.querySelector('.recipe .notes');
      if (notes) p.dataset.notesmm = (notes.getBoundingClientRect().height / 3.7795).toFixed(0);
    });
    document.body.dataset.fitted = '1';
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else window.addEventListener('load', fit);
})();
