class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}

class ValidationError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}

module.exports = { HttpError, ValidationError, NotFoundError };
