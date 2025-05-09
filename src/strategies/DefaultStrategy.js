// src/strategies/DefaultStrategy.js

import { ErrorTypes } from "../services/ErrorTypes.js";
import PlatformStrategy from "./PlatformStrategy.js";
import { delay } from "../utils/helpers.js";
import DOMPurify from "dompurify";

export default class DefaultStrategy extends PlatformStrategy {
  constructor(notifier, errorHandler) {
    super(notifier);
    this.errorHandler = errorHandler;
  }

  /**
   * استخراج متن از المان‌های استاندارد (ایمن‌سازی شده)
   */
  extractText(target) {
    try {
      if (!target || !(target instanceof Element)) return "";

      // حالت contenteditable
      if (target.isContentEditable) {
        return target.innerText?.trim?.() || "";
      }

      // حالت input/textarea
      if (["TEXTAREA", "INPUT"].includes(target.tagName)) {
        return target.value?.trim?.() || "";
      }

      // حالت fallback برای سایر المان‌ها
      return target.textContent?.trim?.() || "";
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "default-strategy-extractText",
      });
      return "";
    }
  }

  async updateElement(element, translatedText) {
    try {
      if (translatedText !== undefined && translatedText !== null) {
        this.applyVisualFeedback(element);

        if (element.isContentEditable) {
          const htmlText = translatedText.replace(/\n/g, "<br>");
          const trustedHTML = DOMPurify.sanitize(htmlText, {
            RETURN_TRUSTED_TYPE: true,
          });

          const parser = new DOMParser();
          const doc = parser.parseFromString(
            trustedHTML.toString(),
            "text/html"
          );

          element.textContent = "";
          Array.from(doc.body.childNodes).forEach((node) => {
            element.appendChild(node);
          });

          this.applyTextDirection(element, htmlText);
        } else {
          element.value = translatedText;
          this.applyTextDirection(element, translatedText);
        }

        await delay(500);

        return true;
      }
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "default-strategy-updateElement",
      });
      return false;
    }
  }

  /**
   * پاک کردن محتوای المان قابل ویرایش
   */
  clearContent(element) {
    if (!element) return;

    try {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.value = "";
      } else {
        element.innerHTML = "";
      }
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "default-strategy-clearContent",
      });
    }
  }
}
