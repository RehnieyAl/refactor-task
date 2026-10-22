const API_CONTENT_SECURITY_POLICY = "default-src 'none'; frame-ancestors 'none'";
const FRONTEND_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");

function securityHeaders(contentSecurityPolicy) {
  return (req, res, next) => {
    res.set({
      "Content-Security-Policy": contentSecurityPolicy,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-site"
    });
    next();
  };
}

module.exports = { securityHeaders, API_CONTENT_SECURITY_POLICY, FRONTEND_CONTENT_SECURITY_POLICY };
