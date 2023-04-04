import { Issue, IssueComment } from './issue'

export class Utils {
    targetIssueFooterTemplate: string
    targetCommentFooterTemplate: string

    constructor(targetIssueFooterTemplate: string, targetCommentFooterTemplate: string) {
        this.targetCommentFooterTemplate = targetCommentFooterTemplate
        this.targetIssueFooterTemplate = targetIssueFooterTemplate
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

    public getIssueCommentTargetBody(issueComment: IssueComment): string {
        const footer = this.getIssueCommentFooter(issueComment)
        return footer ? issueComment.body + '\n\n' + footer : issueComment.body
    }

    public getIssueFooter(issue: Issue): string {
        return this.targetIssueFooterTemplate.replace('{{<link>}}', issue.html_url)
    }

    public getIssueTargetBody(issue: Issue): string {
        const footer = this.getIssueFooter(issue)
        return footer ? issue.body + '\n\n' + footer : issue.body
    }
}
