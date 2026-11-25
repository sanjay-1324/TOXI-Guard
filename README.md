# ToxiGuard

**ToxiGuard** is a cyberbullying and toxic comment detection system with code-mixed Tamil-English (Tanglish) support, TF-IDF feature extraction, Logistic Regression and Linear SVM classifiers, offensive token highlighting, and a Firestore-backed reporting and administrator moderation queue.

## Features

- **NLP Preprocessing Pipeline**: Text cleaning, URL/mention stripping, leetspeak/elongation normalization, tokenization, English & Tanglish stop-word removal, and Tanglish stem normalization.
- **ML Classification**: Real-time TF-IDF (word unigrams, bigrams, and character 4-grams) paired with Logistic Regression and Linear SVM classifiers trained on Jigsaw-style English and custom Tanglish corpora.
- **Severity Scoring & Token Highlighting**: Classifies comments as `Toxic` or `Non-Toxic`, assigns a `0–100` severity score, and highlights offending English/Tanglish words with English glosses.
- **Social Feed & Batch Evaluator**: Test comments in a simulated community stream or evaluate multiple lines in batch with CSV export.
- **Reporting & Admin Moderation Queue**: Users can flag toxic comments into Cloud Firestore, and administrators can review, confirm, escalate, dismiss, or delete reports.

## Run Locally in VS Code

1. Open the extracted project folder in **VS Code**.
2. Open the VS Code terminal (`Ctrl + \`` or `Terminal -> New Terminal`).
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

4. Open the local URL shown in the terminal: `http://localhost:3000`

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ToxiGuard toxic comment detection system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
