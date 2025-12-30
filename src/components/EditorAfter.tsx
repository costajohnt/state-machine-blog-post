import { useState } from 'react';

/**
 * AFTER: The State Machine Approach
 *
 * All possible states are explicitly defined as a discriminated union.
 * The `kind` property tells us exactly what state we're in.
 * Each state carries only the data relevant to that state.
 *
 * We use exhaustive switch statements so TypeScript enforces
 * that we handle every possible state.
 */

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

interface PostData {
  title: string;
  content: string;
}

interface SavedPostData extends PostData {
  savedAt: Date;
}

/**
 * All possible states for the editor.
 * Notice how each state is self-documenting and carries its own context.
 */
type EditorState =
  | { kind: 'editing'; draft: PostData; original: PostData }
  | { kind: 'saving-draft'; draft: PostData; original: PostData }
  | { kind: 'confirming-publish'; draft: PostData; original: PostData }
  | { kind: 'publishing'; draft: PostData; original: PostData }
  | { kind: 'confirming-discard'; draft: PostData; original: PostData }
  | { kind: 'save-error'; draft: PostData; original: PostData; error: string }
  | { kind: 'publish-error'; draft: PostData; original: PostData; error: string }
  | { kind: 'draft-saved'; draft: SavedPostData; original: PostData }
  | { kind: 'published'; post: SavedPostData };

