# Grapher Sandbox

The Grapher Sandbox provides a minimal HTML/JS environment for debugging and prototyping Grapher charts.

Use it:

1. When you want to try code changes against a production chart without syncing the production database.
2. When you want to share an interactive demo of a new Grapher feature with the team without deploying a full branch.

## How to load a production chart against your local branch

1. Copy the JSON for the chart from the Debug textarea in the bottom of the Admin->Revisions panel
2. Paste the JSON into `sandbox/chart.js`. Prefix the JSON with `const sandboxChart =`. You can also see the example `chart.sample.js`.
3. Open `sandbox/index.html`

## How to bundle your current branch into a folder for distribution

1. After you've made code changes to your Grapher charts and your chart.js file and want to share, run `yarn build`
2. Then run `./sandbox/bakeSandbox.ts ~/some-output-folder` to copy all dependencies into that folder and get a standalone bundle.
