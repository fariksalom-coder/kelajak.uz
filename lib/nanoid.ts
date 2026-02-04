export function nanoid(length: number = 21): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  for (let i = 0; i < length; i++) {
    id += alphabet[bytes[i]! % alphabet.length];
  }
  return id;
}
