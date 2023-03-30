import { Octokit } from "octokit";
import { Endpoints } from "@octokit/types"
import { OctokitResponse } from "@octokit/types";


type getIssueResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}"]["response"];

export class GitHub {
    public static createIssue(octokit: Octokit, owner: string, repo: string, title: string, body: string, labels: string[]): Promise<any> {
        return octokit.request('POST /repos/{owner}/{repo}/issues', {
            owner,
            repo,
            title,
            body,
            labels
        }).then((response) => {
            console.log(`Created issue for ${response.data.html_url}`)
            return response
        })
    }

    public static getIssue(octokit: Octokit, owner: string, repo: string, issue_number: number): Promise<any> {
        return octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            owner,
            repo,
            issue_number,
        }).then((response) => {
            console.log(`Received issue ${response.data.html_url}`)
            return response
        })
    }

    public static getComment(octokit: Octokit, owner: string, repo: string, comment_id: number): Promise<any> {
        return octokit.request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', {
            owner,
            repo,
            comment_id,
        }).then((response) => {
            console.log(`Received comment ${response.data.html_url}`)
            return response
        })
    }

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
