/**
 * Rich Text Editor Utilities
 * Shared formatting functions for admin product and event editors
 */

window.richTextEditor = {
  /**
   * Format selected text with HTML tag
   * @param {string} command - The formatting command (bold, italic, underline, etc.)
   * @param {HTMLTextAreaElement} textarea - The textarea element to format
   */
  formatText: (command, textarea) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    switch(command) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText}</h2>`;
        break;
      case 'h3':
        formattedText = `<h3>${selectedText}</h3>`;
        break;
      case 'ul':
        formattedText = `<ul>\n  <li>${selectedText}</li>\n</ul>`;
        break;
      case 'ol':
        formattedText = `<ol>\n  <li>${selectedText}</li>\n</ol>`;
        break;
      case 'li':
        formattedText = `<li>${selectedText}</li>`;
        break;
      case 'br':
        formattedText = `${selectedText}<br>`;
        break;
    }

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
  },

  /**
   * Insert a link at cursor position
   * @param {HTMLTextAreaElement} textarea - The textarea element
   */
  insertLink: (textarea) => {
    const url = prompt('Enter URL:');
    if (!url) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const linkText = selectedText || 'link text';
    const formattedText = `<a href="${url}" target="_blank">${linkText}</a>`;

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
  },

  /**
   * Insert an image at cursor position
   * @param {HTMLTextAreaElement} textarea - The textarea element
   */
  insertImage: (textarea) => {
    const url = prompt('Enter image URL:');
    if (!url) return;

    const alt = prompt('Enter alt text:', '');
    const start = textarea.selectionStart;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(start);

    const formattedText = `<img src="${url}" alt="${alt || 'Image'}" style="max-width: 100%; height: auto;">`;

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
  },

  /**
   * Create toolbar buttons for rich text editor
   * @param {string} textareaId - The ID of the textarea to control
   * @returns {HTMLDivElement} The toolbar element
   */
  createToolbar: (textareaId) => {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar';
    toolbar.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;';

    const buttons = [
      { label: 'B', title: 'Bold', command: 'bold', style: 'font-weight: bold;' },
      { label: 'I', title: 'Italic', command: 'italic', style: 'font-style: italic;' },
      { label: 'U', title: 'Underline', command: 'underline', style: 'text-decoration: underline;' },
      { label: 'H2', title: 'Heading 2', command: 'h2' },
      { label: 'H3', title: 'Heading 3', command: 'h3' },
      { label: '• List', title: 'Bullet List', command: 'ul' },
      { label: '1. List', title: 'Numbered List', command: 'ol' },
      { label: 'LI', title: 'List Item', command: 'li' },
      { label: 'Link', title: 'Insert Link', command: 'link' },
      { label: 'BR', title: 'Line Break', command: 'br' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = btn.label;
      button.title = btn.title;
      if (btn.style) button.style.cssText = btn.style;
      button.style.cssText += 'padding: 4px 8px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 4px;';
      
      button.addEventListener('click', () => {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;
        
        if (btn.command === 'link') {
          window.richTextEditor.insertLink(textarea);
        } else {
          window.richTextEditor.formatText(btn.command, textarea);
        }
      });

      toolbar.appendChild(button);
    });

    return toolbar;
  }
};
