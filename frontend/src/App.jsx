import React, { useState, useEffect, useRef } from 'react'

const categoryIcons = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Bills: '📄',
  Other: '📦'
}

function App() {
  const [expenses, setExpenses] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [user, setUser] = useState(null)
  const [loginUsername, setLoginUsername] = useState('')
  
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false)
  
  const dropdownRef = useRef(null)
  const editDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setIsEditDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (user) {
      fetch(`/api/expenses?username=${user.username}`)
        .then(res => res.json())
        .then(data => setExpenses(data))
        .catch(err => console.error('Error fetching expenses:', err))
    }
  }, [user])

  const handleLogin = (e) => {
    e.preventDefault()
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername })
    })
      .then(res => res.json())
      .then(userData => setUser(userData))
      .catch(err => console.error('Error logging in:', err))
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const payload = { title, amount: parseFloat(amount), category, username: user.username }
    if (date) payload.date = date
    
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(newExpense => {
        setExpenses([...expenses, newExpense])
        setTitle('')
        setAmount('')
        setCategory('')
        setDate('')
      })
      .catch(err => console.error('Error adding expense:', err))
  }

  const startEdit = (expense) => {
    setEditingId(expense.id)
    setEditTitle(expense.title)
    setEditAmount(expense.amount.toString())
    setEditCategory(expense.category)
    setEditDate(expense.date.substring(0, 10))
  }

  const handleSave = (id) => {
    fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, amount: parseFloat(editAmount), category: editCategory, date: editDate })
    })
      .then(res => res.json())
      .then(updatedExpense => {
        setExpenses(expenses.map(e => e.id === id ? updatedExpense : e))
        setEditingId(null)
      })
      .catch(err => console.error('Error updating expense:', err))
  }

  const handleDelete = (id) => {
    fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      .then(() => setExpenses(expenses.filter(e => e.id !== id)))
      .catch(err => console.error('Error deleting expense:', err))
  }

  const total = expenses.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="container">
      {!user ? (
        <div className="form-section" style={{ maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 className="gradient-text text-center" style={{ marginBottom: '2rem' }}>gSpend Login</h1>
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px' }}>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Enter Username" 
                className="input-field"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-gradient w-full">
              Login
            </button>
          </form>
        </div>
      ) : (
        <div className="main-wrapper">
          <div className="list-header" style={{ marginBottom: '2rem' }}>
            <h1 className="gradient-text">Welcome, {user.username}</h1>
            <button onClick={() => setUser(null)} className="btn-outline">Logout</button>
          </div>
          
          <div className="dashboard-grid">
            {/* Form Section */}
            <div className="form-section">
              <h2 className="gradient-text">New Transaction</h2>
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Expense Title" 
                    className="input-field"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="input-field"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      step="0.01"
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input 
                    type="date" 
                    className="input-field"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <div className="custom-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
                    <div 
                      className="input-field" 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{category || "Select Category"}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"></path></svg>
                    </div>
                    {isDropdownOpen && (
                      <div className="dropdown-options" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#f8fafc',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        marginTop: '0.25rem',
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                        zIndex: 10
                      }}>
                        {['Food', 'Transport', 'Entertainment', 'Bills', 'Other'].map(cat => (
                          <div 
                            key={cat} 
                            className="dropdown-option" 
                            onClick={() => {
                              setCategory(cat)
                              setIsDropdownOpen(false)
                            }}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                          >
                            <span>{categoryIcons[cat]}</span>
                            <span>{cat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button type="submit" className="btn-gradient w-full">
                  Add Expense
                </button>
              </form>
            </div>
            
            {/* List Section */}
            <div className="list-section">
              <div className="list-header" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <h2 className="gradient-text" style={{ marginBottom: 0 }}>Recent History</h2>
                <div className="summary-card" style={{ width: '100%' }}>
                  <div className="summary-label">Total Amount Spent</div>
                  <div className="summary-value">${total.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="expenses-list">
                {expenses.length === 0 ? (
                  <div className="empty-state">No transactions yet. Start by adding one!</div>
                ) : (
                  expenses.map(e => (
                    <div key={e.id} className="expense-item">
                      <div className="expense-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{categoryIcons[e.category] || '💰'}</span>
                          <div className="expense-title">{e.title}</div>
                        </div>
                        <div className="expense-meta">
                          <span className="category-tag">{e.category}</span>
                          <span className="date-tag">{new Date(e.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="expense-action">
                        <div className="expense-amount">${e.amount.toFixed(2)}</div>
                        <button onClick={() => startEdit(e)} className="btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} aria-label="Edit expense">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)} 
                          className="btn-delete"
                          aria-label="Delete expense"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: '#ffffff', borderRadius: '12px' }}>
            <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Edit Transaction</h2>
            <div className="form-group">
              <input type="text" className="input-field" value={editTitle} onChange={ev => setEditTitle(ev.target.value)} placeholder="Title" />
            </div>
            <div className="form-group">
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input type="number" className="input-field" value={editAmount} onChange={ev => setEditAmount(ev.target.value)} placeholder="Amount" step="0.01" style={{ paddingLeft: '2rem' }} />
              </div>
            </div>
            <div className="form-group">
              <input type="date" className="input-field" value={editDate} onChange={ev => setEditDate(ev.target.value)} />
            </div>
            <div className="form-group">
              <div className="custom-dropdown" ref={editDropdownRef} style={{ position: 'relative' }}>
                <div 
                  className="input-field" 
                  onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{editCategory || "Select Category"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isEditDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"></path></svg>
                </div>
                {isEditDropdownOpen && (
                  <div className="dropdown-options" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#f8fafc',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    marginTop: '0.25rem',
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                    zIndex: 1001
                  }}>
                    {['Food', 'Transport', 'Entertainment', 'Bills', 'Other'].map(cat => (
                      <div 
                        key={cat} 
                        className="dropdown-option" 
                        onClick={() => {
                          setEditCategory(cat)
                          setIsEditDropdownOpen(false)
                        }}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                      >
                        <span>{categoryIcons[cat]}</span>
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button onClick={() => setEditingId(null)} className="btn-outline">Cancel</button>
              <button onClick={() => handleSave(editingId)} className="btn-gradient">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
