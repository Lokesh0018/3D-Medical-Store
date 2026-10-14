import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { PriceTag, ProductArt } from './ProductBits.jsx'
import { CATEGORIES, PRODUCTS, categoryName, productPath } from '../data/products.js'
import './SearchModal.css'

export default function SearchModal({ isOpen, onClose }) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) dialog.showModal()
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  const results = query.trim()
    ? PRODUCTS.filter((p) => {
        const q = query.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.pack.toLowerCase().includes(q) ||
          (p.composition && p.composition.toLowerCase().includes(q)) ||
          (p.substitute && p.substitute.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        )
      }).slice(0, 6)
    : []

  const handleSelect = (path) => {
    onClose()
    navigate(path)
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="search-modal"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="search-modal-title"
    >
      <div className="search-modal__panel">
        <div className="search-modal__top">
          <Icon name="search" size={20} className="search-modal__icon" />
          <label htmlFor="omnisearch-input" id="search-modal-title" className="sr-only">
            Search medicines and products
          </label>
          <input
            ref={inputRef}
            id="omnisearch-input"
            type="search"
            className="search-modal__input"
            placeholder="Type medicine name, active salt (e.g. Paracetamol), or device..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="search-modal__close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <span className="kbd-shortcut">ESC</span>
          </button>
        </div>

        {query.trim() ? (
          <div className="search-modal__results">
            {results.length > 0 ? (
              <ul className="search-modal__list" role="listbox">
                {results.map((product) => (
                  <li key={product.id} role="option" aria-selected="false">
                    <button
                      type="button"
                      className="search-result-item"
                      onClick={() => handleSelect(productPath(product))}
                    >
                      <ProductArt product={product} className="search-result-item__art" />
                      <div className="search-result-item__info">
                        <div className="search-result-item__name-row">
                          <span className="search-result-item__name">{product.name}</span>
                          {product.rx && <span className="badge badge--rx">Rx</span>}
                        </div>
                        <span className="search-result-item__pack">{product.pack}</span>
                        {product.composition && (
                          <span className="search-result-item__salt">{product.composition}</span>
                        )}
                      </div>
                      <div className="search-result-item__price">
                        <PriceTag product={product} size="sm" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="search-modal__no-results">
                <p>No products found matching "<strong>{query}</strong>"</p>
                <div className="search-modal__suggestions">
                  <span>Try popular searches:</span>
                  {['Paracetamol', 'ORS', 'Vitamin C', 'BP Monitor', 'First Aid'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="chip chip--sm"
                      onClick={() => setQuery(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="search-modal__hints">
            <p className="search-modal__section-title">Popular Categories</p>
            <div className="search-modal__chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="chip chip--sm"
                  onClick={() => handleSelect(`/products?category=${cat.id}`)}
                >
                  <Icon name={cat.icon} size={14} /> {cat.name}
                </button>
              ))}
            </div>
            <div className="search-modal__tip">
              <Icon name="info" size={15} />
              <span>You can search by active chemical salt (e.g., Amoxicillin, Paracetamol) to find generic equivalents.</span>
            </div>
          </div>
        )}

        <div className="search-modal__foot">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Close with <kbd>ESC</kbd></span>
        </div>
      </div>
    </dialog>
  )
}