// Helper for exhaustive checking - TypeScript will error if we miss a case
const assertNever = (x: never): never => {
  throw new Error(`Unexpected state: ${x}`);
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PostEditorAfter() {
  const [state, setState] = useState<EditorState>({
    kind: 'editing',
    draft: { title: '', content: '' },
    original: { title: '', content: '' },
  });

  // -------------------------------------------------------------------------
  // STATE TRANSITIONS
  // -------------------------------------------------------------------------

  const updateDraft = (updates: Partial<PostData>) => {
    switch (state.kind) {
      case 'editing':
      case 'draft-saved':
      case 'save-error':
      case 'publish-error':
        setState({
          kind: 'editing',
          draft: { ...state.draft, ...updates },
          original: state.original,
        });
        return;

      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'confirming-discard':
        // Can't edit while busy or modal is open
        return;

      case 'published':
        // Can't edit after publishing
        return;

      default:
        assertNever(state);
    }
  };

  const startSaveDraft = async () => {
    switch (state.kind) {
      case 'editing':
      case 'save-error':
        break; // Valid - continue with save

      case 'draft-saved':
      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'confirming-discard':
      case 'publish-error':
      case 'published':
        return; // Invalid - can't save from these states

      default:
        assertNever(state);
    }

    setState({
      kind: 'saving-draft',
      draft: state.draft,
      original: state.original,
    });

    try {
      await fakeSaveApi(state.draft);
      setState({
        kind: 'draft-saved',
        draft: { ...state.draft, savedAt: new Date() },
        original: state.draft,
      });
    } catch (error) {
      setState({
        kind: 'save-error',
        draft: state.draft,
        original: state.original,
        error: 'Failed to save draft. Please try again.',
      });
    }
  };

  const openPublishConfirmation = () => {
    switch (state.kind) {
      case 'editing':
      case 'draft-saved':
        setState({
          kind: 'confirming-publish',
          draft: state.draft,
          original: state.original,
        });
        return;

      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'confirming-discard':
      case 'save-error':
      case 'publish-error':
      case 'published':
        return;

      default:
        assertNever(state);
    }
  };

  const confirmPublish = async () => {
    switch (state.kind) {
      case 'confirming-publish':
        break; // Valid - continue

      case 'editing':
      case 'draft-saved':
      case 'saving-draft':
      case 'publishing':
      case 'confirming-discard':
      case 'save-error':
      case 'publish-error':
      case 'published':
        return;

      default:
        assertNever(state);
    }

    setState({
      kind: 'publishing',
      draft: state.draft,
      original: state.original,
    });

    try {
      await fakePublishApi(state.draft);
      setState({
        kind: 'published',
        post: { ...state.draft, savedAt: new Date() },
      });
    } catch (error) {
      setState({
        kind: 'publish-error',
        draft: state.draft,
        original: state.original,
        error: 'Failed to publish. Please try again.',
      });
    }
  };

  const openDiscardConfirmation = () => {
    switch (state.kind) {
      case 'editing':
      case 'draft-saved': {
        const hasChanges =
          state.draft.title !== state.original.title ||
          state.draft.content !== state.original.content;

        if (!hasChanges) {
          // No changes - just reset immediately
          setState({
            kind: 'editing',
            draft: state.original,
            original: state.original,
          });
        } else {
          setState({
            kind: 'confirming-discard',
            draft: state.draft,
            original: state.original,
          });
        }
        return;
      }

      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'confirming-discard':
      case 'save-error':
      case 'publish-error':
      case 'published':
        return;

      default:
        assertNever(state);
    }
  };

  const confirmDiscard = () => {
    switch (state.kind) {
      case 'confirming-discard':
        setState({
          kind: 'editing',
          draft: state.original,
          original: state.original,
        });
        return;

      case 'editing':
      case 'draft-saved':
      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'save-error':
      case 'publish-error':
      case 'published':
        return;

      default:
        assertNever(state);
    }
  };

  const cancelModal = () => {
    switch (state.kind) {
      case 'confirming-publish':
      case 'confirming-discard':
        setState({
          kind: 'editing',
          draft: state.draft,
          original: state.original,
        });
        return;

      case 'editing':
      case 'draft-saved':
      case 'saving-draft':
      case 'publishing':
      case 'save-error':
      case 'publish-error':
      case 'published':
        return;

      default:
        assertNever(state);
    }
  };

  const dismissError = () => {
    switch (state.kind) {
      case 'save-error':
      case 'publish-error':
        setState({
          kind: 'editing',
          draft: state.draft,
          original: state.original,
        });
        return;

      case 'editing':
      case 'draft-saved':
      case 'saving-draft':
      case 'publishing':
      case 'confirming-publish':
      case 'confirming-discard':
      case 'published':
        return;

      default:
        assertNever(state);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER - Exhaustive switch on state.kind
  // -------------------------------------------------------------------------

  switch (state.kind) {
    case 'published':
      return (
        <div className="published-view">
          <h1>🎉 Published!</h1>
          <h2>{state.post.title}</h2>
          <p>{state.post.content}</p>
          <p className="meta">
            Published at {state.post.savedAt.toLocaleTimeString()}
          </p>
        </div>
      );

    case 'editing':
    case 'saving-draft':
    case 'publishing':
    case 'confirming-publish':
    case 'confirming-discard':
    case 'save-error':
    case 'publish-error':
    case 'draft-saved': {
      const isBusy = state.kind === 'saving-draft' || state.kind === 'publishing';
      const hasChanges =
        state.draft.title !== state.original.title ||
        state.draft.content !== state.original.content;

      return (
        <div className="editor">
          <h1>Edit Post</h1>

          {/* Status indicator */}
          <div className="status">
            State: <code>{state.kind}</code>
          </div>

          {/* Error banner - only in error states */}
          {(state.kind === 'save-error' || state.kind === 'publish-error') && (
            <div className="error-banner">
              {state.error}
              <button onClick={dismissError}>Dismiss</button>
            </div>
          )}

          {/* Success banner - only in draft-saved state */}
          {state.kind === 'draft-saved' && (
            <div className="success-banner">
              Draft saved at {state.draft.savedAt.toLocaleTimeString()}
            </div>
          )}

          <div className="form">
            <input
              type="text"
              value={state.draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Post title"
              disabled={isBusy}
            />

            <textarea
              value={state.draft.content}
              onChange={(e) => updateDraft({ content: e.target.value })}
              placeholder="Write your post..."
              disabled={isBusy}
            />
          </div>

          <div className="actions">
            <button onClick={startSaveDraft} disabled={!hasChanges || isBusy}>
              {state.kind === 'saving-draft' ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={openPublishConfirmation}
              disabled={!state.draft.title || !state.draft.content || isBusy}
            >
              {state.kind === 'publishing' ? 'Publishing...' : 'Publish'}
            </button>

            <button onClick={openDiscardConfirmation} disabled={isBusy}>
              Discard Changes
            </button>
          </div>

          {/* Publish confirmation modal */}
          {state.kind === 'confirming-publish' && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Publish Post?</h2>
                <p>Are you sure you want to publish "{state.draft.title}"?</p>
                <div className="modal-actions">
                  <button onClick={cancelModal}>Cancel</button>
                  <button onClick={confirmPublish}>Publish</button>
                </div>
              </div>
            </div>
          )}

          {/* Discard confirmation modal */}
          {state.kind === 'confirming-discard' && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Discard Changes?</h2>
                <p>You have unsaved changes. Are you sure?</p>
                <div className="modal-actions">
                  <button onClick={cancelModal}>Keep Editing</button>
                  <button onClick={confirmDiscard}>Discard</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    default:
      return assertNever(state);
  }
}

// ============================================================================
// FAKE API
// ============================================================================

const fakeSaveApi = (_post: PostData): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) resolve();
      else reject(new Error('Save failed'));
    }, 1000);
  });

const fakePublishApi = (_post: PostData): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) resolve();
      else reject(new Error('Publish failed'));
    }, 1500);
  });
