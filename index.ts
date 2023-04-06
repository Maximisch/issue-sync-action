import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from 'octokit'
import { Issue, IssueComment } from './issue'
import { GitHub } from './github'
import { LabelSyncer } from './labelSyncer'
import { Utils } from './utils'

let ownerSource = ''
let repoSource = ''
let ownerTarget = ''
let repoTarget = ''
let githubTokenSource = ''
let githubTokenTarget = ''
let githubToken = ''
let additionalIssueLabels: string[] = []
let skipCommentSyncKeywords: string[] = []
let skippedCommentMessage: string
let syncRepoLabels: boolean
let targetIssueFooterTemplate = ''
let targetCommentFooterTemplate = ''
let ONLY_SYNC_ON_LABEL: string
let CREATE_ISSUES_ON_EDIT: boolean
let ONLY_SYNC_MAIN_ISSUE: boolean

// Determine which context we are running from
if (process.env.CI == 'true') {
    console.log('Reading params from actions context...')
    // Read source and target repos
    const source = core.getInput('repo_source')
        ? core.getInput('repo_source')
        : github.context.repo.owner + '/' + github.context.repo.repo
    const target = core.getInput('repo_target')
    ;[ownerSource, repoSource] = source.split('/')
    ;[ownerTarget, repoTarget] = target.split('/')

    // Read token and params
    githubToken = process.env.GITHUB_TOKEN
    githubTokenSource = process.env.GITHUB_TOKEN_SOURCE || githubToken
    githubTokenTarget = process.env.GITHUB_TOKEN_TARGET || githubToken
    additionalIssueLabels = core
        .getInput('additional_issue_labels')
        .split(',')
        .map(x => x.trim())
        .filter(x => x)
    syncRepoLabels = core.getBooleanInput('sync_repo_labels')
    targetIssueFooterTemplate = core.getInput('target_issue_footer_template')
    targetCommentFooterTemplate = core.getInput('target_comment_footer_template')
    skipCommentSyncKeywords = core
        .getInput('skip_comment_sync_keywords')
        .split(',')
        .map(x => x.trim())
        .filter(x => x)
    skippedCommentMessage = core.getInput('skipped_comment_message')
    ONLY_SYNC_ON_LABEL = core.getInput('only_sync_on_label')
    CREATE_ISSUES_ON_EDIT = core.getBooleanInput('create_issues_on_edit')
    ONLY_SYNC_MAIN_ISSUE = core.getBooleanInput('only_sync_main_issue')

    console.log(`Repos: ${ownerSource}/${repoSource} -> ${ownerTarget}/${repoTarget}`)
    console.log(`Only sync on label: ${ONLY_SYNC_ON_LABEL}`)
    console.log(`Do not sync comments: ${ONLY_SYNC_MAIN_ISSUE}`)
    console.log(`Create missing issues on edit events: ${CREATE_ISSUES_ON_EDIT}`)
    console.log(`Additional labels for target issue: ${additionalIssueLabels}`)
    console.log(`Sync labels from source to target repo: ${syncRepoLabels}`)
    console.log(`Target issues footer template: ${targetIssueFooterTemplate}`)
    console.log(`Target comments footer template: ${targetCommentFooterTemplate}`)
} else {
    console.log('Reading params from CLI context...')
    // read all variables from launch parameters
    const launchArgs = process.argv
    for (let i = 0; i < launchArgs.length; i++) {
        if (launchArgs[i] === '--owner_source') {
            ownerSource = launchArgs[i + 1]
        } else if (launchArgs[i] === '--repo_source') {
            repoSource = launchArgs[i + 1]
        } else if (launchArgs[i] === '--owner_target') {
            ownerTarget = launchArgs[i + 1]
        } else if (launchArgs[i] === '--repo_target') {
            repoTarget = launchArgs[i + 1]
        } else if (launchArgs[i] === '--github_token') {
            githubToken = launchArgs[i + 1]
        } else if (launchArgs[i] === '--github_token_source') {
            githubTokenSource = launchArgs[i + 1]
        } else if (launchArgs[i] === '--github_token_target') {
            githubTokenTarget = launchArgs[i + 1]
        } else if (launchArgs[i] === '--additional_issue_labels') {
            additionalIssueLabels = launchArgs[i + 1]
                .split(',')
                .map(x => x.trim())
                .filter(x => x)
        } else if (launchArgs[i] === '--sync_repo_labels') {
            syncRepoLabels = launchArgs[i + 1].toLowerCase() == 'true'
        } else if (launchArgs[i] === '--target_issue_footer_template') {
            targetIssueFooterTemplate = launchArgs[i + 1]
        } else if (launchArgs[i] === '--target_comment_footer_template') {
            targetCommentFooterTemplate = launchArgs[i + 1]
        } else if (launchArgs[i] === '--skip_comment_sync_keywords') {
            skipCommentSyncKeywords = launchArgs[i + 1]
                .split(',')
                .map(x => x.trim())
                .filter(x => x)
        } else if (launchArgs[i] == '--skipped_comment_message') {
            skippedCommentMessage = core.getInput('skipped_comment_message')
        }
    }
}

const gitHubSource = new GitHub(new Octokit({ auth: githubTokenSource }), ownerSource, repoSource)
const gitHubTarget = new GitHub(
    githubTokenSource == githubTokenTarget ? gitHubSource.octokit : new Octokit({ auth: githubTokenTarget }),
    ownerTarget,
    repoTarget
)

let utils = new Utils(
    targetIssueFooterTemplate,
    targetCommentFooterTemplate,
    skipCommentSyncKeywords,
    skippedCommentMessage
)

