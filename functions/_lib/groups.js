export function groupKey(id) {
  return `group:${id}`;
}
export function groupCodeKey(code) {
  return `group_code:${code}`;
}
export function groupMsgsKey(id) {
  return `group_msgs:${id}`;
}
export function userGroupsKey(uid) {
  return `user_groups:${uid}`;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

export function genGroupCode() {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export function genGroupId() {
  return crypto.randomUUID();
}
