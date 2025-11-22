/**
 * Test scenarios for AI Supervisor Admin Control features
 * These tests verify that blocking, locking, and emergency controls work correctly
 */
import * as vscode from 'vscode';
/**
 * Test Suite for Admin Control Features
 */
export declare class AdminTestScenarios {
    private context;
    private testResults;
    constructor(context: vscode.ExtensionContext);
    /**
     * Run all test scenarios
     */
    runAllTests(): Promise<void>;
    /**
     * Test 1: Try to save file with SQL injection - should be BLOCKED
     */
    testSQLInjectionBlock(): Promise<void>;
    /**
     * Test 2: Try to edit locked file - should be PREVENTED
     */
    testLockedFileEdit(): Promise<void>;
    /**
     * Test 3: Emergency stop - should halt all operations
     */
    testEmergencyStop(): Promise<void>;
    /**
     * Test 4: Approval mode - should show approval dialog
     */
    testApprovalMode(): Promise<void>;
    /**
     * Test 5: File unlock functionality
     */
    testFileUnlock(): Promise<void>;
    /**
     * Test 6: Block history tracking
     */
    testBlockHistory(): Promise<void>;
    /**
     * Test 7: Edit mode switching
     */
    testEditModeSwitch(): Promise<void>;
    /**
     * Test 8: Status bar updates
     */
    testStatusBarUpdates(): Promise<void>;
    /**
     * Record test result
     */
    private recordTest;
    /**
     * Print test results summary
     */
    private printResults;
}
/**
 * Register command to run tests
 */
export declare function registerTestCommand(context: vscode.ExtensionContext): void;
//# sourceMappingURL=admin-test-scenarios.d.ts.map