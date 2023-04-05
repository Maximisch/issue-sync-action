export class Issue {
    id: number
    title: string
    authors: string[]
    body: string
    state: 'open' | 'closed'
    html_url: string
    labels: Label[]
}

export class User {
    login: string
}

export class IssueComment {
    id: number
    body?: string
    html_url: string
    user: User
}

export class Label {
    id: number
    node_id: string
    url: string
    name: string
    description: string | null
    color: string
    default: boolean
}
