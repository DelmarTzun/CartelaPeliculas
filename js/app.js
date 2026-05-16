const API_DIRECTA = "http://52.171.58.51:8080/api/cartelera";

/** En HTTPS (Azure) el navegador bloquea HTTP; usamos el proxy /api/cartelera */
const API_URL =
  window.location.protocol === "https:"
    ? `${window.location.origin}/api/cartelera`
    : API_DIRECTA;

let peliculas = [];
let modalInstance = null;

const $ = (id) => document.getElementById(id);

function normalizar(texto) {
  return (texto || "").trim().toLowerCase();
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function formatearFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function etiquetaEstado(estado) {
  if (estado === true) {
    return '<span class="badge bg-success badge-estado">Activa</span>';
  }
  if (estado === false) {
    return '<span class="badge bg-secondary badge-estado">Inactiva</span>';
  }
  return '<span class="badge bg-warning text-dark badge-estado">Sin estado</span>';
}

function obtenerUbicacionesUnicas(lista) {
  const mapa = new Map();

  lista.forEach((p) => {
    const raw = (p.Ubication || "").trim();
    if (!raw) return;
    const key = normalizar(raw);
    if (!mapa.has(key)) {
      mapa.set(key, raw);
    }
  });

  return [...mapa.values()].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function llenarFiltroUbicacion() {
  const select = $("filtroUbicacion");
  const valorActual = select.value;

  while (select.options.length > 1) {
    select.remove(1);
  }

  obtenerUbicacionesUnicas(peliculas).forEach((ubicacion) => {
    const opt = document.createElement("option");
    opt.value = normalizar(ubicacion);
    opt.textContent = ubicacion;
    select.appendChild(opt);
  });

  select.value = valorActual;
}

function filtrarPeliculas() {
  const ubicacion = $("filtroUbicacion").value;
  const termino = normalizar($("busqueda").value);

  return peliculas.filter((p) => {
    const coincideUbicacion =
      !ubicacion || normalizar(p.Ubication) === ubicacion;

    const coincideBusqueda =
      !termino ||
      normalizar(p.Title).includes(termino) ||
      normalizar(p.Type).includes(termino) ||
      normalizar(p.description).includes(termino) ||
      normalizar(p.Ubication).includes(termino);

    return coincideUbicacion && coincideBusqueda;
  });
}

function crearTarjeta(pelicula, indice) {
  const titulo = escaparHtml(pelicula.Title);
  const tipo = escaparHtml(pelicula.Type);
  const anio = escaparHtml(pelicula.Year);
  const ubicacion = escaparHtml(pelicula.Ubication || "Sin ubicación");
  const descripcion = escaparHtml(pelicula.description || "Sin descripción.");
  const poster = pelicula.Poster
    ? `<img src="${escaparHtml(pelicula.Poster)}" alt="${titulo}" loading="lazy" onerror="this.replaceWith(this.nextElementSibling)"><div class="poster-placeholder d-none"><i class="bi bi-image"></i></div>`
    : '<div class="poster-placeholder"><i class="bi bi-film"></i></div>';

  return `
    <div class="col-sm-6 col-lg-4 col-xl-3">
      <article class="card pelicula-card shadow-sm h-100" data-index="${indice}" role="button" tabindex="0">
        <div class="poster-wrap">
          ${poster}
          ${etiquetaEstado(pelicula.Estado)}
        </div>
        <div class="card-body">
          <h2 class="card-title h6 fw-bold mb-1">${titulo}</h2>
          <p class="mb-2">
            <span class="badge text-bg-dark me-1">${anio}</span>
            <span class="badge text-bg-danger">${tipo}</span>
          </p>
          <p class="descripcion-corta mb-2">${descripcion}</p>
          <p class="mt-auto mb-0">
            <span class="ubicacion-tag">
              <i class="bi bi-geo-alt-fill me-1"></i>${ubicacion}
            </span>
          </p>
        </div>
      </article>
    </div>
  `;
}

function renderizarCartelera() {
  const filtradas = filtrarPeliculas();
  const contenedor = $("cartelera");
  const sinResultados = $("sinResultados");

  contenedor.innerHTML = filtradas
    .map((p) => crearTarjeta(p, peliculas.indexOf(p)))
    .join("");

  sinResultados.classList.toggle("d-none", filtradas.length > 0);
  contenedor.classList.toggle("d-none", filtradas.length === 0);

  const total = peliculas.length;
  const mostradas = filtradas.length;
  $("contador").textContent =
    mostradas === total
      ? `Mostrando ${total} película${total !== 1 ? "s" : ""}`
      : `Mostrando ${mostradas} de ${total} película${total !== 1 ? "s" : ""}`;

  contenedor.querySelectorAll(".pelicula-card").forEach((card) => {
    const abrir = () => abrirModal(Number(card.dataset.index));
    card.addEventListener("click", abrir);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrir();
      }
    });
  });
}

