// src/core/TranslationHandler.js
import WhatsAppStrategy from "../strategies/WhatsAppStrategy.js";
import InstagramStrategy from "../strategies/InstagramStrategy.js";
import TwitterStrategy from "../strategies/TwitterStrategy.js";
import TelegramStrategy from "../strategies/TelegramStrategy.js";
import MediumStrategy from "../strategies/MediumStrategy.js";
import ChatGPTStrategy from "../strategies/ChatGPTStrategy.js";
import YoutubeStrategy from "../strategies/YoutubeStrategy.js";
import DefaultStrategy from "../strategies/DefaultStrategy.js";
import DiscordStrategy from "../strategies/DiscordStrategy.js";
import NotificationManager from "../managers/NotificationManager.js";
import IconManager from "../managers/IconManager.js";
import { debounce } from "../utils/debounce.js";
import { state, TranslationMode, CONFIG } from "../config.js";
import { translateText } from "../utils/api.js";
import { logMethod, isExtensionContextValid, logME } from "../utils/helpers.js";
import {
  detectPlatform,
  detectPlatformByURL,
  Platform,
} from "../utils/platformDetector.js";
import EventHandler from "./EventHandler.js";
import { ErrorHandler, ErrorTypes } from "../services/ErrorService.js";
import { getTranslationString } from "../utils/i18n.js";
import FeatureManager from "./FeatureManager.js";
import EventRouter from "./EventRouter.js";

/**
 * Handles translation requests from content script in a CSP-safe background context.
 * Used by SelectionWindows and Select Element handlers.
 *
 * @param {object} message - Message sent from content script.
 * @param {object} sender - Sender object from the runtime.onMessage listener.
 * @param {function} sendResponse - Function to send the result back.
 * @param {function} translateText - Translation method from api.js
 * @param {ErrorHandler} errorHandler - Centralized error handler instance
 */
export async function handleFetchTranslationBackground(
  message,
  sender,
  sendResponse,
  translateText,
  errorHandler
) {
  try {
    const { promptText, translationMode, sourceLang, targetLang } =
      message.payload || {};

    if (!promptText || typeof promptText !== "string") {
      throw new Error(
        (await getTranslationString("ERRORS_EMPTY_PROMPT")) ||
          "(Invalid or missing promptText.)"
      );
    }

    const translated = await translateText(
      promptText,
      translationMode,
      sourceLang,
      targetLang
    );

    /* ــ ترجمه باید رشتهٔ غیرخالی باشد ــ */
    if (typeof translated !== "string" || !translated.trim()) {
      const errMsg =
        typeof translated === "string" && translated ?
          translated
        : (await getTranslationString("ERRORS_BACKGROUND_ERROR")) ||
          "(خطای ترجمه از سرویس API)";

      /* لاگ و هندل خطا */
      await errorHandler.handle(new Error(errMsg), {
        type: ErrorTypes.API,
        context: "handler-fetchTranslation-background",
      });

      sendResponse({ success: false, error: errMsg });
      return true;
    }

    sendResponse({
      success: true,
      data: {
        translatedText: translated,
      },
    });
  } catch (msg) {
    await errorHandler.handle(new Error(msg), {
      type: ErrorTypes.API,
      context: "handler-fetchTranslation-background",
    });
    sendResponse({ success: false, error: msg });
  }
  return true;
}

