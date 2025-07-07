Here’s a complete and professional `README.md` for your **FlashFlow** project, combining all your project info, features, technologies, design, and backend explanation:

---

````markdown
# ⚡ FlashFlow - AI Writing Assistant

**FlashFlow** is an AI-powered writing assistant that refines and enhances your text using the power of **Gemini 1.5 Flash**. It provides intelligent, structured suggestions to improve grammar, spelling, punctuation, clarity, vocabulary, and tone — making writing easier and smarter.

---

## ✨ Features

- ✅ **AI Text Analysis** – Get detailed suggestions on grammar, spelling, punctuation, word choice, and clarity.
- 🧠 **Tone Rewriting** – Instantly adjust the tone of your writing to Casual, Formal, Friendly, or Academic.
- 📝 **Live Text Editor** – A user-friendly input interface for typing or pasting content.
- 🔍 **Result Display** – Clearly see original text, AI suggestions, and explanations with smart highlighting.
- 🎛️ **Tone Selector** – Choose from predefined writing styles to guide AI rewriting.
- 📤 **Export Functionality** – Copy or export your rewritten content easily.

---

## 🧰 Technologies Used

| Layer         | Technology                     |
|---------------|--------------------------------|
| **AI Model**  | Gemini 1.5 Flash (Google)      |
| **Frontend**  | React, Next.js                 |
| **Backend**   | Node.js, Firebase              |
| **Icons**     | Lucide                         |
| **Styling**   | Tailwind CSS                   |

---

## 🧠 Backend Flow (`analyze-text.ts`)

FlashFlow uses `@/ai/genkit` to define an AI-powered analysis flow:

- **Text Analysis**: The `analyzeText` function sends user input to Gemini 1.5 Flash for grammar, vocabulary, and clarity review.
- **Structured JSON Output**: Each suggestion includes:
  - `id`: Unique suggestion ID
  - `category`: Type of issue (e.g., Grammar)
  - `original`: Original problematic text
  - `suggestion`: Suggested fix
  - `explanation`: Why the fix is recommended
  - `alternatives`: Optional alternative phrasings
- **Vocabulary Enhancement**: Common words are replaced with more advanced or precise options.
- **Unique IDs**: Uses `randomBytes` to ensure uniqueness of each suggestion.
- **Defined via** `ai.defineFlow()` and `ai.definePrompt()`.

---

## 🎨 UI/UX Design Principles

- 🎨 **Colors**: Sky Blue (`#87CEEB`), Light Blue (`#F0F8FF`), Soft Lavender (`#E6E6FA`)
- 🔤 **Typography**:
  - Headings: `Space Grotesk`
  - Body: `Inter`
- 🎯 **Minimal Icons**: Lucide
- 🧼 **Clean Layout**: Ample white space for readability
- 🌀 **Subtle Animations**: Non-intrusive effects for better UX

---

## 🚀 Getting Started

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flashflow.git
cd flashflow

# Install dependencies
npm install
````

### ▶️ Running the App

```bash
npm run dev
```

### 🔐 Setup Firebase

1. Create a Firebase project.
2. Enable Authentication and Firestore.
3. Add your Firebase config to a `firebase.config.js` file or `.env.local`.

### 🌐 Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

---

## 📁 Project Structure

```
flashflow/
│
├── public/               # Static files
├── src/
│   ├── components/       # Reusable UI elements
│   ├── pages/            # Next.js routing pages
│   ├── utils/            # Helper logic
│   ├── styles/           # Tailwind + custom styles
│   └── ai/               # analyze-text.ts AI flow
├── .env.local            # Environment config
├── firebase.config.js    # Firebase integration
├── next.config.js        # App config
└── README.md
```
---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for full details.

