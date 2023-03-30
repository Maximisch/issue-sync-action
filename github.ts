import { Octokit } from "octokit";

export class GitHub {
    public static getIssueNumberByTitle(octokit: Octokit, owner: string, repo: string, issue_title: string): Promise<number> {
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
