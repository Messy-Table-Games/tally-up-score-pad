// Custom plugin to generate build.txt
const { APP_BUILD_NUMBER } = require('../src/build-number.js');
const { Compilation } = require('webpack');

class GenerateBuildTxtFilePlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('GenerateBuildFilePlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'GenerateBuildFilePlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        () => {
          const buildContent = APP_BUILD_NUMBER;
          compilation.emitAsset(
            'build.txt',
            new compiler.webpack.sources.RawSource(buildContent)
          );
        }
      );
    });
  }
}

module.exports = GenerateBuildTxtFilePlugin;
