# NPM Release Pack Action

GitHub Action for:

1. Publish npm package if needed. Necessity is decided by running real publish command.
2. If not published, end action successfully.
3. Create GitHub actions release.

## Usage

```yml
- uses: LumaKernel/npm-release-pack-action@v1
  with:
    github_token: ${{ github.token }}
    # repository: ''  # optional
    # working_directory: '.'  # optional
    publish_command: 'npm publish --access public'
    #  publish_command: 'npm publish --access public'
    #  publish_command: 'yarn publish --access public'
    #  publish_command: 'pnpm publish --access public'
    # version_tag_pattern: 'v%s'  # optional
    # release_name_pattern: 'v%s'  # optional
    # release_body:  # optional
    # draft:  # optional, boolean
    # prerelease:  # optional, boolean
    # generate_release_notes:  # optional, boolean
    # discussion_category_name:  # optional, boolean
```

## Options

GitHub Release related options(`release_body`, `draft`, `prerelease`, `generate_release_notes`, `discussion_category_name`) are documented in https://docs.github.com/en/rest/reference/releases#create-a-release .

name|description
--|--
`github_token` \*|GitHub token.
`publish_command` \*|Command to publish to npm. It should fail if publication is not needed. Run with bash.
`repository`|GitHub repository name.
`working_directory`|Directory to publish.

## Credits

- This repository is based on:
  - https://github.com/ad-m/github-push-action
