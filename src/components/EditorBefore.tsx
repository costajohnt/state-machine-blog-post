import { useState } from 'react';

/**
 * BEFORE: The Boolean Soup Approach
 *
 * This component manages a blog post editor with multiple useState calls.
 * Notice how hard it is to understand what states are valid together.
 */

interface Post {
  title: string;
  content: string;
}

export function PostEditorBefore() {
  // The boolean soup - each piece of state managed separately
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [_isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Derived state - but we have to remember to check this everywhere
  const hasUnsavedChanges = title !== originalTitle || content !== originalContent;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
    setShowSuccessMessage(false); // Don't forget to reset this!
    setHasError(false); // And this!
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
    setShowSuccessMessage(false);
    setHasError(false);
  };

  const handleSaveDraft = async () => {
    // Bug-prone: what if we're already saving? Or publishing?
    // We have to check all these conditions manually
    if (isSaving || isPublishing) return;

    setIsSaving(true);
    setHasError(false);
    setShowSuccessMessage(false);

    try {
      await fakeSaveApi({ title, content });
      setOriginalTitle(title);
      setOriginalContent(content);
      setIsDirty(false);
      setLastSavedAt(new Date());
      setShowSuccessMessage(true);
      // Oops - did we forget to setIsSaving(false) here?
    } catch (error) {
      setHasError(true);
      setErrorMessage('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishClick = () => {
    // What if showDiscardModal is already open?
    // We're not checking for that...
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    setShowPublishModal(false);
    setIsPublishing(true);
    setHasError(false);

    try {
      await fakePublishApi({ title, content });
      setOriginalTitle(title);
      setOriginalContent(content);
      setIsDirty(false);
      setShowSuccessMessage(true);
      // TODO: Should we redirect? Show different UI?
      // The boolean soup makes it hard to know what state we're in
    } catch (error) {
      setHasError(true);
      setErrorMessage('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardClick = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      // No changes, just reset
      handleConfirmDiscard();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setTitle(originalTitle);
    setContent(originalContent);
    setIsDirty(false);
    setHasError(false);
    setShowSuccessMessage(false);
  };

  const handleCancelModal = () => {
    setShowPublishModal(false);
    setShowDiscardModal(false);
  };

  // The render logic becomes a mess of conditionals
  // What if isLoading AND hasError are both true? Is that valid?
  // What if showPublishModal AND showDiscardModal are both true?

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="editor">
      <h1>Edit Post</h1>

      {hasError && (
        <div className="error-banner">
          {errorMessage}
          <button onClick={() => setHasError(false)}>Dismiss</button>
        </div>
      )}

      {showSuccessMessage && (
        <div className="success-banner">
          Saved successfully!
          {lastSavedAt && <span> at {lastSavedAt.toLocaleTimeString()}</span>}
        </div>
      )}

      <div className="form">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Post title"
          disabled={isSaving || isPublishing}
        />

        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Write your post..."
          disabled={isSaving || isPublishing}
        />
      </div>

      <div className="actions">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving || isPublishing || !hasUnsavedChanges}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>

        <button
          onClick={handlePublishClick}
          disabled={isSaving || isPublishing || !title || !content}
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>

        <button
          onClick={handleDiscardClick}
          disabled={isSaving || isPublishing}
        >
          Discard Changes
        </button>
      </div>

      {/* Modals - what prevents both from showing at once? Just hope? */}
      {showPublishModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Publish Post?</h2>
            <p>Are you sure you want to publish "{title}"?</p>
            <div className="modal-actions">
              <button onClick={handleCancelModal}>Cancel</button>
              <button onClick={handleConfirmPublish}>Publish</button>
            </div>
          </div>
        </div>
      )}

      {showDiscardModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Discard Changes?</h2>
            <p>You have unsaved changes. Are you sure you want to discard them?</p>
            <div className="modal-actions">
              <button onClick={handleCancelModal}>Keep Editing</button>
              <button onClick={handleConfirmDiscard}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fake API functions
const fakeSaveApi = (_post: Post): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) resolve();
      else reject(new Error('Save failed'));
    }, 1000);
  });

const fakePublishApi = (_post: Post): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) resolve();
      else reject(new Error('Publish failed'));
    }, 1500);
  });
