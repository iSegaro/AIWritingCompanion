// content.js

/** USE_MOCK
 * Flag to control translation mode.
 *
 * When set to true, the extension uses mock translations instead of sending
 * requests to the Google API. This is useful for development and testing.
 *
 * در محیط توسعه و دیباگ، با تنظیم به true از ترجمه فرضی استفاده می‌شود و درخواست‌ها به API گوگل ارسال نمی‌شوند.
 */
// CONFIG.USE_MOCK = true;

// Regex patterns to detect Persian characters and RTL content
const PERSIAN_REGEX =
  /^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9\s.,:;؟!()«»\n\t\u200C]+$/;
const RTL_REGEX = /[\u0600-\u06FF]/;

// State management for selection and translation icon
const state = {
  selectionActive: false,
  highlightedElement: null,
  activeTranslateIcon: null,
};

// Debounce function to limit the rate of function calls
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Cleanup function to reset state and remove highlights/icons
function cleanup() {
  if (state.highlightedElement) {
    if (state.highlightedElement._observer) {
      state.highlightedElement._observer.disconnect();
    }
    state.highlightedElement.style.outline = "";
    state.highlightedElement.style.opacity = "1";
  }
  state.activeTranslateIcon?.remove();
  state.highlightedElement = null;
  state.activeTranslateIcon = null;
}

// Helper to introduce a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Observe changes to an element and update its text if needed
function observeChanges(element, translatedText) {
  // Disconnect existing observer if any
  if (element._observer) {
    element._observer.disconnect();
  }
  const observer = new MutationObserver(() => {
    if (element.innerText !== translatedText) {
      element.innerText = translatedText;
    }
  });
  observer.observe(element, { childList: true, subtree: true });
  element._observer = observer;
}

// ==============================
// Helper functions for DataTransfer-based text insertion
// ==============================

// Clear content of an editable field
function clearEditableField(field) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(field);
  selection.removeAllRanges();
  selection.addRange(range);

  const dt = new DataTransfer();
  dt.setData("text/plain", "");
  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: dt,
  });
  field.dispatchEvent(pasteEvent);
}

// Paste text into an editable field, converting line breaks to <br> tags
function pasteTextToEditableField(field, text) {
  const dt = new DataTransfer();
  dt.setData("text/plain", text);
  // Convert line breaks to <br> for preserving structure
  dt.setData("text/html", text.replace(/\n/g, "<br>"));
  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: dt,
  });
  field.dispatchEvent(pasteEvent);
}

// Set cursor to the end of the content in the field
function setCursorToEnd(field) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(field);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Persian
 * به‌روزرسانی فیلدهای ویرایش‌پذیر با متن ترجمه‌شده.
 * این تابع برای جایگزینی متن در المان‌های input و contentEditable استفاده می‌شود.
 * تاخیرهای موجود در تابع بسیار مهم هستند و نباید حذف یا تغییر داده شوند.
 * این تاخیرها به مرورگر کمک می‌کنند تا عملیات قبلی (مانند focus و select) را کامل کند.
 * حذف یا جابجایی این تاخیرها ممکن است باعث اختلال در کارکرد صحیح تابع شود.
 */

/** ENGLISH
 * Updates editable fields (input or contentEditable) with the translated text.
 *
 * Critical Note: Delays in this function are necessary to allow the browser
 * to properly complete prior operations (like focus and selection) before pasting text.
 * This is crucial for platforms like WhatsApp that rely on internal state management.
 *
 * Why delays matter:
 * 1. Ensures focus and selection actions complete before pasting.
 * 2. Prevents paste events from firing prematurely.
 * 3. Supports internal state updates on platforms like WhatsApp.
 *
 * Removing or altering these delays may cause:
 * - Text to fail when pasting.
 * - Focus to be lost.
 * - Internal state issues on platforms like WhatsApp.
 */
