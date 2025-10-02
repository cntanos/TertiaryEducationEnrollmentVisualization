function attachAutoSelectHandlers(root = document) {
  const targets = root.querySelectorAll('[data-select-on-focus]');

  targets.forEach((input) => {
    // Skip elements that are not text-entry fields where selection makes sense.
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      return;
    }

    input.addEventListener('focus', () => {
      input.select();
      input.dataset.autoSelectActive = 'true';
    });

    // Prevent the mouseup event from clearing the programmatic selection when the user clicks once.
    input.addEventListener('mouseup', (event) => {
      if (input.dataset.autoSelectActive === 'true') {
        event.preventDefault();
        delete input.dataset.autoSelectActive;
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => attachAutoSelectHandlers(document));
} else {
  attachAutoSelectHandlers(document);
}

export { attachAutoSelectHandlers };