export default class TranslationHandler {
  constructor() {
    // ابتدا notifier را ایجاد می‌کنیم تا برای ErrorHandler موجود باشد
    this.notifier = new NotificationManager();
    this.errorHandler = new ErrorHandler(this.notifier);
    this.ErrorTypes = ErrorTypes;
    this.handleEvent = debounce(this.handleEvent.bind(this), 300);

    this.strategies = {
      [Platform.WhatsApp]: new WhatsAppStrategy(
        this.notifier,
        this.errorHandler
      ),
      [Platform.Instagram]: new InstagramStrategy(
        this.notifier,
        this.errorHandler
      ),
      [Platform.Medium]: new MediumStrategy(this.notifier, this.errorHandler),
      [Platform.Telegram]: new TelegramStrategy(
        this.notifier,
        this.errorHandler
      ),
      [Platform.Twitter]: new TwitterStrategy(this.notifier, this.errorHandler),
      [Platform.ChatGPT]: new ChatGPTStrategy(this.notifier, this.errorHandler),
      [Platform.Youtube]: new YoutubeStrategy(this.notifier, this.errorHandler),
      [Platform.Default]: new DefaultStrategy(this.notifier, this.errorHandler),
      [Platform.Discord]: new DiscordStrategy(this.notifier, this.errorHandler),
    };

    this.validateStrategies();
    this.IconManager = new IconManager(this.errorHandler);
    this.displayedErrors = new Set();
    this.isProcessing = false;
    this.select_Element_ModeActive = false;

    this.featureManager = new FeatureManager({
      TEXT_FIELDS: CONFIG.TRANSLATE_ON_TEXT_FIELDS,
      SHORTCUT_TEXT_FIELDS: CONFIG.ENABLE_SHORTCUT_FOR_TEXT_FIELDS,
      SELECT_ELEMENT: CONFIG.TRANSLATE_WITH_SELECT_ELEMENT,
      TEXT_SELECTION: CONFIG.TRANSLATE_ON_TEXT_SELECTION,
      DICTIONARY: CONFIG.ENABLE_DICTIONARY,
    });

    this.eventHandler = new EventHandler(this, this.featureManager);
    this.eventRouter = new EventRouter(this, this.featureManager);
  }

  @logMethod
  reinitialize() {
    logME(
      "[TranslationHandler] Reinitializing TranslationHandler state after update..."
    );
    this.isProcessing = false;
    this.select_Element_ModeActive = false;
    // در صورت نیاز، متغیرهای داخلی دیگر مانند caches یا stateهای دیگر را هم ریست کنید
    // برای مثال:
    // state.originalTexts.clear();
    // this.IconManager.cleanup();
  }

  /**
   * Main event handler router
   */
  @logMethod
  async handleEvent(event) {
    try {
      await this.eventHandler.handleEvent(event);
    } catch (error) {
      throw await this.errorHandler.handle(error, {
        type: error.type || ErrorTypes.UI,
        context: "handleEvent",
        eventType: event.type,
      });
    }
  }

