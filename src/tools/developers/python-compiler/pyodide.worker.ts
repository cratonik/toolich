/* eslint-disable no-restricted-globals */
// We load pyodide from the CDN
declare function importScripts(...urls: string[]): void;

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

declare let loadPyodide: any;

let pyodide: any = null;
let currentExecutionId: string | null = null;

async function initPyodide() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });
    // Set up standard output and error capture
    pyodide.setStdout({
        batched: (msg: string) => {
            self.postMessage({ type: "stdout", text: msg });
        },
    });
    pyodide.setStderr({
        batched: (msg: string) => {
            self.postMessage({ type: "stderr", text: msg });
        },
    });
    // Set up standard input using synchronous XHR to the Service Worker
    pyodide.setStdin({
        stdin: () => {
            if (!currentExecutionId) return null;
            
            // Tell the UI thread that we are waiting for input
            self.postMessage({ type: "awaiting_input", id: currentExecutionId });
            
            // Make a SYNCHRONOUS network request to our API route. This halts the WebWorker!
            // Node.js will hold this request open until the user types their answer.
            const request = new XMLHttpRequest();
            const url = `${self.location.origin}/api/python-input?id=${currentExecutionId}`;
            request.open("GET", url, false);
            
            try {
                request.send(null);
                if (request.status === 200) {
                    return request.responseText + "\n";
                } else {
                    self.postMessage({ type: "stderr", text: `\nXHR Error: Server returned status ${request.status}\n` });
                }
            } catch (e: any) {
                self.postMessage({ type: "stderr", text: `\nXHR Exception: ${e.message}\n` });
            }
            
            throw new Error("Failed to read standard input.");
        }
    });

    // Patch builtins.input so that prompts are printed on a separate line.
    // This forces Pyodide's `batched` stdout handler to immediately send the prompt 
    // to the UI before blocking for input, preventing hidden prompts!
    (self as any).send_html = (html_str: string) => {
        self.postMessage({ type: "html", html: html_str });
    };

    await pyodide.runPythonAsync(`
import builtins
import os

# Force Matplotlib to use the headless Agg backend to prevent it from crashing 
# when it tries to access js.document (which doesn't exist in a WebWorker)
os.environ['MPLBACKEND'] = 'AGG'

_original_input = builtins.input

def _custom_input(prompt=""):
    if prompt:
        print(prompt) # The newline forces Pyodide to flush the stdout buffer to the UI
    return _original_input()

builtins.input = _custom_input

def display_html(html_str):
    import js
    js.send_html(html_str)

builtins.display_html = display_html

def display_matplotlib(fig=None):
    import matplotlib.pyplot as plt
    import io
    if fig is None:
        fig = plt.gcf()
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight')
    display_html(buf.getvalue())
    plt.close(fig)

builtins.display_matplotlib = display_matplotlib

# Setup persistent directory if it doesn't exist yet
if not os.path.exists('/mnt'):
    os.makedirs('/mnt')
os.chdir('/mnt')
    `);
    
    // Mount IDBFS to the directory for persistent storage
    const FS = pyodide.FS;
    FS.mount(FS.filesystems.IDBFS, {}, '/mnt');
    
    // Sync from IndexedDB to Memory
    await new Promise<void>((resolve, reject) => {
        FS.syncfs(true, (err: any) => {
            if (err) {
                console.error("Failed to sync IDBFS:", err);
            }
            resolve(); // Resolve anyway so it doesn't break initialization
        });
    });
}

const pyodideReadyPromise = initPyodide();

self.onmessage = async (event: MessageEvent) => {
    const { id, code } = event.data;
    
    // We only process 'run' events for now
    if (!id || typeof code !== "string") return;

    currentExecutionId = id;

    try {
        await pyodideReadyPromise;
        
        // Load any imported packages
        await pyodide.loadPackagesFromImports(code);
        
        // Run the code
        const results = await pyodide.runPythonAsync(code);
        
        // After execution, sync the file system to save any changes to IndexedDB
        await new Promise<void>((resolve) => {
            pyodide.FS.syncfs(false, (err: any) => {
                if (err) console.error("Failed to save IDBFS:", err);
                resolve();
            });
        });

        self.postMessage({ type: "success", id, results: results ? results.toString() : undefined });
    } catch (error: any) {
        self.postMessage({ type: "error", id, error: error.message });
    } finally {
        currentExecutionId = null;
    }
};

export {}; // Ensure this is treated as a module by TS