async function updateEditableField(element, translatedText) {
  // Special handling for chat.openai.com field (id "prompt-textarea")
  if (element.id === "prompt-textarea") {
    element.innerHTML = translatedText.replace(/\n/g, "<br>");
    const isRtl = RTL_REGEX.test(translatedText);
    element.setAttribute("dir", isRtl ? "rtl" : "ltr");
    setCursorToEnd(element);
    return;
  }

  // Handle Telegram message field by directly replacing innerHTML
  if (element.id === "editable-message-text") {
    element.innerHTML = translatedText.replace(/\n/g, "<br>");
    const isRtl = RTL_REGEX.test(translatedText);
    element.setAttribute("dir", isRtl ? "rtl" : "ltr");
    setCursorToEnd(element);
    return;
  }

  const isWhatsApp = element.closest('[aria-label="Type a message"]');

  if (isWhatsApp) {
    console.info("WhatsApp detected");

    // Focus and select all content
    element.focus({ preventScroll: true });
    await delay(100);
    document.execCommand("selectAll");
    await delay(100);

    // Prepare paste event with translated text
    const dt = new DataTransfer();
    dt.setData("text/plain", translatedText);
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      clipboardData: dt,
      cancelable: true,
    });

    // Trigger paste event
    element.dispatchEvent(pasteEvent);

    // Ensure React state updates
    await delay(50);
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  } else {
    // Handle other editable fields
    clearEditableField(element);
    await delay(50);
    pasteTextToEditableField(element, translatedText);
  }

  // Move cursor to the end after updating content
  setCursorToEnd(element);
}

// ==============================
// Translation functionality
// ==============================

