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

    public createIssue(title: string, body: string, labels: string[], assignees?: string[]): Promise<any> {
        return this.octokit
            .request('POST /repos/{owner}/{repo}/issues', {
                owner: this.owner,
                repo: this.repo,
                title,
                body,
                labels,
                assignees,
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
        labels?: string[],
        assignees?: string[]
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
                assignees,
            })
            .then(response => {
                console.log(`Updated issue ${response.data.html_url}`)
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

    public getIssueCommentNumber(searchString: string): Promise<number | null> {
        // searchString format: '<!-- copiedFromSourceIssueComment: https://github.com/<org>/<repo>/issues/<issueNumber>#issuecomment-<issueCommentNumber> -->'
        const clearSearchString = searchString.replace('<!--', '').replace('-->', '').trim() // search result drops < and >
        return this.octokit
            .request('GET /search/issues', {
                headers: {
                    accept: 'application/vnd.github.text-match+json',
                },
                q: `repo:${this.owner}/${this.repo}+in:comments+type:issue+"${searchString}"`,
            })
            .then(response => {
                console.log(
                    `Found a total of ${response.data.total_count} issues for comment search that fit the query.`
                )
                for (let i = 0; i < response.data.items.length; i++) {
                    const textMatch = response.data.items[i].text_matches.find(match =>
                        match.fragment.includes(clearSearchString)
                    )
                    if (textMatch) {
                        console.log(`Found a text match in: ${textMatch.object_url}`)
                        const regexMatch = textMatch.object_url.match(/\/comments\/(\d+)$/)
                        if (regexMatch && regexMatch[1]) {
                            return parseInt(regexMatch[1])
                        }
                    }
                }
                return null
            })
    }

    public getIssueNumber(
        useCommentForIssueMatching: boolean,
        issueTitle: string,
        searchString: string
    ): Promise<number | null> {
        if (useCommentForIssueMatching) {
            return this.getIssueNumberBySearchString(searchString)
        } else {
            return this.getIssueNumberByTitle(issueTitle)
        }
    }

    private getIssueNumberBySearchString(searchString: string): Promise<number | null> {
        // searchString format: '<!-- copiedFromSourceIssue: https://github.com/<org>/<repo>/issues/<issueNumber> -->'
        console.log(`Finding the target issue by search string: ${searchString}`)
        return this.octokit
            .request('GET /search/issues', {
                q: `repo:${this.owner}/${this.repo}+in:body+type:issue+"${searchString}"`,
            })
            .then(response => {
                console.log(`Found a total of ${response.data.total_count} issues for issue search that fit the query.`)

                const issueMatch = response.data.items.find(issue => issue.body.includes(searchString))
                return (issueMatch || {}).number
            })
    }

    private getIssueNumberByTitle(issueTitle: string): Promise<number | null> {
        // Find issue number from target repo where the issue title matches the title of the issue in the source repo
        // Sort by created and order by ascending to select the oldest created issue of that title
        // Octokit automatically encoded the query
        console.log(`Finding the target issue by title match: ${issueTitle}`)
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
