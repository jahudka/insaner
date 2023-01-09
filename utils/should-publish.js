#!/usr/bin/env node

const { get } = require('node:https');
const { resolve } = require('node:path');

const pkgName = process.argv[2];

if (!pkgName) {
  console.error(`Usage: ${process.argv0} ${process.argv[1]} <package>`);
  process.exit(1);
}

const pkgInfo = getPackageInfo(pkgName);

(async () => {
  try {
    const latest = await getLatestPublishedVersion(pkgInfo.name);
    process.exit(latest === pkgInfo.version ? 1 : 0);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
})();

function getPackageInfo(pkgName) {
  try {
    const meta = require(resolve(pkgName, 'package.json'));
    return {
      name: meta.name,
      version: meta.version.replace(/^v/, ''),
    };
  } catch (e) {
    console.error(`Invalid package name: ${pkgName}`);
    process.exit(1);
  }
}

async function getLatestPublishedVersion(pkgName) {
  const meta = await new Promise((resolve, reject) => {
    get(`https://registry.npmjs.org/${pkgName}/latest`, (res) => {
      const contentType = res.headers['content-type'];

      if (res.statusCode !== 200) {
        res.resume();
        return res.statusCode === 404
          ? resolve({ version: 'none' })
          : reject(new Error(`Request failed: received status code ${res.statusCode}`));
      } else if (!/^application\/json/.test(contentType)) {
        res.resume();
        return reject(new Error(`Invalid content type: expected application/json, but received ${contentType}`));
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  return meta.version.replace(/^v/, '');
}