// Translate the given text using mock or API call
async function translateText(text) {
  if (!text || text.length < 2) return text;

  if (CONFIG.USE_MOCK) {
    const isPersian = PERSIAN_REGEX.test(text);
    const prompt = isPersian
      ? CONFIG.DEBUG_TRANSLATED_ENGLISH
      : CONFIG.DEBUG_TRANSLATED_PERSIAN;
    return `${prompt} [${text}]`;
  }

  const isPersian = PERSIAN_REGEX.test(text);
  const prompt = isPersian ? CONFIG.PROMPT_ENGLISH : CONFIG.PROMPT_PERSIAN;
  try {
    const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + text }] }],
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Translation API error: ${
          errorData.error?.message || response.statusText
        }`
      );
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
  } catch (error) {
    console.error("Translation failed:", error);
    // Optionally, display an error notification to the user here
    return text;
  }
}

// ==============================
// Update element with translated text
// ==============================

async function updateElementWithTranslation(element, translatedText) {
  element.style.opacity = "0.5"; // Show loading state
  try {
    translatedText = translatedText.trim();
    const isRtl = RTL_REGEX.test(translatedText);
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.value = translatedText;
      element.setAttribute("dir", isRtl ? "rtl" : "ltr");
      // Dispatch input and change events
      const events = ["input", "change"];
      events.forEach((eventType) => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
    } else if (element.isContentEditable) {
      await updateEditableField(element, translatedText);
    } else {
      element.innerText = translatedText;
      element.setAttribute("dir", isRtl ? "rtl" : "ltr");
      element.style.textAlign = isRtl ? "right" : "left";
      observeChanges(element, translatedText);
    }
  } finally {
    element.style.opacity = "1"; // Reset opacity
    cleanup();
  }
}

// ==============================
// Create translate icon and position it relative to the target element
// ==============================
function createTranslateIcon(target) {
  const translateIcon = document.createElement("button");
  translateIcon.classList.add("translate-icon"); // Add a specific class to avoid document click conflicts (on chat.openai.com)
  Object.assign(translateIcon.style, {
    position: "absolute",
    background: "white",
    border: "1px solid gray",
    borderRadius: "4px",
    padding: "2px 5px",
    fontSize: "12px",
    cursor: "pointer",
    zIndex: "9999999999",
    pointerEvents: "auto",
  });
  translateIcon.innerText = CONFIG.TRANSLATION_ICON;
  translateIcon.title = CONFIG.TRANSLATION_ICON_TITLE;
  const rect = target.getBoundingClientRect();
  translateIcon.style.top = `${window.scrollY + rect.top - 5}px`;
  translateIcon.style.left = `${window.scrollX + rect.left + rect.width + 5}px`;
  return translateIcon;
}

// ==============================
// Event Handlers
// ==============================

// Handle click events to trigger translation
async function handleClick(event) {
  if (event.target.closest(".translate-icon")) return; // Prevent document-level click handling when clicking on the translate icon

  const target = event.target;
  // If selection mode is active, process the highlighted element
  if (state.selectionActive) {
    state.selectionActive = false;
    if (!state.highlightedElement) return;
    state.highlightedElement.style.outline = CONFIG.HIGHTLIH_NEW_ELEMETN_RED;
    const textToTranslate = state.highlightedElement?.innerText?.trim();
    if (!textToTranslate) return;
    const translatedText = await translateText(textToTranslate);
    if (translatedText) {
      await updateElementWithTranslation(
        state.highlightedElement,
        translatedText
      );
    }
  }
  // Identify element type (Draft.js, WhatsApp, input, textarea, or contentEditable)
  const isDraftJs = target.closest(".DraftEditor-root") !== null;
  const isWhatsApp = target.closest(".selectable-text.copyable-text") !== null;
  if (
    isDraftJs ||
    isWhatsApp ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  ) {
    cleanup();
    state.highlightedElement = target;
    // Create and append the translate icon
    const translateIcon = createTranslateIcon(target);
    document.body.appendChild(translateIcon);
    state.activeTranslateIcon = translateIcon;
    let debounceTimeout;
    translateIcon.addEventListener("click", async () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        let textToTranslate;
        if (isDraftJs) {
          // For Draft.js editors
          const tweetTextarea = target.closest(
            '[data-testid="tweetTextarea_0"]'
          );
          if (tweetTextarea) {
            const textElements =
              tweetTextarea.querySelectorAll('[data-text="true"]');
            textToTranslate = Array.from(textElements)
              .map((el) => el.textContent)
              .join(" ")
              .trim();
          }
        } else if (isWhatsApp) {
          // For WhatsApp; extract text from the span inside the contentEditable structure
          const container = target.closest('[contenteditable="true"]');
          if (container) {
            const spanElement = container.querySelector(
              'span[data-lexical-text="true"]'
            );
            if (spanElement) {
              textToTranslate = spanElement.textContent.trim();
              if (!textToTranslate) return;
            } else {
              return;
            }
          }
        } else {
          // For INPUT, TEXTAREA or other contentEditable elements
          textToTranslate = target.value || target.innerText.trim();
        }
        try {
          const translatedText = await translateText(textToTranslate);
          if (!translatedText) return;
          if (isWhatsApp) {
            // Use DataTransfer method to update WhatsApp field
            const container = target.closest('[contenteditable="true"]');
            if (container) {
              await updateEditableField(container, translatedText);
            }
          } else if (target.isContentEditable) {
            await updateEditableField(target, translatedText);
          } else {
            target.value = translatedText;
          }
        } catch (error) {
          return;
        }
      }, 500);
    });
  } else {
    cleanup();
  }
}

// ------------------------------
// Global Event Listeners
// ------------------------------

// Handle mouseover events when selection mode is active
document.addEventListener("mouseover", (event) => {
  if (!state.selectionActive) return;
  cleanup();
  state.highlightedElement = event.target;
  state.highlightedElement.style.outline = CONFIG.HIGHLIGHT_STYLE;
});

// Handle click events on the document
document.addEventListener("click", handleClick);

// Listen for keydown events for Escape and Ctrl+/ translation shortcut
document.addEventListener("keydown", async (event) => {
  // Escape key clears selection and icons
  if (event.key === "Escape") {
    cleanup();

    // Deactive Selection Mode
    state.selectionActive = false;
  }

  // Ctrl+/ triggers translation using the highlighted or active element
  if (event.ctrlKey && event.key === "/") {
    event.preventDefault();
    const target = state.highlightedElement || document.activeElement;
    if (!target) return;

    let textToTranslate;
    const isDraftJs = target.closest(".DraftEditor-root") !== null;
    const isWhatsApp =
      target.closest(".selectable-text.copyable-text") !== null;

    if (isDraftJs) {
      const tweetTextarea = target.closest('[data-testid="tweetTextarea_0"]');
      if (tweetTextarea) {
        const textElements =
          tweetTextarea.querySelectorAll('[data-text="true"]');
        textToTranslate = Array.from(textElements)
          .map((el) => el.textContent)
          .join(" ")
          .trim();
      }
    } else if (isWhatsApp) {
      const container = target.closest('[contenteditable="true"]');
      if (container) {
        const spanElement = container.querySelector(
          'span[data-lexical-text="true"]'
        );
        if (spanElement) {
          textToTranslate = spanElement.textContent.trim();
        }
      }
    } else {
      textToTranslate = target.value || target.innerText.trim();
    }

    if (!textToTranslate) return;

    try {
      const translatedText = await translateText(textToTranslate);
      if (!translatedText) return;
      if (isWhatsApp) {
        const container = target.closest('[contenteditable="true"]');
        if (container) {
          await updateEditableField(container, translatedText);
        }
      } else if (target.isContentEditable) {
        await updateEditableField(target, translatedText);
      } else {
        target.value = translatedText;
      }
    } catch (error) {
      console.error("Translation failed:", error);
    }
  }
});

// Listen for messages from background or popup scripts to enable selection mode
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "enable_selection") {
    state.selectionActive = true;
  }
});
