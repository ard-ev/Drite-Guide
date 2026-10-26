const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const root = path.dirname(require.resolve('../package.json'));
const compile = (file) => babel.transformSync(
  fs.readFileSync(path.join(root, file), 'utf8'),
  {
    filename: file,
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  }
).code;

const layoutModule = { exports: {} };
vm.runInNewContext(compile('src/navigation/tabBarLayout.js'), {
  module: layoutModule, exports: layoutModule.exports,
});
const navigatorSource = compile('src/navigation/TabNavigator.js');

// Execute the actual navigator configuration with platform/inset fixtures.
// This checks wiring and geometry; it is not a native Android renderer.
function renderNavigator(platform, bottomInset) {
  const module = { exports: {} };
  const requireMock = (name) => {
    if (name === 'react') {
      return { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
    }
    if (name === 'react-native') return { Platform: { OS: platform } };
    if (name === '@react-navigation/bottom-tabs') {
      return { createBottomTabNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) };
    }
    if (name === '@react-navigation/native') return { CommonActions: {} };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native-safe-area-context') {
      return {
        SafeAreaView: 'SafeAreaView',
        useSafeAreaInsets: () => ({ top: 24, bottom: bottomInset, left: 0, right: 0 }),
      };
    }
    if (name === '../context/TranslationContext') return { useTranslation: () => ({ t: (key) => key }) };
    if (name === '../theme/colors') return { primary: '#d51e1e' };
    if (name === './tabBarLayout') return layoutModule.exports;
    if (/StackNavigator$/.test(name)) return () => null;
    throw new Error(`Unexpected navigator import: ${name}`);
  };
  vm.runInNewContext(navigatorSource, { module, exports: module.exports, require: requireMock });
  const wrapper = module.exports.default();
  const navigator = wrapper.children.find((child) => child?.type === 'Navigator');
  assert.ok(navigator, 'The main navigator must remain within the safe-area boundary');
  return { wrapper, navigator };
}

for (const bottomInset of [0, 24, 48, 80]) {
  const { wrapper, navigator } = renderNavigator('android', bottomInset);
  assert.deepEqual(Array.from(wrapper.props.edges), ['left', 'right']);
  assert.deepEqual({ ...navigator.props.safeAreaInsets }, { left: 0, right: 0 },
    'The outer Android safe-area boundary must not add horizontal insets twice');
  for (const routeName of ['Home', 'Explore', 'Saved', 'Account']) {
    const { tabBarStyle: style } = navigator.props.screenOptions({ route: { name: routeName } });
    assert.notEqual(style.position, 'absolute', 'Android scenes must reserve menu space automatically');
    assert.ok(style.paddingBottom >= bottomInset, 'Labels must remain above the Android system navigation');
    assert.equal(style.height - style.paddingBottom - style.paddingTop, 64,
      'System bars must not shrink the icon/label touch area');
    for (const screenHeight of [640, 800, 960]) {
      const sceneBottom = screenHeight - style.height;
      const menuContentBottom = screenHeight - style.paddingBottom;
      const systemNavigationTop = screenHeight - bottomInset;
      assert.ok(sceneBottom + 48 <= menuContentBottom,
        'The menu needs room for a 48px touch target below the scene');
      assert.ok(menuContentBottom <= systemNavigationTop,
        'Gesture and three-button system navigation must not cover menu controls');
    }
  }
}

for (const platform of ['ios', 'web']) {
  for (const bottomInset of [0, 24, 34, 48, 80]) {
    const { wrapper, navigator } = renderNavigator(platform, bottomInset);
    assert.deepEqual(Array.from(wrapper.props.edges), [], 'No new outer iOS/web buffer');
    assert.equal(navigator.props.safeAreaInsets, undefined, 'Preserve iOS/web navigator inset handling');
    const { tabBarStyle: style } = navigator.props.screenOptions({ route: { name: 'Home' } });
    assert.deepEqual(
      Object.fromEntries(['position', 'left', 'right', 'bottom', 'height', 'paddingBottom'].map((key) => [key, style[key]])),
      { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, paddingBottom: 10 },
      'iOS/web menu placement and spacing must remain unchanged',
    );
  }
}

console.log('PASS: navigator configuration for all four tabs; Android gesture/three-button inset geometry; unchanged iOS/web menu');
