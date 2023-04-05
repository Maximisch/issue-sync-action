import { Octokit } from 'octokit'

export class GitHub {
    octokit: Octokit
    owner: string
    repo: string

    constructor(octokit: Octokit, owner: string, repo: string) {
        this.octokit = octokit
        this.owner = owner
        this.repo = repo
    }

    public getLabels(): Promise<any> {
        return this.octokit
            .request('GET /repos/{owner}/{repo}/labels', {
                owner: this.owner,
                repo: this.repo,
            })
            .then(response => {
                console.log(`Received ${response.data.length} labels for ${this.owner}/${this.repo}`)
                return response
            })
    }

    public createLabel(name: string, description: string, color: string): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/labels', {
                owner: this.owner,
                repo: this.repo,
                name,
                description,
                color,
            })
            .then(response => {
                console.log(`Created label ${response.data.url}`)
                return response
            })
    }

    public createIssue(title: string, body: string, labels: string[]): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/issues', {
                owner: this.owner,
                repo: this.repo,
                title,
                body,
                labels,
            })
            .then(response => {
                console.log(`Created issue for ${response.data.html_url}`)
                return response
            })
    }

    public editIssue(
        issueNumber: number,
        title: string,
        body: string,
        state?: 'open' | 'closed',
        state_reason?: 'completed' | 'not_planned' | 'reopened' | null,
        labels?: string[]
    ): Promise<any> {
        return this.octokit
            .request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                body,
                title,
                state,
                state_reason,
                labels,
            })
            .then(response => {
                console.log(`Updated issue ${response.data.html_url}`)
                return response
            })
    }

    public getIssue(issueNumber: number): Promise<any> {
        return this.octokit
            .request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
            })
            .then(response => {
                console.log(`Received issue ${response.data.html_url}`)
                return response
            })
    }

    public reactOnIssue(issueNumber: number, reaction: 'rocket' | 'eyes' | 'hooray'): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/issues/{issue_number}/reactions', {
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                content: reaction,
            })
            .then(response => {
                console.log(`Reacted on issue ${response.data.id} with ${reaction}`)
                return response
            })
    }

    public reactOnComment(commentId: number, reaction: 'rocket' | 'eyes' | 'hooray'): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions', {
                owner: this.owner,
                repo: this.repo,
                comment_id: commentId,
                content: reaction,
            })
            .then(response => {
                console.log(`Reacted on comment ${response.data.id} with ${reaction}`)
                return response
            })
    }

    public createComment(issueNumber: number, body: string): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                body,
            })
            .then(response => {
                console.log(`Created comment ${response.data.html_url}`)
                return response
            })
    }

    public getComment(commentId: number): Promise<any> {
        return this.octokit
            .request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', {
                owner: this.owner,
                repo: this.repo,
                comment_id: commentId,
            })
            .then(response => {
                console.log(`Received comment ${response.data.html_url}`)
                return response
            })
    }

    public editComment(commentId: number, body: string): Promise<any> {
        return this.octokit
            .request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
                owner: this.owner,
                repo: this.repo,
                comment_id: commentId,
                body,
            })
            .then(response => {
                console.log(`Updated comment ${response.data.html_url}`)
                return response
            })
    }

    public deleteComment(commentId: number): Promise<any> {
        return this.octokit
            .request('DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}', {
                owner: this.owner,
                repo: this.repo,
                comment_id: commentId,
            })
            .then(response => {
                console.log(`Deleted comment ${commentId}`)
                return response
            })
    }

    public getComments(issueNumber: number): Promise<Array<any>> {
        return this.octokit
            .paginate('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                per_page: 100,
            })
            .then(comments => {
                console.log(`Received ${comments.length} comments`)
                return comments
            })
    }

    public getIssueNumberByTitle(issueTitle: string): Promise<number> {
        // Find issue number from target repo where the issue title matches the title of the issue in the source repo
        // Sort by created and order by ascending to select the oldest created issue of that title
        // Octokit automatically encoded the query
        return this.octokit
            .request('GET /search/issues', {
                q: `repo:${this.owner}/${this.repo}+in:title+type:issue+${issueTitle}`,
                sort: 'created',
                order: 'asc',
                per_page: 100,
            })
            .then(response => {
                console.log(`Found a total of ${response.data.total_count} issues that fit the query.`)
                const targetIssue = response.data.items.find(targetIssue => targetIssue.title === issueTitle)
                return (targetIssue || {}).number
            })
    }
}
