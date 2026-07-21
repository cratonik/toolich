## Description
Closes the related issue by introducing a fully featured, browser-based Python Compiler using Pyodide (WebAssembly).

### Key Additions
- **`PythonCompiler.tsx`**: The main UI component consisting of a Monaco Editor and a custom terminal layout with support for user standard input.
- **`pyodide.worker.ts`**: An isolated WebWorker running the Pyodide runtime. It intercepts `sys.stdin` and safely processes python scripts without freezing the UI.
- **`route.ts (python-input)`**: A robust API long-polling endpoint backed by Redis that bridges standard input from the React UI to the blocked WebWorker.
- **Persistent Filesystem**: Implemented IndexedDB (IDBFS) mount points so Python file operations (e.g. `open('data.json', 'w')`) persist across page refreshes.

### Security Enhancements
- **DDoS Protection**: Added an IP-based rate limiter (60 requests/minute) to the `/api/python-input` endpoint.
- **Collision Prevention**: Swapped `Date.now()` with `crypto.randomUUID()` to eliminate execution ID collision risks if two users run concurrent instances.
- **Server Leak Fix**: The input poller strictly checks `request.signal.aborted` to prevent ghost connections if a user closes the tab mid-execution.

### Testing
- Fully tested complex REPL CLI applications (e.g., Task Manager) locally.
- Verified dynamic theme switching and terminal rendering colors.
Closes #123
