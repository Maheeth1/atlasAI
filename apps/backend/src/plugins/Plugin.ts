export interface Plugin {
    name: string;

    version: string;

    init(): Promise<void>;

    dispose(): Promise<void>;
}