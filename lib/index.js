"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const octokit_1 = require("octokit");
const github_1 = require("./github");
const labelSyncer_1 = require("./labelSyncer");
let ownerSource = "";
let repoSource = "";
let ownerTarget = "";
let repoTarget = "";
let githubTokenSource = "";
let githubTokenTarget = "";
let githubToken = "";
let ONLY_SYNC_ON_LABEL;
let CREATE_ISSUES_ON_EDIT;
let ONLY_SYNC_MAIN_ISSUE;
// Determine which context we are running from
if (process.env.CI == "true") {
    console.log("Reading params from actions context...");
    // Read source and target repos
    const source = core.getInput("repo_source") ? core.getInput("repo_source") : github.context.repo.owner + '/' + github.context.repo.repo;
    const target = core.getInput("repo_target");
    [ownerSource, repoSource] = source.split("/");
    [ownerTarget, repoTarget] = target.split("/");
    // Read token and params
    githubToken = process.env.GITHUB_TOKEN;
    githubTokenSource = process.env.GITHUB_TOKEN_SOURCE || githubToken;
    githubTokenTarget = process.env.GITHUB_TOKEN_TARGET || githubToken;
    ONLY_SYNC_ON_LABEL = core.getInput("only_sync_on_label");
    CREATE_ISSUES_ON_EDIT = core.getBooleanInput("create_issues_on_edit");
    ONLY_SYNC_MAIN_ISSUE = core.getBooleanInput("only_sync_main_issue");
    console.log(`Repos: ${ownerSource}/${repoSource} -> ${ownerTarget}/${repoTarget}`);
    console.log(`Only sync on label: ${ONLY_SYNC_ON_LABEL}`);
    console.log(`Do not sync comments: ${ONLY_SYNC_MAIN_ISSUE}`);
    console.log(`Create missing issues on edit events: ${CREATE_ISSUES_ON_EDIT}`);
}
else {
    console.log("Reading params from CLI context...");
    // read all variables from launch parameters
    const launchArgs = process.argv;
    for (let i = 0; i < launchArgs.length; i++) {
        if (launchArgs[i] === "--owner_source") {
            ownerSource = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--repo_source") {
            repoSource = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--owner_target") {
            ownerTarget = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--repo_target") {
            repoTarget = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--github_token") {
            githubToken = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--github_token_source") {
            githubTokenSource = launchArgs[i + 1];
        }
        else if (launchArgs[i] === "--github_token_target") {
            githubTokenTarget = launchArgs[i + 1];
        }
    }
}
const octokitSource = new octokit_1.Octokit({
    auth: githubTokenSource,
    // TODO: add GHES IP support here, or use github.octokit
});
const octokitTarget = githubTokenSource == githubTokenTarget ? octokitSource : new octokit_1.Octokit({
    auth: githubTokenTarget,
    // TODO: add GHES IP support here, or use github.octokit
});
const gitHubSource = new github_1.GitHub(octokitSource, ownerSource, repoSource);
const gitHubTarget = new github_1.GitHub(octokitTarget, ownerTarget, repoTarget);
labelSyncer_1.LabelSyncer.syncLabels(gitHubSource, gitHubTarget).then(() => console.log("Successfully synced labels")).then(() => {
    const payload = require(process.env.GITHUB_EVENT_PATH);
    const number = (payload.issue || payload.pull_request || payload).number;
    // retrieve issue by owner, repo and number from octokit
    gitHubSource.getIssue(number).then((response) => {
        // Retrieved issue
        const issue = response.data;
        console.log(`Found issue: ${issue.title}`);
        console.log("Labels:", issue.labels.map(label => label.name));
        // If flag for only syncing labelled issues is set, check if issue has label of specified sync type
        if (ONLY_SYNC_ON_LABEL && !issue.labels.find(label => label.name === ONLY_SYNC_ON_LABEL))
            return;
        switch (process.env.GITHUB_EVENT_NAME) {
            case "issue_comment":
                // If flag for only syncing issue bodies is set and skip if true
                if (ONLY_SYNC_MAIN_ISSUE)
                    return;
                if (payload.action !== "created") {
                    console.warn("This will only sync new comments, events of current type are ignored", payload.action);
                    return;
                }
                // Retrieve new comment
                let issueComment;
                gitHubSource.getComment(payload.comment.id)
                    .then((response) => {
                    issueComment = response.data;
                    gitHubTarget.getIssueNumberByTitle(issue.title).then((targetIssueNumber) => {
                        // set target issue id for GH output
                        console.log(`target_issue_id:${targetIssueNumber}`);
                        core.setOutput('issue_id_target', targetIssueNumber);
                        // Transfer new comment to target issue
                        gitHubTarget.createComment(targetIssueNumber, issueComment.body || "")
                            .then((response) => {
                            // set target comment id for GH output
                            core.setOutput('comment_id_target', response.data.id);
                            console.info("Successfully created new comment on issue");
                        }).catch((err) => {
                            let msg = "Failed to create new comment on issue";
                            console.error(msg, err);
                            core.setFailed(`${msg} ${err}`);
                        });
                    });
                }).catch((err) => {
                    let msg = "Failed to retrieve issue comments";
                    console.error(msg, err);
                    core.setFailed(`${msg} ${err}`);
                });
                break;
            case "issues":
                // If the issue was updated, we need to sync labels
                switch (payload.action) {
                    case "opened":
                        // Create new issue in target repo
                        gitHubTarget.createIssue(issue.title, issue.body, issue.labels.map(label => label.name))
                            .then((response) => {
                            console.log("Created issue:", response.data.title);
                            // set target issue id for GH output
                            console.log(`target_issue_id:${response.data.id}`);
                            core.setOutput('issue_id_target', response.data.id);
                            // Add comment to source issue for tracking
                            gitHubSource.editIssue(number, null, issue.body + `\n\nNote: This issue has been copied to ${response.data.html_url}!`)
                                .then(() => {
                                console.info("Successfully created comment on issue");
                            }).catch((err) => {
                                let msg = "Failed to create comment on issue";
                                console.error(msg, err);
                                core.setFailed(`${msg} ${err}`);
                            });
                        }).catch((err) => {
                            let msg = "Error creating issue:";
                            console.error(msg, err);
                            core.setFailed(`${msg} ${err}`);
                        });
                        break;
                    case "edited":
                    case "closed":
                    case "reopened":
                    case "labeled":
                    case "unlabeled":
                        gitHubTarget.getIssueNumberByTitle(issue.title).then((targetIssueNumber) => {
                            if (targetIssueNumber) {
                                // set target issue id for GH output
                                console.log(`target_issue_id:${targetIssueNumber}`);
                                core.setOutput('issue_id_target', targetIssueNumber);
                                // Update issue in target repo
                                // Update issue in target repo, identify target repo issue number by title match
                                gitHubTarget.editIssue(targetIssueNumber, issue.title, issue.body, issue.state, issue.labels.map(label => label.name))
                                    .then((response) => {
                                    console.log("Updated issue:", response.data.title);
                                }).catch((err) => {
                                    console.error("Error updating issue:", err);
                                });
                            }
                            else {
                                console.error("Could not find matching issue in target repo for title", issue.title);
                                if (CREATE_ISSUES_ON_EDIT || payload.action == "labeled") {
                                    // Create issue anew
                                    gitHubTarget.createIssue(issue.title, issue.body, issue.labels.map(label => label.name))
                                        .then((response) => {
                                        // set target issue id for GH output
                                        core.setOutput('issue_id_target', response.data.number);
                                        console.log("Created issue for lack of a match:", response.data.title);
                                    }).catch((err) => {
                                        let msg = "Error creating issue for lack of a match:";
                                        console.error(msg, err);
                                        core.setFailed(`${msg} ${err}`);
                                    });
                                }
                            }
                        }).catch((err) => {
                            let msg = "Error finding issue in target repo:";
                            console.error(msg, err);
                            core.setFailed(`${msg} ${err}`);
                        });
                        break;
                    default:
                        console.log("We are currently not handling events of type " + payload.action);
                        break;
                }
                break;
            default:
                break;
        }
    }).catch((err) => {
        console.error("Failed to retrieve issue", err);
        core.setFailed(`Failed to retrieve issue ${err}`);
    });
});
