import { Label } from "./labelSyncer";

export class Issue {
    id: number;
    title: string;
    authors: string[];
    body: string;
    state: string;
    labels: Label[];
}


export class IssueComment {
    id: number;
    body?: string;
}