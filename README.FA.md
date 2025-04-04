# AI Writing Companion

<div align="center">
    <strong>
        • <a href="./README.md">English</a> | 
        • <a href="./README.FA.md">فارسی</a>
    </strong>
</div>

<br>

افزونه مترجم مرورگر، یک ابزار شخصیِ سبک و کارآمد برای ترجمه آسان متن در وب. این افزونه با ارائه چهار روش مختلف ترجمه و جستجوی لغت، تجربه کاربری روان و سریعی را فراهم می‌کند: ترجمه سریع متن با انتخاب، ترجمه المان‌های صفحه، ترجمه در فیلدهای متنی، و نمایش اطلاعات دیکشنری برای لغات انتخابی.

**ترجمه هوشمند و سریع، همواره در دسترس.**

<br>

## ⚙️ ویژگی‌های کلیدی

- **ترجمه با انتخاب متن (Select Text):** متن مورد نظر خود را در هر وبسایتی انتخاب کنید. پس از رها کردن دکمه ماوس، ترجمه متن انتخاب شده به سرعت در همان مکان نمایش داده می‌شود. **اگر یک کلمه انتخاب شود، اطلاعات دیکشنری مرتبط نیز نمایش داده خواهد شد.**
- **ترجمه با انتخاب المان (Select Element):** با فعال کردن حالت "انتخاب المان" از طریق کلیک بر روی آیکون افزونه در نوار ابزار مرورگر، می‌توانید روی هر عنصر دلخواه در صفحه (مانند پاراگراف‌ها، دکمه‌ها و غیره) کلیک کنید تا محتوای آن به زبان مورد نظر شما ترجمه شود.
- **ترجمه در فیلدهای متنی (Field):** هنگام کار با فرم‌ها، ویرایشگرها و سایر فیلدهای متنی، می‌توانید به دو روش متن خود را ترجمه کنید:
  - **با استفاده از میانبر `Ctrl + /`:** با فشردن این کلیدهای ترکیبی، متن موجود در فیلد فعال به سرعت ترجمه خواهد شد.
  - **با کلیک بر روی آیکون مترجم:** یک آیکون مترجم کوچک در کنار فیلدهای متنی ظاهر می‌شود. با کلیک بر روی آن، می‌توانید محتوای فیلد را به آسانی ترجمه کنید.
- **حالت دیکشنری (Dictionary Mode):** با انتخاب یک کلمه در صفحه با استفاده از ماوس، علاوه بر ترجمه، اطلاعات جامعی مانند معنی، مترادف‌ها، نوع کلمه و مثال‌ها (در صورت وجود) نمایش داده می‌شود. این ویژگی به شما کمک می‌کند تا درک عمیق‌تری از لغات داشته باشید.
- **پشتیبانی از ارائه‌دهندگان ترجمه متنوع:** این افزونه از چندین سرویس ترجمه هوش مصنوعی مختلف پشتیبانی می‌کند، که به شما امکان می‌دهد بهترین گزینه را برای نیازهای خود انتخاب کنید.

  - [Gemini][gemini-url] (✔ رایگان)
  - [OpenAI][openai-url]
  - [OpenRouter][openrouter-url] (✔ رایگان)
  - [WebAI to API][webai-to-api-url] (✔ رایگان)

<br>

## 📋 نیازمندی‌ها

- مرورگر مدرن مبتنی بر Chromium (Chrome، Edge، Brave و غیره)
- یک کلید API معتبر (در صورت عدم استفاده از [WebAI to API][webai-to-api-url])

<br>

---

## 🔧 نصب

یه کم ریزه‌کاری داره تموم بشه، بزودی توی Chrome Store هم منتشر می‌کنیم.

### ۱. نصب از طریق فایل CRX

- آخرین نسخه [`AI-Writing-Companion.crx`][crx-download-url] را از پوشه [`Build-Extension/Chrome/`][chrome-build-folder-url] دانلود کنید.
- [`chrome://extensions/`][chrome-extensions-url] را در Chrome باز کنید و **حالت توسعه‌دهنده** را فعال کنید.
- فایل [`.CRX`][crx-download-url] را به صفحه `chrome://extensions/` بکشید و رها کنید تا افزونه نصب شود.
- به صفحه **تنظیمات** افزونه بروید و کلید API خود را وارد کنید.

### ۲. نصب از طریق Git

```bash
# مخزن را کلون کنید
git clone https://github.com/iSegaro/AIWritingCompanion.git
cd AI-Writing-Companion
```

- به جای استفاده از فایل CRX، می توانید از پوشه `AI-Writing-Companion/Build-Extension/Chrome/` استفاده کنید.
- بقیه مراحل نصب مثل **CRX**.

<br>

---

## 🔑 کلیدهای API

برای استفاده نیاز به بک کلید API از ارائه‌دهندگان زیر دارید:

| ارائه‌دهنده   | دریافت کلید API                                  | هزینه                      |
| ------------- | ------------------------------------------------ | -------------------------- |
| Google Gemini | [Google AI Studio][gemini-api-key-url]           | رایگان                     |
| OpenAI        | [کلیدهای API OpenAI][openai-api-key-url]         | پولی                       |
| OpenRouter    | [کلیدهای API OpenRouter][openrouter-api-key-url] | رایگان                     |
| WebAI to API  | _(نیاز به کلید ندارد)_                           | [رایگان][webai-to-api-url] |

