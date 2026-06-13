import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import docRoutes from './routes/docs.js'
import signatureRoutes from './routes/signatures.js'
import authRoutes from './routes/auth.js'


dotenv.config()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes

app.use('/api/auth', authRoutes)
app.use('/api/docs', docRoutes)
app.use('/api/signatures', signatureRoutes)

// Global error handler — catches any unhandled errors
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Max 50MB.' })
  }
  if (err.message === 'Only PDF files allowed') {
    return res.status(400).json({ message: err.message })
  }
  res.status(500).json({ message: 'Internal server error' })
})

// 404 handler — unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SignVault API running' })
})

// Connect MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server on port ${process.env.PORT}`)
    })
  })
  .catch((err) => console.error('MongoDB error:', err))