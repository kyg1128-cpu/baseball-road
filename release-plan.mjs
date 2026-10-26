export function planRelease(current, serviceWorker, requestedVersion) {
  const build = serviceWorker.match(/\bconst\s+CACHE\s*=\s*['"]baseball-road-([a-f0-9]{10})['"]/i)?.[1];
  if (!build) throw Error('Cannot find the game build ID in the input ZIP service worker.');
  const version = requestedVersion ?? current.version;
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/.test(version)) throw Error('Invalid release version.');
  if (build !== current.build && version === current.version) {
    throw Error('A changed game needs a new version: npm run prepare-release -- --version YYYY.MM.DD.N');
  }
  return {...current, version, tag: 'v' + version, build};
}
