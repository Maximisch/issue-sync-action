import { Issue, IssueComment } from './issue'
import { GitHub } from './github'

export class Utils {
    // hidden messages are wrapped into a comment block <!-- --> and are used for
    // matching the target issues and comments with their source
    readonly issueBodyHiddentMessageTemplate = 'copiedFromSourceIssue: {{<link>}}'
    readonly issueCommenBodyHidddenMessageTemplate = 'copiedFromSourceIssueComment: {{<link>}}'
    readonly issueCreatedCommentHiddenMessage = 'type: issueCreatedComment'

    targetIssueFooterTemplate: string
    targetCommentFooterTemplate: string
    skipCommentSyncKeywords: string[]
    skippedCommentMessage: string
    issueCreatedCommentTemplate: string

    constructor(
        targetIssueFooterTemplate: string,
        targetCommentFooterTemplate: string,
        skipCommentSyncKeywords: string[],
        skippedCommentMessage: string,
        issueCreatedCommentTemplate: string
    ) {
        this.targetCommentFooterTemplate = targetCommentFooterTemplate
        this.targetIssueFooterTemplate = targetIssueFooterTemplate
        this.skipCommentSyncKeywords = skipCommentSyncKeywords
        this.skippedCommentMessage = skippedCommentMessage
        this.issueCreatedCommentTemplate = issueCreatedCommentTemplate
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

    private getIssueCommentHiddenFooter(issueComment: IssueComment): string {
        return this.wrapInComment(
            this.issueCommenBodyHidddenMessageTemplate.replace('{{<link>}}', issueComment.html_url)
        )
    }

    private getIssueCommentFooter(issueComment: IssueComment): string {
        return this.targetCommentFooterTemplate
            .replace('{{<link>}}', issueComment.html_url)
            .replace('{{<author>}}', `@${issueComment.user.login}`)
    }

    public getIssueCreatedComment(gitHub: GitHub, issueId: number): string {
        return (
            this.issueCreatedCommentTemplate.replace(
                '{{<link>}}',
                `https://github.com/${gitHub.owner}/${gitHub.repo}/issues/${issueId}`
            ) + `\n${this.wrapInComment(this.issueCreatedCommentHiddenMessage)}`
        )
    }

    public isIssueCreatedComment(body: string): boolean {
        const lines = body.split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (!this.isCommentLine(lines[i])) continue
            if (lines[i].includes(this.issueCreatedCommentHiddenMessage)) {
                return true
            }
        }
        return false
    }

    private wrapInComment(line: string): string {
        return `<!-- ${line} -->`
    }

    private isCommentLine(line: string): boolean {
        return line.trim().startsWith('<!--') && line.trim().endsWith('-->')
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
        const hiddenFooter = this.getIssueCommentHiddenFooter(issueComment)
        const body = this.getIssueCommentBodyFiltered(issueComment)
        return (footer ? body + '\n\n' + footer : body) + '\n\n' + hiddenFooter
    }

    private getIssueHiddenFooter(issue: Issue): string {
        return this.wrapInComment(this.issueBodyHiddentMessageTemplate.replace('{{<link>}}', issue.html_url))
    }

    private getIssueFooter(issue: Issue): string {
        return this.targetIssueFooterTemplate.replace('{{<link>}}', issue.html_url)
    }

    public getIssueTargetBody(issue: Issue): string {
        const footer = this.getIssueFooter(issue)
        const hiddenFooter = this.getIssueHiddenFooter(issue)
        const body = issue.body || ''
        return (footer ? body + '\n\n' + footer : body) + '\n' + hiddenFooter
    }
}
