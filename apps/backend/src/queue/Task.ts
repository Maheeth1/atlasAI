export interface Task {
    id: string;

    name: string;

    execute(): Promise<void>;
}