/** Avatar rangi va bosh harfi — ilovadagi `BattleAvatar` formulasi.
 *  Palitra va hisob aynan bir xil: kod birliklari yig'indisi mod 6. */
const COLORS = ['#63A967', '#2F6FED', '#D3AF4E', '#8E63C4', '#CF6B4C', '#3F9EA8'];

export function avatarColor(nickname: string): string {
  const name = nickname.trim();
  let sum = 0;
  for (let index = 0; index < name.length; index += 1) sum += name.charCodeAt(index);
  return COLORS[sum % COLORS.length];
}

export function initialOf(nickname: string): string {
  const name = nickname.trim();
  return name.length === 0 ? '?' : [...name][0].toUpperCase();
}
