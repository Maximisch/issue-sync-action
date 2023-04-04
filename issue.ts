export class Issue {
    id: number
    title: string
    authors: string[]
    body: string
    state: 'open' | 'closed'
    labels: Label[]
}

export class IssueComment {
    id: number
    body?: string
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
