import { useState } from 'react';
import { PostEditorBefore } from './components/EditorBefore';
import { PostEditorAfter } from './components/EditorAfter';

type View = 'before' | 'after' | 'split';

function App() {
  const [view, setView] = useState<View>('split');

  return (
    <div className="app">
      <header className="header">
        <h1>State Machine Pattern in React</h1>
        <p className="subtitle">
          A comparison of boolean soup vs. discriminated unions
        </p>
        <nav className="nav">
          <button
            className={view === 'before' ? 'active' : ''}
            onClick={() => setView('before')}
          >
            Before (Boolean Soup)
          </button>
          <button
            className={view === 'split' ? 'active' : ''}
            onClick={() => setView('split')}
          >
            Side by Side
          </button>
          <button
            className={view === 'after' ? 'active' : ''}
            onClick={() => setView('after')}
          >
            After (State Machine)
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'before' && (
          <div className="panel full">
            <div className="panel-header">
              <h2>❌ Before: Boolean Soup</h2>
              <p>9 useState calls • 512 possible combinations • ~97% invalid</p>
            </div>
            <PostEditorBefore />
          </div>
        )}

        {view === 'after' && (
          <div className="panel full">
            <div className="panel-header">
              <h2>✅ After: State Machine</h2>
              <p>1 useState call • 9 explicit states • 0 invalid combinations</p>
            </div>
            <PostEditorAfter />
          </div>
        )}

        {view === 'split' && (
          <>
            <div className="panel">
              <div className="panel-header">
                <h2>❌ Before: Boolean Soup</h2>
                <p>9 useState calls • 512 possible combinations</p>
              </div>
              <PostEditorBefore />
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>✅ After: State Machine</h2>
                <p>1 useState call • 9 explicit states</p>
              </div>
              <PostEditorAfter />
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Read the full blog post:{' '}
          <a
            href="https://johntcosta.hashnode.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            State Machines in React with TypeScript
          </a>
        </p>
        <p>
          <a
            href="https://github.com/johntcosta/state-machine-blog-post"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
