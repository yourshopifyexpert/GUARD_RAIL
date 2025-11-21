import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface CodeChange {
    id: string;
    filePath: string;
    fileName: string;
    timestamp: number;
    changeType: 'create' | 'modify' | 'delete';
    status: 'pending' | 'approved' | 'rejected';
    beforeContent: string;
    afterContent: string;
    additions: number;
    deletions: number;
    context?: {
        userPrompt?: string;
        aiResponse?: string;
        conversationId?: string;
    };
    flags: {
        isReversal: boolean;
        isContradiction: boolean;
        reversalTargetId?: string;
        contradictionReason?: string;
    };
    metadata: {
        detectedAITool?: string;
        confidence: number;
        fileExtension: string;
    };
}

export class ChangeStorageService {
    private static instance: ChangeStorageService;
    private changes: Map<string, CodeChange> = new Map();
    private storageUri: vscode.Uri;
    private changeEmitter = new vscode.EventEmitter<CodeChange[]>();
    public readonly onChangesUpdated = this.changeEmitter.event;

    private constructor(private context: vscode.ExtensionContext) {
        this.storageUri = context.globalStorageUri;
        this.ensureStorageDirectory();
        this.loadChanges();
    }

    public static getInstance(context?: vscode.ExtensionContext): ChangeStorageService {
        if (!ChangeStorageService.instance && context) {
            ChangeStorageService.instance = new ChangeStorageService(context);
        }
        return ChangeStorageService.instance;
    }

    private ensureStorageDirectory(): void {
        try {
            if (!fs.existsSync(this.storageUri.fsPath)) {
                fs.mkdirSync(this.storageUri.fsPath, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create storage directory:', error);
        }
    }

    private getStorageFilePath(): string {
        return path.join(this.storageUri.fsPath, 'code-changes.json');
    }

    private loadChanges(): void {
        try {
            const filePath = this.getStorageFilePath();
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const changesArray: CodeChange[] = JSON.parse(data);
                changesArray.forEach(change => {
                    this.changes.set(change.id, change);
                });
                console.log(`Loaded ${this.changes.size} changes from storage`);
            }
        } catch (error) {
            console.error('Failed to load changes:', error);
        }
    }

    private saveChanges(): void {
        try {
            const changesArray = Array.from(this.changes.values());
            const data = JSON.stringify(changesArray, null, 2);
            fs.writeFileSync(this.getStorageFilePath(), data, 'utf8');
            this.changeEmitter.fire(changesArray);
        } catch (error) {
            console.error('Failed to save changes:', error);
        }
    }

    public addChange(change: CodeChange): void {
        this.changes.set(change.id, change);
        this.detectReversalsAndContradictions(change);
        this.saveChanges();
    }

    public getChange(id: string): CodeChange | undefined {
        return this.changes.get(id);
    }

    public getAllChanges(): CodeChange[] {
        return Array.from(this.changes.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    public getFilteredChanges(filters: {
        status?: 'all' | 'pending' | 'approved' | 'rejected';
        filePath?: string;
        dateFrom?: number;
        dateTo?: number;
        searchText?: string;
    }): CodeChange[] {
        let filtered = this.getAllChanges();

        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(c => c.status === filters.status);
        }

        if (filters.filePath) {
            filtered = filtered.filter(c => c.filePath.includes(filters.filePath!));
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(c => c.timestamp >= filters.dateFrom!);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(c => c.timestamp <= filters.dateTo!);
        }

        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filtered = filtered.filter(c =>
                c.fileName.toLowerCase().includes(searchLower) ||
                c.filePath.toLowerCase().includes(searchLower) ||
                c.beforeContent.toLowerCase().includes(searchLower) ||
                c.afterContent.toLowerCase().includes(searchLower) ||
                c.context?.userPrompt?.toLowerCase().includes(searchLower) ||
                c.context?.aiResponse?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    public updateChangeStatus(id: string, status: 'pending' | 'approved' | 'rejected'): void {
        const change = this.changes.get(id);
        if (change) {
            change.status = status;
            this.saveChanges();
        }
    }

    public deleteChange(id: string): void {
        this.changes.delete(id);
        this.saveChanges();
    }

    public clearAll(): void {
        this.changes.clear();
        this.saveChanges();
    }

    private detectReversalsAndContradictions(newChange: CodeChange): void {
        const recentChanges = this.getAllChanges()
            .filter(c => c.filePath === newChange.filePath && c.id !== newChange.id)
            .slice(0, 10);

        for (const oldChange of recentChanges) {
            const timeDiff = newChange.timestamp - oldChange.timestamp;
            const fiveMinutes = 5 * 60 * 1000;

            if (timeDiff > 0 && timeDiff < fiveMinutes) {
                const similarity = this.calculateSimilarity(
                    newChange.beforeContent,
                    oldChange.afterContent
                );

                if (similarity > 0.8) {
                    newChange.flags.isReversal = true;
                    newChange.flags.reversalTargetId = oldChange.id;

                    if (similarity > 0.95) {
                        newChange.flags.isContradiction = true;
                        newChange.flags.contradictionReason =
                            `This change reverses modifications made ${Math.round(timeDiff / 60000)} minutes ago`;
                    }
                    break;
                }
            }
        }
    }

    private calculateSimilarity(text1: string, text2: string): number {
        if (!text1 || !text2) {return 0;}
        if (text1 === text2) {return 1;}

        const len1 = text1.length;
        const len2 = text2.length;
        const maxLen = Math.max(len1, len2);

        if (maxLen === 0) {return 1;}

        const distance = this.levenshteinDistance(text1, text2);
        return 1 - (distance / maxLen);
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    public recordFileChange(uri: vscode.Uri, beforeContent: string, afterContent: string, changeType: 'create' | 'modify' | 'delete'): void {
        const change: CodeChange = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            filePath: uri.fsPath,
            fileName: path.basename(uri.fsPath),
            timestamp: Date.now(),
            changeType,
            status: 'pending',
            beforeContent,
            afterContent,
            additions: this.countAdditions(beforeContent, afterContent),
            deletions: this.countDeletions(beforeContent, afterContent),
            flags: {
                isReversal: false,
                isContradiction: false
            },
            metadata: {
                confidence: 0.8,
                fileExtension: path.extname(uri.fsPath)
            }
        };

        this.addChange(change);
    }

    private countAdditions(before: string, after: string): number {
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        let additions = 0;

        for (const line of afterLines) {
            if (!beforeLines.includes(line)) {
                additions++;
            }
        }

        return additions;
    }

    private countDeletions(before: string, after: string): number {
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        let deletions = 0;

        for (const line of beforeLines) {
            if (!afterLines.includes(line)) {
                deletions++;
            }
        }

        return deletions;
    }
}
