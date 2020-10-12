# build and test
npm run build
npm test


# copy files and prepare ignore
cp README.md dist/README.md
cp package.json dist/package.json
cp package-lock.json dist/package-lock.json

cd dist
touch .gitignore
echo "**/*.spec.*" > .gitignore


# publish
npm publish
