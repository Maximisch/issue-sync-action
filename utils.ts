import { Issue, IssueComment } from './issue'

export class Utils {
    targetIssueFooterTemplate: string
    targetCommentFooterTemplate: string
    skipCommentSyncKeywords: string[]
    skippedCommentMessage: string

    constructor(
        targetIssueFooterTemplate: string,
        targetCommentFooterTemplate: string,
        skipCommentSyncKeywords: string[],
        skippedCommentMessage: string
    ) {
        this.targetCommentFooterTemplate = targetCommentFooterTemplate
        this.targetIssueFooterTemplate = targetIssueFooterTemplate
        this.skipCommentSyncKeywords = skipCommentSyncKeywords
        this.skippedCommentMessage = skippedCommentMessage
    }

    public findTargetComment(sourceComment: IssueComment, targetComments: Array<IssueComment>): IssueComment {
        const matchContent = this.getIssueCommentFooter(sourceComment)
        let result: IssueComment = null
        targetComments.forEach(targetComment => {
            if (matchContent.trim() && targetComment.body.includes(matchContent)) {
                result = targetComment
                return
            }
        })

        const message = result
            ? `Found a match for the source comment ${sourceComment.id} in the target: ${result.id}`
            : `Could not find a match for the source comment ${sourceComment.id} in the target`
        console.info(message)
        return result
    }

    public getIssueCommentFooter(issueComment: IssueComment): string {
        return this.targetCommentFooterTemplate
            .replace('{{<link>}}', issueComment.html_url)
            .replace('{{<author>}}', `@${issueComment.user.login}`)
    }

    private getIssueCommentBodyFiltered(issueComment: IssueComment): string {
        for (let i = 0; i < this.skipCommentSyncKeywords.length; i++) {
            if (issueComment.body.includes(this.skipCommentSyncKeywords[i])) {
                return this.skippedCommentMessage
            }
        }
        return issueComment.body
    }

    public getIssueCommentTargetBody(issueComment: IssueComment): string {
        const footer = this.getIssueCommentFooter(issueComment)
        const body = this.getIssueCommentBodyFiltered(issueComment)
        return footer ? body + '\n\n' + footer : body
    }

    public getIssueFooter(issue: Issue): string {
        return this.targetIssueFooterTemplate.replace('{{<link>}}', issue.html_url)
    }

    public getIssueTargetBody(issue: Issue): string {
        const footer = this.getIssueFooter(issue)
        const body = issue.body
        return footer ? body + '\n\n' + footer : body
    }
}