**توجه:** **`WebAI to API`** یک سرور python است که بدون نیاز به API میتونید API Local داشته باشید.

<br>

---

## 🎯 نحوه استفاده

- **انتخاب عنصر:** روی آیکون مترجم تو نوارابزار مرورگر کلید کنید و سپس با انتخاب هر عنصر در صفحه که به شکل برجسته (هایلایت) در میاد، تمام متن داخل عنصر انتخاب شده ترجمه شده و جایگزین می شود،
  با ESC هم به حالت قبل برمیگرده.
- **فیلدهای نوشتاری:** با کلیک روی هر فیلد، آیکون ترجمه ظاهر میشه.
- **میانبر:** هنگامی که یک فیلد ورودی فعال است، `Ctrl + /` را فشار دهید تا ترجمه فعال شود.
  توی هر فیلدی که درحال تایپ هستید، متن رو به زبان خودتون بنویسید، بعدش با فشردن شورتکات بصورت خودکار متن ترجمه شده با متن اصلی جایگزین می شود. خیلی خوبه دوسش دارم : )

<br>

---

## ☕ به من قهوه‌ای بدهید

اگر این پروژه به نظرتون مفید بود و امکانش هم براتون بود، یه قهوه مهمونم کنید :)

<br>

| 💰 روش پرداخت          | 🔗 لینک                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🟢 **USDT (Ethereum)** | `0x76DAF7D7C3f7af9B90e16B5C25d063ff3A1A0f8f`                                                                                                                       |
| 🟠 **Bitcoin (BTC)**   | `bc1qgxj96s6nks6nyhzlncw65nnuf7pyngyyxmfrsw`                                                                                                                       |
| 💲 **PayPal**          | [![کمک مالی PayPal](https://img.shields.io/badge/Donate-Paypal-00457C?logo=paypal&labelColor=gold)](https://www.paypal.com/donate/?hosted_button_id=DUZBXEKUJGKLE) |

<br>
با تشکر از حمایت شما!

حمایت شما به محمد می‌رسد [![محمد X](<https://img.shields.io/badge/X%20(Twitter)-M_Khani65-green?style=flat&logo=x>)][mohammad-x-url]

<br>

---

## 🤝 مشارکت

- **مخزن را ستاره‌دار کنید** تا از پروژه پشتیبانی کنید. ⭐
- **مشکلات را گزارش دهید:** [مشکلات GitHub][github-issues-url] 🐞
- **Pull Request (PR) ارسال کنید** تا در بهبود پروژه مشارکت کنید.

<br>

---

## ⚙️ توسعه

### پیش‌نیازها

مطمئن شوید **Node.js** نصب است (که شامل `npm` می‌شود)، بعدش توی ترمینال دستور زیر را بنویسید:

```bash
cd AI-Writing-Companion
npm install
```

### ساخت

برای تولید فایل‌های افزونه دستور زیر را تایپ کنید:

```bash
npm run build
```

این دستور پوشه `AI-Writing-Companion/Build-Extension/Chrome/` را برای نصب به صورت دستی ایجاد می‌کند.

ولی اگه میخواهید تغییرات توش بدید از دستور زیر استفاده کنید خیلی بیشتر به کارتون میاد:

```bash
npm run watch
```

<br>

---

## 🎨 اعتبارات

- iSegar0 [![iSegar0 X](<https://img.shields.io/badge/X%20(Twitter)-iSegar0-blue?style=flat&logo=x>)](https://x.com/iSegar0/)
- Mohammad [![محمد X](<https://img.shields.io/badge/X%20(Twitter)-M_Khani65-blue?style=flat&logo=x>)](https://x.com/M_Khani65/)
- آیکون توسط [Pixel perfect - Flaticon][flaticon-url]

<br>

---

## 📜 مجوز

این پروژه تحت **مجوز MIT** است. آزادانه بهبود دهید و به اشتراک بگذارید!

[gemini-url]: https://gemini.com/
[openai-url]: https://chat.openai.com/
[openrouter-url]: https://openrouter.ai/
[webai-to-api-url]: https://github.com/Amm1rr/WebAI-to-API/
[crx-download-url]: https://github.com/iSegaro/AIWritingCompanion/raw/refs/heads/main/Build-Extension/Chrome/AI-Writing-Companion.crx
[chrome-build-folder-url]: https://github.com/iSegaro/AIWritingCompanion/raw/refs/heads/main/Build-Extension/Chrome/
[chrome-extensions-url]: chrome://extensions/
[gemini-api-key-url]: https://aistudio.google.com/apikey/
[openai-api-key-url]: https://platform.openai.com/api-keys/
[openrouter-api-key-url]: https://openrouter.ai/settings/keys/
[mohammad-x-url]: https://x.com/m_khani65/
[github-issues-url]: https://github.com/iSegaro/AIWritingCompanion/issues
[isegaro-x-url]: https://x.com/iSegar0/
[m-khani65-x-url]: https://x.com/M_Khani65/
[flaticon-url]: https://www.flaticon.com/free-icons/translate
