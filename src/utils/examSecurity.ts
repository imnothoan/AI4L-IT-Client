// Browser Lockdown & Security Features
// Prevents cheating during exams

export class ExamSecurityManager {
    private violationCount = 0;
    private maxViolations = 3;
    private onViolation: (type: string, count: number) => void;

    constructor(onViolation: (type: string, count: number) => void) {
        this.onViolation = onViolation;
    }

    public enableLockdown(): void {
        this.preventContextMenu();
        this.preventCopyPaste();
        this.preventDevTools();
        this.detectTabSwitch();
        this.detectWindowBlur();
        this.preventScreenshot();
        this.enforceFullscreen();

        console.log('🔒 Exam lockdown enabled');
    }

    public disableLockdown(): void {
        // Remove all event listeners
        document.removeEventListener('contextmenu', this.handleContextMenu);
        document.removeEventListener('copy', this.handleCopy);
        document.removeEventListener('paste', this.handlePaste);
        document.removeEventListener('cut', this.handleCut);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleWindowBlur);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

        console.log('🔓 Exam lockdown disabled');
    }

    private preventContextMenu(): void {
        const handler = (e: MouseEvent) => {
            e.preventDefault();
            this.recordViolation('RIGHT_CLICK');
        };
        document.addEventListener('contextmenu', handler);
        this.handleContextMenu = handler;
    }

    private handleContextMenu: (e: MouseEvent) => void = () => { };

    private preventCopyPaste(): void {
        const copyHandler = (e: ClipboardEvent) => {
            e.preventDefault();
            this.recordViolation('COPY_ATTEMPT');
        };

        const pasteHandler = (e: ClipboardEvent) => {
            e.preventDefault();
            this.recordViolation('PASTE_ATTEMPT');
        };

        const cutHandler = (e: ClipboardEvent) => {
            e.preventDefault();
            this.recordViolation('CUT_ATTEMPT');
        };

        document.addEventListener('copy', copyHandler);
        document.addEventListener('paste', pasteHandler);
        document.addEventListener('cut', cutHandler);

        this.handleCopy = copyHandler;
        this.handlePaste = pasteHandler;
        this.handleCut = cutHandler;
    }

    private handleCopy: (e: ClipboardEvent) => void = () => { };
    private handlePaste: (e: ClipboardEvent) => void = () => { };
    private handleCut: (e: ClipboardEvent) => void = () => { };

    private preventDevTools(): void {
        const handler = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                this.recordViolation('DEVTOOLS_F12');
                return false;
            }

            // Ctrl+Shift+I (Chrome DevTools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.recordViolation('DEVTOOLS_INSPECT');
                return false;
            }

            // Ctrl+Shift+J (Chrome Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                this.recordViolation('DEVTOOLS_CONSOLE');
                return false;
            }

            // Ctrl+Shift+C (Chrome Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.recordViolation('DEVTOOLS_INSPECTOR');
                return false;
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                this.recordViolation('VIEW_SOURCE');
                return false;
            }

            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.recordViolation('SAVE_PAGE');
                return false;
            }

            // Ctrl+P (Print)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.recordViolation('PRINT_ATTEMPT');
                return false;
            }
        };

        document.addEventListener('keydown', handler);
        this.handleKeyDown = handler;
    }

    private handleKeyDown: (e: KeyboardEvent) => void = () => { };

    private detectTabSwitch(): void {
        const handler = () => {
            if (document.hidden) {
                this.recordViolation('TAB_SWITCH');
            }
        };

        document.addEventListener('visibilitychange', handler);
        this.handleVisibilityChange = handler;
    }

    private handleVisibilityChange: () => void = () => { };

    private detectWindowBlur(): void {
        const handler = () => {
            this.recordViolation('WINDOW_BLUR');
        };

        window.addEventListener('blur', handler);
        this.handleWindowBlur = handler;
    }

    private handleWindowBlur: () => void = () => { };

    private preventScreenshot(): void {
        // Detect PrintScreen key
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                this.recordViolation('SCREENSHOT_ATTEMPT');
                // Can't actually prevent it, but we can detect it
            }
        };

        document.addEventListener('keyup', handler);
    }

    private enforceFullscreen(): void {
        // Request fullscreen
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Fullscreen request failed:', err);
        });

        // Detect fullscreen exit
        const handler = () => {
            if (!document.fullscreenElement) {
                this.recordViolation('FULLSCREEN_EXIT');
                // Try to re-enable fullscreen
                document.documentElement.requestFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handler);
        this.handleFullscreenChange = handler;
    }

    private handleFullscreenChange: () => void = () => { };

    private recordViolation(type: string): void {
        this.violationCount++;
        console.warn(`⚠️ Security violation #${this.violationCount}: ${type}`);

        this.onViolation(type, this.violationCount);

        if (this.violationCount >= this.maxViolations) {
            console.error('🚨 Maximum violations reached - exam should be terminated');
            alert('Too many security violations detected. Your exam will be submitted.');
        }
    }
}

// Export singleton instance
export const examSecurity = new ExamSecurityManager((type, count) => {
    // This will be connected to the anticheat system
    console.log(`Violation recorded: ${type} (Total: ${count})`);
});
