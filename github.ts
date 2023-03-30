import { Octokit } from "octokit";

export class GitHub {
    public static getIssueNumberByTitle(octokit: Octokit, owner: string, repo: string, issue_title: string): Promise<number> {
        // Find issue number from target repo where the issue title matches the title of the issue in the source repo
        // Sort by created and order by ascending to select the oldest created issue of that title
        // Octokit automatically encoded the query
        return octokit.request('GET /search/issues', {
            q: `repo:${owner}/${repo}+in:title+type:issue+${issue_title}`,
            sort: 'created',
            order: 'asc',
            per_page: 100
        }).then((response) => {
            console.log(`Found a total of ${response.data.total_count} issues that fit the query.`);
            const targetIssue = response.data.items.find(targetIssue => targetIssue.title === issue_title);
            return (targetIssue || {}).number;
        });  
    }
}
