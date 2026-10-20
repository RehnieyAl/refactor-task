const { HttpError } = require("../errors/httpErrors");

const BODY_PARSER_ERRORS = {
  "entity.parse.failed": { statusCode: 400, message: "El cuerpo de la petición no es JSON válido." },
  "entity.too.large": { statusCode: 413, message: "El cuerpo de la petición supera el tamaño permitido." },
  "charset.unsupported": { statusCode: 415, message: "La codificación de la petición no es compatible." },
  "encoding.unsupported": { statusCode: 415, message: "La codificación de la petición no es compatible." }
};

const INTERNAL_ERROR = { statusCode: 500, message: "Error interno del servidor." };

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Ruta no encontrada." });
}

function resolveErrorResponse(error) {
  if (error instanceof HttpError) {
    return { statusCode: error.statusCode, message: error.message };
  }
  return BODY_PARSER_ERRORS[error.type] ?? INTERNAL_ERROR;
}

function createErrorHandler(logError) {
  return (error, req, res, next) => {
    const { statusCode, message } = resolveErrorResponse(error);
    if (statusCode >= 500) {
      logError(error);
    }
    if (res.headersSent) {
      return next(error);
    }
    res.status(statusCode).json({ error: message });
  };
}

module.exports = { notFoundHandler, createErrorHandler };
