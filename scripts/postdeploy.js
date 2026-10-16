// Firebase hosting postdeploy hook (see firebase.json). After a production release, tags
// the commit so there is a record of what is live and predeploy can refuse to release the
// same build number twice. The tag is created locally; pushing it is left to you.
import { BUILD_NUMBER, releaseTag, targetForProject, git } from './deploy-common.js';

if (targetForProject(process.env.GCLOUD_PROJECT) === 'production') {
  const tag = releaseTag(BUILD_NUMBER);
  try {
    git(`tag -a ${tag} -m "Production release ${BUILD_NUMBER}"`);
    console.log(`\n✔ Tagged this release ${tag}. To record it on GitHub:\n\n  git push origin ${tag}\n`);
  } catch (err) {
    // The deploy already succeeded, so report the problem without failing it
    console.warn(`\n⚠ Deployed, but could not create tag ${tag}: ${err.message.split('\n')[0]}\n`);
  }
}
