# issue-sync-action
Used to sync issues and comments from one repository to another, for example for use in internal roadmap publication.
**Please note: you need to set GITHUB_TOKEN environmental variables that are authorized to read from the source repository as well as write new issues to the target repository. It is recommended to use the integrated GitHub Actions secrets vault for managing these secrets.**

This supports different options:
```yml
only_sync_on_label:
  description: 'If set, will only sync on issues with a label of this text'
  required: false
source_repo:
  description: 'Org/Repo slug for the source repository. Will default to action launch repo if not set.'
  required: false
target_repo:
  description: 'Org/repo slug for the target repository.'
  required: true
only_sync_main_issue:
  description: 'Will exclude the syncing of comments.'
  required: false
  default: "false"
source_pat:
  description: 'Personal Access Token for the source repository. Will use workflow token if unspecified.'
  required: false
target_pat:
  description: 'Personal Access Token for the target repository. Will use source token if unspecified.'
  required: false
source_url:
  description: 'The GitHub URL for the source repository. Will use Github.com if unspecified.'
  required: false
target_url:
  description: 'The GitHub URL for the target repository. Will use source URL if unspecified.'
  required: true
 ```
 
Here is a usage example:
```yml

on:
  issues:
  issue_comment:

env:
  GITHUB_TOKEN: ${{ secrets.GH_TOKEN_FOR_BOTH_REPOS }}

- name: Run the typescript action
  uses: Maximisch/issue-sync-action
  with:
    target_repo: "MyOrg/public-roadmap" # The target repository
    only_sync_on_label: "publicise" # Only syncs issues with this label set
    only_sync_main_issue: true # Excludes comments
    source_pat: ${{ secrets.SOURCE_PAT }} # Personal Access Token for the source repository
    target_pat: ${{ secrets.TARGET_PAT }} # Personal Access Token for the target repository
    source_url: "octodemo.com/api/v3" # GitHub Enterprise Server URL for the source repository
    target_url: "api.github.com" # GitHub Cloud API URL for the target repository
```


**NOTE:** In case of selecting a GHES instance as source/target, it is necessary to add `/api/v3` at the end of the URL. For `GitHub.com`, please add `api.github.com` as the destination.
