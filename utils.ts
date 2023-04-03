import { IssueComment } from './issue'

export class Utils {
    public static findTargetComment(
        sourceComment: IssueComment,
        targetComments: Array<IssueComment>
    ): IssueComment | null {
        const matchContent = Utils.getCommentFooter(sourceComment.user.login, sourceComment.html_url)
        let result = null
        targetComments.forEach(targetComment => {
            if (targetComment.body.includes(matchContent)) {
                result = targetComment
                return
            }
        })
        return result
    }

    public static getCommentFooter(author: string, link: string): string {
        const template =
            '\n\n<sup>🤖 This comment from {{<author>}} is automatically synced from: [source]({{<link>}})</sup>'
        return template.replace('{{<link>}}', link).replace('{{<author>}}', `@${author}`)
    }

    public static getIssueFooter(link: string): string {
        const template = '\n\n<sup>🤖 This issue is automatically synced from: [source]({{<link>}})</sup>'
        return template.replace('{{<link>}}', link)
    }
}
