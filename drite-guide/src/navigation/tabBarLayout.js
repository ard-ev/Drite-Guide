// Keep the tappable menu area stable; reserve system controls below its labels.
export function getTabBarLayout(platform, bottomInset = 0) {
  if (platform !== 'android') {
    return { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, paddingBottom: 10 };
  }
  const paddingBottom = Math.max(10, bottomInset);
  return { height: 70 + paddingBottom, paddingBottom };
}