function abrirModal(indice) {
  const p = peliculas[indice];
  if (!p) return;

  $("modalTitulo").textContent = p.Title || "Película";

  const posterHtml = p.Poster
    ? `<img src="${escaparHtml(p.Poster)}" class="modal-poster mb-3" alt="${escaparHtml(p.Title)}">`
    : "";

  $("modalCuerpo").innerHTML = `
    <div class="row g-3">
      <div class="col-md-5">${posterHtml}</div>
      <div class="col-md-7">
        <p class="mb-2">
          <span class="badge text-bg-dark me-1">${escaparHtml(p.Year)}</span>
          <span class="badge text-bg-danger me-1">${escaparHtml(p.Type)}</span>
          ${etiquetaEstado(p.Estado).replace("badge-estado", "")}
        </p>
        <p class="mb-2">
          <strong><i class="bi bi-geo-alt me-1"></i>Ubicación:</strong>
          ${escaparHtml(p.Ubication || "—")}
        </p>
        <p class="mb-2">
          <strong><i class="bi bi-hash me-1"></i>ID:</strong> ${escaparHtml(p.imdbID)}
        </p>
        <p class="mb-2">
          <strong><i class="bi bi-calendar me-1"></i>Registro:</strong>
          ${formatearFecha(p.Fec_Registro)}
        </p>
        <hr>
        <p class="mb-0">${escaparHtml(p.description || "Sin descripción.")}</p>
      </div>
    </div>
  `;

  if (!modalInstance) {
    modalInstance = new bootstrap.Modal($("modalPelicula"));
  }
  modalInstance.show();
}

function limpiarFiltros() {
  $("filtroUbicacion").value = "";
  $("busqueda").value = "";
  renderizarCartelera();
}

function mostrarError(mensaje) {
  $("loading").classList.add("d-none");
  const error = $("error");
  error.textContent = mensaje;
  error.classList.remove("d-none");
}

async function cargarCartelera() {
  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: no se pudo cargar la cartelera.`);
    }

    const datos = await respuesta.json();
    peliculas = Array.isArray(datos) ? datos : [];

    $("loading").classList.add("d-none");
    llenarFiltroUbicacion();
    renderizarCartelera();
  } catch (err) {
    const esRed =
      err.message.includes("Failed to fetch") || err.name === "TypeError";
    mostrarError(
      esRed && window.location.protocol === "https:"
        ? "No se pudo cargar la cartelera. Si acabas de publicar en Azure, vuelve a desplegar incluyendo la carpeta api/ (proxy HTTPS)."
        : esRed
          ? "No se pudo conectar con la API. Verifica tu conexión o que el servidor permita peticiones (CORS)."
          : err.message
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("filtroUbicacion").addEventListener("change", renderizarCartelera);
  $("busqueda").addEventListener("input", renderizarCartelera);
  $("btnLimpiar").addEventListener("click", limpiarFiltros);
  cargarCartelera();
});
