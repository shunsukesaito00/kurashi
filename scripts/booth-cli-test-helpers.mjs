/** BOOTH CLI テスト用: 子プロセスに親の BOOTH_URL_STRICT が漏れない env を作る */
export function boothCliChildEnv({ keepStrictEnv = false } = {}) {
  const env = { ...process.env };
  if (!keepStrictEnv) {
    delete env.BOOTH_URL_STRICT;
  }
  return env;
}
