# issue-sync-action

Used to sync issues and comments from one repository to another, for example for use in internal roadmap publication.

You need to set a GITHUB_TOKEN environmental variable that is authorized to read from the source repository as well as write new issues to the target repository. 

Alternatively, you can set two separate environment variables GITHUB_TOKEN_SOURCE and GITHUB_TOKEN_TARGET

## Usage

This supports different options:

```yml
only_sync_on_label:
  description: 'If set, will only sync on issues with a label of this text'
  required: false
repo_source:
  description: 'Org/Repo slug for the source repository. Will default to action launch repo if not set.'
  required: false
repo_target:
  description: 'Org/repo slug for the target repository.'
  required: true
only_sync_main_issue:
  description: 'Will exclude the syncing of comments.'
  required: false
  default: "false"
additional_issue_labels:
  description: 'Additional labels to add to the target issues on sync (comma-separated)'
  required: false
  default: ""
sync_repo_labels:
  description: 'Whether to sync the labels from source to target repository'
  required: false
  default: "true"
```
 
## Example

```yml
---
name: issue-sync

on:
  issues:
    types: [closed, deleted, edited, labeled, opened, reopened, unlabeled]
  issue_comment:
    types: [created]

jobs:
  issue-sync:
    runs-on: ubuntu-latest
    steps:
    - name: Run the typescript action
      uses: camunda/issue-sync-action
      id: issue_sync
      with:
        repo_target: "MyOrg/public-roadmap"  # The target repository
        only_sync_on_label: "publicise"  # Only syncs issues with this label set
        only_sync_main_issue: true  # Excludes comments
        additional_issue_labels: "label1,label2"
      env:
        GITHUB_TOKEN_SOURCE: ${{ secrets.GH_TOKEN_FOR_SOURCE }}
        GITHUB_TOKEN_TARGET: ${{ secrets.GH_TOKEN_FOR_TARGET }}
        # alternatively, you can pass only GITHUB_TOKEN if it works for both source and target 
    - run: |
      echo "issue_id_target: ${{ steps.issue_sync.outputs.issue_id_target }}"
      echo "comment_id_target: ${{ steps.issue_sync.outputs.comment_id_target }}"
```
