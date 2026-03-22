#!/usr/bin/env bash
# When run within a GitHub workflow:
# Update the version and dependencies for all the packages changed since the last release/publish
# and then commit & push the changes to the master branch together with the new tag(s)
#  lerna version command automatically creates a separate tag for each updated packages
#  tags are in the form of <packaga-name>@<version-number>, examples:
#  cbioportal-frontend-commons@0.2.8, cbioportal-frontend@3.2.13, cbioportal-ts-api-client@1.0.0
#
# When run locally:
# Prompt changed packages to manually set the new version

if [[ "$GITHUB_RUN_ID" ]]; then
  # configure git to be able to push version changes and tags
  git config --local user.email "LernaPublishBot@GithubActions.com"
  git config --local user.name "Lerna Publish Bot"
  git config --global github.token $GITHUB_TOKEN

  # by default just bump to the next patch
  # so this will, for example, bump 1.0.0 to 1.0.1, 1.0.0-alpha.2 to 1.0.0, 0.1.1-beta.0 to 0.1.1, etc.
  lerna version patch --yes
else
  # locally just prompt version update but do not create and push tags
  # this is useful if we want to set a custom version for certain packages
  lerna version --no-git-tag-version --no-push
fi
