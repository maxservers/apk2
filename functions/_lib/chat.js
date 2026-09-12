export function chatKey(a, b) {
  return a < b ? `chat:${a}:${b}` : `chat:${b}:${a}`;
}
