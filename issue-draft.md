## Feature Request: Browser-Based Interactive Python Compiler

### Description
We need to add a new developer tool to the platform: a browser-based Python compiler. This tool will allow users to write, execute, and interact with Python 3 scripts directly inside their browser without any backend server compilation overhead.

### Key Requirements
1. **In-Browser Execution**: Use WebAssembly (Pyodide) to run Python code entirely on the client side.
2. **Interactive Terminal**: The terminal should support synchronous inputs (e.g. `input()` function in Python) using a zero-load API long-polling architecture.
3. **Advanced Editor**: Integrate Monaco Editor for rich syntax highlighting and code editing experience.
4. **Persistent File System**: Python scripts should be able to write files (e.g., JSON databases, text files) that persist across browser refreshes using IndexedDB.
5. **Security & Performance**:
   - The execution must happen in an isolated WebWorker to prevent UI freezing (infinite loops should not crash the browser).
   - Any backend bridges (like the input long-poller) must have DDoS protection and rate limiting.

### UI/UX Specifications
- Two-pane layout: Code Editor on the left, Terminal output on the right.
- Run, Stop, Reset, and Clear actions clearly accessible.
- Support for Light/Dark themes syncing automatically with the user's system preferences.
