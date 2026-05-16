const BACKEND_URL = process.env.CARTELERA_API_URL || "http://52.171.58.51:8080/api/cartelera";

module.exports = async function (context) {
  try {
    const respuesta = await fetch(BACKEND_URL);

    if (!respuesta.ok) {
      context.res = {
        status: respuesta.status,
        headers: { "Content-Type": "application/json" },
        body: { error: `La API respondió con estado ${respuesta.status}` },
      };
      return;
    }

    const datos = await respuesta.json();
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: datos,
    };
  } catch (err) {
    context.log.error("Error al consultar cartelera:", err);
    context.res = {
      status: 502,
      headers: { "Content-Type": "application/json" },
      body: {
        error: "No se pudo conectar con el servidor de cartelera.",
        detail: err.message,
      },
    };
  }
};
