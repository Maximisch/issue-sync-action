"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHub = void 0;
class GitHub {
    static getIssueNumberByTitle(octokit, owner, repo, issue_title) {
        // Find issue number from target repo where the issue title matches the title of the issue in the source repo
        // Sort by created and order by ascending to select the oldest created issue of that title
        // encoding the title just in case even though GitHub seems to be quite flexible on that
        return octokit.request('GET /search/issues', {
            q: `repo:${owner}/${repo}+in:title+type:issue+${encodeURIComponent(issue_title)}`,
            sort: 'created',
            order: 'asc'
        }).then((response) => {
            const targetIssue = response.data.items.find(targetIssue => targetIssue.title === issue_title);
            return (targetIssue || {}).number;
        });
    }
}
exports.GitHub = GitHub;