  @logMethod
  handleError(error, meta = {}) {
    try {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      this.errorHandler.handle(normalizedError, {
        ...meta,
        origin: "TranslationHandler",
      });
    } catch (error) {
      logME("[TranslationHandler] Error handling failed:", error);
      throw this.errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "TranslationHandler-handleError",
      });
    }
  }

  handleEditableFocus(element) {
    this.eventHandler.handleEditableFocus(element);
  }

  handleEditableBlur() {
    this.eventHandler.handleEditableBlur();
  }

  handleEscape(event) {
    this.eventHandler.handleEscape(event);
  }

  async handleCtrlSlash(event) {
    await this.eventHandler.handleCtrlSlash(event);
  }

  async handleEditableElement(event) {
    await this.eventHandler.handleEditableElement(event);
  }

  @logMethod
  async processTranslation_with_CtrlSlash(params) {
    const statusNotification = this.notifier.show(
      (await getTranslationString("STATUS_TRANSLATING_CTRLSLASH")) ||
        "(translating...)",
      "status"
    );
    try {
      if (!isExtensionContextValid()) {
        this.errorHandler.handle(
          new Error(await getTranslationString("ERRORS_INVALID_CONTEXT")),
          {
            type: ErrorTypes.CONTEXT,
            context: "TranslationHandler-processTranslation-context",
            code: "context-invalid",
            statusCode: "context-invalid",
          }
        );
        return;

        // OR
        // throw new Error(
        //   "TranslationHandler: Translation failed: Context Invalid",
        //   {
        //     type: ErrorTypes.CONTEXT,
        //     translationParams: params,
        //   }
        // );
      }

      // if (!params.text || !params.target) {
      //   console.warn("[TranslationHandler] Invalid parameter", params);
      //   throw new Error("TranslationHandler: Translation failed, Invalid parameter", {
      //     type: ErrorTypes.CONTEXT,
      //     translationParams: params,
      //   });
      // }

      const platform =
        params.target ? detectPlatform(params.target) : detectPlatformByURL();

      state.translateMode =
        params.selectionRange ?
          TranslationMode.SelectElement
        : TranslationMode.Field;

      const translated = await translateText(
        params.text,
        TranslationMode.Field
      );
      if (!translated) {
        return;
      }

      // اگر کاربر متنی را انتخاب کرده باشد، آن را ترجمه کن
      if (params.selectionRange) {
        this.handleSelect_ElementTranslation(platform, params, translated);
      }
      // در غیر این صورت، ترجمه را در عنصر هدف نمایش بده
      else if (params.target) {
        this.updateTargetElement(params.target, translated);
      }
    } catch (error) {
      // TODO: Requires further review, possible bug detected
      error = await ErrorHandler.processError(error);

      // هندل اولیه خطا توسط ErrorHandler (instance)
      const handlerError = await this.errorHandler.handle(error, {
        type: error.type || ErrorTypes.CONTEXT,
        context: "TranslationHandler-processTranslation",
        translationParams: params,
        isPrimary: true,
      });

      // اگر خطا به عنوان نهایی علامت‌گذاری شده باشد، دیگر نیازی به throw نیست
      if (handlerError.isFinal || handlerError.suppressSecondary) {
        return; // یا می‌توانید null برگردانید
      }

      const finalError = new Error(handlerError.message);
      Object.assign(finalError, {
        type: handlerError.type,
        statusCode: handlerError.statusCode,
        isFinal: true,
        originalError: error,
      });

      throw finalError;
    } finally {
      if (statusNotification) {
        this.notifier.dismiss(statusNotification);
      }
    }
  }

  /**
   * اعتبارسنجی استراتژیها
   */
  async validateStrategies() {
    try {
      Object.entries(this.strategies).forEach(([name, strategy]) => {
        if (typeof strategy.extractText !== "function") {
          throw new Error(
            `استراتژی ${name} متد extractText را پیاده‌سازی نکرده است`
          );
        }
      });
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.INTEGRATION,
        context: "strategy-validation",
      });
    }
  }

  @logMethod
  async handleSelect_ElementTranslation(platform, params, translated) {
    try {
      if (typeof translated !== "string" && !translated) {
        return;
      }
      if (this.strategies[platform]?.updateElement) {
        await this.strategies[platform].updateElement(
          params.selectionRange,
          translated
        );
      } else {
        this.errorHandler.handle(
          new Error(`متد updateElement برای ${platform} تعریف نشده`),
          {
            type: ErrorTypes.UI,
            context: "select-element-translation-updateElement",
            platform: platform,
          }
        );
      }
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.SERVICE,
        context: "select-element-translation",
        platform: platform,
      });
    }
  }

  @logMethod
  async updateTargetElement(target, translated) {
    try {
      if (typeof translated === "string" && translated) {
        const platform = detectPlatform(target);
        await this.strategies[platform].updateElement(target, translated);
      }
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.SERVICE,
        context: "update-target-element",
        platform: detectPlatform(target),
      });
    }
  }

  getSelectElementContext() {
    return {
      select_element: window.getSelection(),
      activeElement: document.activeElement,
    };
  }

  extractFromActiveElement(element) {
    const platform = detectPlatform(element);
    return this.strategies[platform].extractText(element);
  }

  @logMethod
  pasteContent(element, content) {
    try {
      const platform = detectPlatform(element);
      this.strategies[platform].pasteContent(element, content);
    } catch (error) {
      this.errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "paste-content",
        platform: detectPlatform(element),
      });
    }
  }
}