if (syncRepoLabels) {
    LabelSyncer.syncLabels(gitHubSource, gitHubTarget)
        .then(() => console.log('Successfully synced labels'))
        .catch(err => {
            console.error('Failed to sync labels', err)
        })
}

const payload = require(process.env.GITHUB_EVENT_PATH as string)
const number = (payload.issue || payload.pull_request || payload).number
const action: string = payload.action

// retrieve issue by owner, repo and number from octokit
gitHubSource
    .getIssue(number)
    .then(response => {
        // Retrieved issue
        const issue: Issue = response.data
        const labels: string[] = [...new Set(issue.labels.map(label => label.name).concat(additionalIssueLabels))]

        console.log(`Found issue ${number}: ${issue.title}`)
        console.log(`Labels: ${labels}`)

        // If flag for only syncing labelled issues is set, check if issue has label of specified sync type
        if (ONLY_SYNC_ON_LABEL && !issue.labels.find(label => label.name === ONLY_SYNC_ON_LABEL)) return

        switch (process.env.GITHUB_EVENT_NAME) {
            case 'issue_comment':
                // If flag for only syncing issue bodies is set and skip if true
                if (ONLY_SYNC_MAIN_ISSUE) return

                gitHubTarget.getIssueNumberByTitle(issue.title).then(targetIssueNumber => {
                    console.log(`target_issue_id:${targetIssueNumber}`)
                    core.setOutput('issue_id_target', targetIssueNumber)

                    const sourceComment: IssueComment = payload.comment
                    const issueCommentBody = utils.getIssueCommentTargetBody(sourceComment)

                    if (action == 'created') {
                        gitHubTarget.createComment(targetIssueNumber, issueCommentBody).then(response => {
                            // set target comment id for GH output
                            core.setOutput('comment_id_target', response.data.id)
                            gitHubSource.reactOnComment(sourceComment.id, 'rocket')
                            console.info('Successfully created new comment on issue')
                        })
                    } else {
                        // edited or deleted
                        gitHubTarget.getComments(targetIssueNumber).then(targetComments => {
                            const targetCommentMatch = utils.findTargetComment(sourceComment, targetComments)
                            if (targetCommentMatch) {
                                if (action == 'edited') {
                                    gitHubTarget.editComment(targetCommentMatch.id, issueCommentBody).then(response => {
                                        // set target comment id for GH output
                                        core.setOutput('comment_id_target', response.data.id)
                                        console.info('Successfully updated a comment on issue')
                                    })
                                } else if (action == 'deleted') {
                                    gitHubTarget.deleteComment(targetCommentMatch.id)
                                }
                            }
                        })
                    }
                })
                break
            case 'issues':
                // If the issue was updated, we need to sync labels
                const issueBody = utils.getIssueTargetBody(issue)
                switch (action) {
                    case 'opened':
                        // Create new issue in target repo
                        gitHubTarget
                            .createIssue(issue.title, issueBody, labels)
                            .then(response => {
                                console.log('Created issue:', response.data.title)
                                // set target issue id for GH output
                                console.log(`target_issue_id:${response.data.id}`)
                                core.setOutput('issue_id_target', response.data.id)
                                gitHubSource.reactOnIssue(number, 'rocket')
                            })
                            .catch(err => {
                                let msg = 'Error creating issue:'
                                console.error(msg, err)
                                core.setFailed(`${msg} ${err}`)
                            })
                        break
                    case 'edited':
                    case 'closed':
                    case 'reopened':
                    case 'labeled':
                    case 'unlabeled':
                        gitHubTarget
                            .getIssueNumberByTitle(issue.title)
                            .then(targetIssueNumber => {
                                if (targetIssueNumber) {
                                    // set target issue id for GH output
                                    console.log(`target_issue_id:${targetIssueNumber}`)
                                    core.setOutput('issue_id_target', targetIssueNumber)
                                    // Update issue in target repo
                                    // Update issue in target repo, identify target repo issue number by title match
                                    gitHubTarget
                                        .editIssue(
                                            targetIssueNumber,
                                            issue.title,
                                            issueBody,
                                            issue.state,
                                            issue.state_reason,
                                            labels
                                        )
                                        .then(response => {
                                            console.log('Updated issue:', response.data.title)
                                            gitHubSource.reactOnIssue(number, 'rocket')
                                        })
                                        .catch(err => {
                                            console.error('Error updating issue:', err)
                                        })
                                } else {
                                    console.error('Could not find matching issue in target repo for title', issue.title)

                                    if (CREATE_ISSUES_ON_EDIT || action == 'labeled') {
                                        // Create issue anew
                                        gitHubTarget
                                            .createIssue(issue.title, issueBody, labels)
                                            .then(response => {
                                                // set target issue id for GH output
                                                core.setOutput('issue_id_target', response.data.number)
                                                console.log('Created issue for lack of a match:', response.data.title)
                                            })
                                            .catch(err => {
                                                let msg = 'Error creating issue for lack of a match:'
                                                console.error(msg, err)
                                                core.setFailed(`${msg} ${err}`)
                                            })
                                    }
                                }
                            })
                            .catch(err => {
                                let msg = 'Error finding issue in target repo:'
                                console.error(msg, err)
                                core.setFailed(`${msg} ${err}`)
                            })
                        break
                    default:
                        console.log(`We are currently not handling events of type ${action}`)
                        break
                }
                break
            default:
                break
        }
    })
    .catch(err => {
        console.error('Failed to retrieve issue', err)
        core.setFailed(`Failed to retrieve issue ${err}`)
    })
