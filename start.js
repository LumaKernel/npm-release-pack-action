#!/bin/node
'use strict';

const spawn = require('child_process').spawn;
const path = require("path");
const https = require('https');

const request = (url, json, options = {}) => new Promise((resolve, reject) => {
  const data = JSON.stringify(json);
  const req = https
    .request(url, {
      ...options,
      headers: {
        'User-Agent': 'github.com/LumaKernel/npm-release-pack-action',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers,
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode < 200 || res.statusCode > 300) {
          return reject(Object.assign(
            new Error(`Invalid status code '${res.statusCode}' for url '${url}'`),
            {res, body}
          ));
        }
        return resolve(body)
      });
    })
    .on('error', reject)
  req.write(data);
});

const exec = (cmd, args = [], options = {}) => new Promise((resolve, reject) =>
  spawn(cmd, args, {stdio: 'inherit', ...options})
    .on('close', code => {
      if (code !== 0) {
        return reject(Object.assign(
          new Error(`Invalid exit code: ${code}`),
          {code}
        ));
      };
      return resolve(code);
    })
    .on('error', reject)
);

const trimLeft = (value, charlist = '/') => value.replace(new RegExp(`^[${charlist}]*`), '');
const trimRight = (value, charlist = '/') => value.replace(new RegExp(`[${charlist}]*$`), '');
const trim = (value, charlist) => trimLeft(trimRight(value, charlist));

const renderVersionTag = (pettern, version) => {
  return pettern.replace(/%s/g, version)
};

const boolWithDefault = (str, def) => {
  if (!str) return def;
  if (str === 'true' || str === 'false') return str === 'true';
  throw new Error(`input for boolean input should be either of true or false; got "${str}"`);
}

const main = async () => {
  const cwd = path.resolve(process.cwd(), process.env.INPUT_WORKING_DIRECTORY);
  const repository = trim(process.env.INPUT_REPOSITORY || process.env.GITHUB_REPOSITORY);
  const publishCommand = process.env.INPUT_PUBLISH_COMMAND;
  const versionTagPattern = process.env.INPUT_VERSION_TAG_PATTERN;
  const releaseNamePattern = process.env.INPUT_RELEASE_NAME_PATTERN;

  const {version} = require(path(cwd, 'package.json'));
  const versionTag = renderVersionTag(versionTagPattern, version);
  const releaseName = renderVersionTag(releaseNamePattern, version);

  try {
    await exec('bash', ['-c', publishCommand], {cwd})
  } catch (_e) {
    console.log('Publishing is not needed. Skipping creating a release.');
    return;
  }

  {
    // https://docs.github.com/en/rest/reference/releases#create-a-release
    const apiPath = `/repos/${process.env.GITHUB_ACTOR}/${repository}/releases`;

    const options = {
      method: 'POST',
      headers: {
        Authorization: `token ${process.env.INPUT_GITHUB_TOKEN}`,
      },
    };
    const req = {
      tag_name: versionTag,
      name: releaseName,
      body: process.env.INPUT_RELEASE_BODY,
      draft: boolWithDefault(process.env.INPUT_DRAFT, undefined),
      prerelease: boolWithDefault(process.env.INPUT_PRERELEASE, undefined),
      generate_release_notes: boolWithDefault(process.env.INPUT_GENERATE_RELEASE_NOTES, undefined),
      discussion_category_name: process.env.INPUT_DISCUSSION_CATEGORY_NAME,
      target_commitish: process.env.GITHUB_SHA,
    };
    await request(`https://api.github.com${apiPath}`, req, options);
  }
};

main().catch(err => {
  console.error(err);
  console.error(err.stack);
  process.exit(err.code || -1);
});
