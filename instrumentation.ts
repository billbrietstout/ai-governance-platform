export async function register() {
  // Placeholder hook for OpenTelemetry initialization.
  // Keep this minimal until a tracing/export strategy is chosen (OTLP, Jaeger, etc).
  if (process.env.OTEL_SERVICE_NAME) {
    // no-op
  }
}

