# 📘 Memora.

A simple and effective web application that helps users memorize English vocabulary using personalized flashcards. Built with Flask and Oracle 21c Database.

## 🚀 Features

- 🔐 **User Authentication**: Register & Login with hashed passwords.
- 🧠 **Memory Forge**: Create flashcards under categories — supports adding new categories directly via dropdown.
- 🗂️ **Manage Flashcards**: View, edit, and delete flashcards grouped by categories (popup editing included).
- 🧾 **Memorizing Mode**: Study your flashcards interactively, like physical cards.
- ⚙️ **Smart Backend**: Uses triggers, sequences, and stored procedures in Oracle to ensure data consistency and enable future analytics.

---

## 🛠 Tech Stack

| Layer     | Tools/Frameworks         |
|-----------|--------------------------|
| Backend   | Python, Flask            |
| Frontend  | HTML, CSS, JavaScript    |
| Database  | Oracle 21c               |
| Tools     | SQL Developer, SQL Plus  |

---

## 🧩 Database Schema Overview

### Tables

- **USERS**: `USERID`, `USERNAME`, `PASSWORDHASH`
- **CATEGORY**: `CATID`, `USERID`, `CATEGORYNAME`, `FLASHCARDCOUNT`
- **FLASHCARD**: `CARDID`, `USERID`, `CATID`, `VOCABWORD`, `WORDTYPE`, `MEANING`, `EXAMPLE`, `LASTUPDATETIME`, `WORDLEVEL`

### Triggers

- `trg_flashcard_insert`: Increases flashcard count in a category.
- `trg_flashcard_update`: Adjusts count when flashcard moves to another category.
- `trg_flashcard_delete`: Decreases flashcard count when removed.

### Stored Procedures

- `get_user_statistics`: Fetches total flashcards, categories, and count by difficulty levels per user (to be integrated with a future profile page).

---
