# Vendored MediaPipe (`@mediapipe/tasks-vision`)

Hosting platforms (including Netlify) often **do not deploy `node_modules`**, so hand tracking would 404 the `vision_bundle.mjs` import. This folder is a committed copy of the package used by `js/handtracking.js`.

**After upgrading the npm package**, refresh the vendor tree:

```bash
rm -rf vendor/@mediapipe/tasks-vision
mkdir -p vendor/@mediapipe
cp -R node_modules/@mediapipe/tasks-vision vendor/@mediapipe/
```
