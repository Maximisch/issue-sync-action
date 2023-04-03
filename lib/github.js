"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHub = void 0;
class GitHub {
    constructor(octokit, owner, repo) {
        this.octokit = octokit;
        this.owner = owner;
        this.repo = repo;
    }
    getLabels() {
        return this.octokit.request('GET /repos/{owner}/{repo}/labels', {
            owner: this.owner,
            repo: this.repo,
        }).then((response) => {
            console.log(`Received ${response.data.length} labels for ${this.owner}/${this.repo}`);
            return response;
        });
    }
    createLabel(name, description, color) {
        return this.octokit.request('POST /repos/{owner}/{repo}/labels', {
            owner: this.owner,
            repo: this.repo,
            name,
            description,
            color,
        }).then((response) => {
            console.log(`Created label ${response.data.url}`);
            return response;
        });
    }
    createIssue(title, body, labels) {
        return this.octokit.request('POST /repos/{owner}/{repo}/issues', {
            owner: this.owner,
            repo: this.repo,
            title,
            body,
            labels
        }).then((response) => {
            console.log(`Created issue for ${response.data.html_url}`);
            return response;
        });
    }
    editIssue(issueNumber, title, body, state, labels) {
        return this.octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body,
            title,
            state,
            labels,
        }).then((response) => {
            console.log(`Updated issue ${response.data.html_url}`);
            return response;
        });
    }
    getIssue(issueNumber) {
        return this.octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
        }).then((response) => {
            console.log(`Received issue ${response.data.html_url}`);
            return response;
        });
    }
    createComment(issueNumber, body) {
        return this.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body
        }).then((response) => {
            console.log(`Created comment ${response.data.html_url}`);
            return response;
        });
    }
    getComment(commentId) {
        return this.octokit.request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', {
            owner: this.owner,
            repo: this.repo,
            comment_id: commentId,
        }).then((response) => {
            console.log(`Received comment ${response.data.html_url}`);
            return response;
        });
    }
    getIssueNumberByTitle(issueTitle) {
        // Find issue number from target repo where the issue title matches the title of the issue in the source repo
        // Sort by created and order by ascending to select the oldest created issue of that title
        // Octokit automatically encoded the query
        return this.octokit.request('GET /search/issues', {
            q: `repo:${this.owner}/${this.repo}+in:title+type:issue+${issueTitle}`,
            sort: 'created',
            order: 'asc',
            per_page: 100
        }).then((response) => {
            console.log(`Found a total of ${response.data.total_count} issues that fit the query.`);
            const targetIssue = response.data.items.find(targetIssue => targetIssue.title === issueTitle);
            return (targetIssue || {}).number;
        });
    }
}
exports.GitHub = GitHub;
