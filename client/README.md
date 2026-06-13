# SignVault — Document Signature Platform

A full-stack DocuSign-style web application for uploading, sharing
and digitally signing PDF documents with audit trails.

## 🚀 Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React + Vite + TypeScript + Tailwind CSS  |
| Backend   | Node.js + Express + MongoDB (Mongoose)    |
| Storage   | Supabase Storage (PDFs)                   |
| Auth      | JWT + bcrypt                              |
| PDF       | react-pdf (viewer) · pdf-lib (generation) |

## ✅ Features Built (Week 1)

- [x] JWT authentication (register, login, protected routes)
- [x] PDF upload to Supabase Storage
- [x] Document list dashboard with status filters
- [x] Signature field placement on PDF (click to place)
- [x] Drag-and-drop signature field repositioning
- [x] Signature status tracking (pending/signed/rejected)
- [x] Audit trail logging

## 🔜 Coming (Week 2)

- [ ] Generate signed PDF with embedded signatures (pdf-lib)
- [ ] Email signing links with tokenized URLs
- [ ] Public signing page for external signers
- [ ] Full audit trail UI
- [ ] Deployment (Vercel + Render + MongoDB Atlas)

## 🛠️ Local Setup

```bash
# Clone
git clone https://github.com/ishitasinghvi2006-sys/signvault.git
cd signvault

# Backend
cd server
npm install
# Create .env with PORT, MONGO_URI, JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

## 📁 Project Structure

```
signvault/
├── client/          # React frontend
│   └── src/
│       ├── api/     # Axios instance
│       ├── context/ # AuthContext
│       ├── pages/   # Login, Register, Dashboard, Upload, DocViewer
│       └── components/ # SignatureField
└── server/          # Express backend
    └── src/
        ├── models/      # User, Document, Signature
        ├── controllers/ # auth, doc, signature
        ├── routes/      # /api/auth /api/docs /api/signatures
        └── middleware/  # JWT auth
```