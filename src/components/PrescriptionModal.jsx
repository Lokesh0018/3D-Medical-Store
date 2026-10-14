import { useState, useRef } from 'react'
import Icon from './Icon.jsx'
import { whatsappLink, STORE } from '../data/store.js'
import './PrescriptionModal.css'

export default function PrescriptionModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [notes, setNotes] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    processFile(selected)
  }

  const processFile = (selected) => {
    setFile(selected)
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = [
      `Hello ${STORE.name}, I am sharing a prescription for ordering medicines:`,
      patientName ? `• Patient Name: ${patientName}` : '',
      file ? `• Attached Document: ${file.name} (${Math.round(file.size / 1024)} KB)` : '',
      notes ? `• Patient Note/Requirements: ${notes}` : '',
      `Please verify and confirm availability with total cost.`,
    ].filter(Boolean).join('\n')

    window.open(whatsappLink(msg), '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <dialog
      className="rx-dialog"
      open
      aria-labelledby="rx-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rx-modal-panel">
        <button
          type="button"
          className="rx-modal-close"
          onClick={onClose}
          aria-label="Close prescription uploader"
        >
          <Icon name="close" size={20} />
        </button>

        <div className="rx-modal-head">
          <div className="rx-modal-icon-badge">
            <Icon name="rx" size={24} />
          </div>
          <div>
            <h2 id="rx-modal-title" className="rx-modal-title">Upload Prescription</h2>
            <p className="rx-modal-subtitle">
              Our registered pharmacist will verify your prescription and pack your medicines.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rx-form">
          <div
            className={`rx-dropzone${dragActive ? ' is-active' : ''}${file ? ' has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="rx-preview-wrap">
                <img src={preview} alt="Prescription preview" className="rx-preview-img" />
                <div className="rx-file-details">
                  <p className="rx-filename">{file.name}</p>
                  <p className="rx-filesize">{Math.round(file.size / 1024)} KB · Click to change file</p>
                </div>
              </div>
            ) : file ? (
              <div className="rx-file-selected">
                <Icon name="check" size={32} />
                <p className="rx-filename">{file.name}</p>
                <p className="rx-filesize">{Math.round(file.size / 1024)} KB (PDF) · Click to change</p>
              </div>
            ) : (
              <div className="rx-dropzone-content">
                <Icon name="upload" size={36} className="rx-upload-icon" />
                <p className="rx-dropzone-title">Click to upload or drag &amp; drop prescription</p>
                <p className="rx-dropzone-hint">Supports PNG, JPG, or PDF (up to 15MB)</p>
              </div>
            )}
          </div>

          <div className="rx-form-fields">
            <div>
              <label htmlFor="rx-patient-name" className="rx-field-label">Patient Name (Optional)</label>
              <input
                id="rx-patient-name"
                type="text"
                className="rx-input"
                placeholder="e.g. Rahul Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="rx-notes" className="rx-field-label">Specific instructions or medicine days</label>
              <textarea
                id="rx-notes"
                rows={2}
                className="rx-textarea"
                placeholder="e.g. Need 15 days supply, or generic substitutes preferred..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="rx-trust-points">
            <div><Icon name="shield" size={16} /> 100% Confidential &amp; HIPAA-aligned handling</div>
            <div><Icon name="check" size={16} /> Verified only by qualified registered pharmacists</div>
          </div>

          <div className="rx-actions">
            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={!file && !notes}
            >
              <Icon name="whatsapp" size={18} /> Proceed to Order on WhatsApp
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
