// Custom plugin to generate build.txt
import webpack from 'webpack';
import { APP_BUILD_NUMBER } from '../src/build-number.js';

const { Compilation } = webpack;

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

export default GenerateBuildTxtFilePlugin;
