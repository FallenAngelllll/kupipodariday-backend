export function excludePassword<T extends { password?: string }>(
  user: T,
): Omit<T, 'password'> {
  const { password, ...res } = user;
  return res;
}
