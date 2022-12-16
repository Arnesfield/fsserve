export function validatePort(port: number | undefined): number {
  const valid =
    typeof port === 'number' && isFinite(port) && port >= 0 && port < 65536;
  if (!valid) {
    throw new Error('Port should be >= 0 and < 65536.');
  }
  return port;
}
