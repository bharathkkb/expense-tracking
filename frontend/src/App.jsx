import React, { useState, useEffect, useRef } from 'react'

const categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Other']

const mockAvailableExpenses = [
  { title: 'Flight tickets roundtrip SFO-LAS', amount: 350.00, category: 'Transport' },
  { title: 'Business meals - Vegas', amount: 120.50, category: 'Food' },
  { title: 'Uber to McCarran Airport', amount: 45.20, category: 'Transport' },
  { title: 'Hotel Stay - Bellagio', amount: 400.00, category: 'Bills' },
  { title: 'Client Lunch - Prime Steakhouse', amount: 85.00, category: 'Food' },
  { title: 'Taxi to Convention Center', amount: 50.00, category: 'Transport' }
]

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

  // UI State
  const [visibleForm, setVisibleForm] = useState('none') // 'add', 'reports', 'trip'

  // Reports State
  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [reports, setReports] = useState([])
  const [reportTitle, setReportTitle] = useState('')

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false)
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) setIsEditDropdownOpen(false)
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
        setVisibleForm('none')
      })
      .catch(err => console.error('Error adding expense:', err))
  }

  const handlePrepopulate = (mock) => {
    setTitle(mock.title)
    setAmount(mock.amount.toString())
    setCategory(mock.category)
    // Example implies date handles automatically or default current date
    setDate(new Date().toISOString().substring(0, 10))
    setVisibleForm('add')
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
      .then(() => {
        setExpenses(expenses.filter(e => e.id !== id))
        setSelectedExpenses(selectedExpenses.filter(espId => espId !== id))
      })
      .catch(err => console.error('Error deleting expense:', err))
  }

  const toggleSelectExpense = (id) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(e => e !== id))
    } else {
      setSelectedExpenses([...selectedExpenses, id])
    }
  }

  const handleCreateReport = (e) => {
    e.preventDefault()
    if (selectedExpenses.length === 0 || !reportTitle) return

    const reportExpenses = expenses.filter(e => selectedExpenses.includes(e.id))
    const totalAmount = reportExpenses.reduce((acc, e) => acc + e.amount, 0)

    const newReport = {
      id: Date.now(),
      title: reportTitle,
      expenses: reportExpenses,
      total: totalAmount,
      status: 'Pending Approval',
      date: new Date().toISOString()
    }

    setReports([...reports, newReport])
    setReportTitle('')
    setSelectedExpenses([])
    setVisibleForm('none')
  }

  const total = expenses.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="container">
      {!user ? (
        <div className="card" style={{ maxWidth: '400px', margin: '10vh auto', width: '100%' }}>
          <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.75rem' }}>gSpend Terminal</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter ID" 
                className="input-field"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Access Portal
            </button>
          </form>
        </div>
      ) : (
          <div>
            {/* Header */}
            <div className="header">
              <div>
                <h1 className="gradient-text" style={{ fontSize: '1.75rem' }}>Expense Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Session: {user.username}</p>
              </div>
              <button onClick={() => setUser(null)} className="btn btn-outline">Log Out</button>
          </div>
          
            {/* Top Actions */}
            <div className="top-actions">
              <button className="btn-action" onClick={() => setVisibleForm(visibleForm === 'add' ? 'none' : 'add')}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span>
                <span>Add Transaction</span>
              </button>
              <button className="btn-action" onClick={() => setVisibleForm(visibleForm === 'reports' ? 'none' : 'reports')}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#</span>
                <span>Create Report</span>
              </button>
              <button className="btn-action" onClick={() => setVisibleForm(visibleForm === 'trip' ? 'none' : 'trip')}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>→</span>
                <span>Plan a Trip</span>
              </button>
            </div>

            {/* Conditional Form Areas */}
            {visibleForm === 'add' && (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>New Transaction</h2>
                  <button className="btn btn-outline" onClick={() => setVisibleForm('none')}>Cancel</button>
                </div>
                <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" placeholder="Expense Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Amount ($)</label>
                    <input type="number" placeholder="0.00" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Category</label>
                    <select className="input-field" value={category} onChange={e => setCategory(e.target.value)} required>
                      <option value="">Select</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div style={{ paddingBottom: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Expense</button>
                  </div>
                </form>
              </div>
            )}

            {visibleForm === 'reports' && (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Create New Report</h2>
                  <button className="btn btn-outline" onClick={() => setVisibleForm('none')}>Cancel</button>
                </div>
                <form onSubmit={handleCreateReport} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Report Title</label>
                    <input type="text" placeholder="Quarterly Q1, Marketing Event etc." className="input-field" value={reportTitle} onChange={e => setReportTitle(e.target.value)} required />
                </div>
                  <div style={{ paddingBottom: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={selectedExpenses.length === 0}>
                      Submit {selectedExpenses.length} Selected Items
                    </button>
                  </div>
              </form>
                {selectedExpenses.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select transactions from the history list below to group them in this report.</p>}
            </div>
            )}

            {visibleForm === 'trip' && (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Trip Planner</h2>
                  <button className="btn btn-outline" onClick={() => setVisibleForm('none')}>Cancel</button>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>Planning feature coming soon...</p>
              </div>
            )}

            {/* Dashboard Layout */}
            <div className="dashboard-grid">
            
              {/* Left Column - History & Mock expenses */}
              <div>
                {/* Mock Expenses */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Drafts (Click to Add)</h2>
                  <div className="mock-expenses-grid">
                    {mockAvailableExpenses.map((mock, idx) => (
                      <div key={idx} className="mock-item" onClick={() => handlePrepopulate(mock)}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--primary)' }}>{mock.category}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: '0.25rem 0' }}>{mock.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>${mock.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transactions List */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Recent Transactions</h2>
                    <div style={{ fontWeight: '600' }}>Total Active: ${total.toFixed(2)}</div>
                  </div>

                  <div className="expenses-list">
                    {expenses.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions reported yet.</p>
                    ) : (
                      expenses.map(e => {
                        const parentReport = reports.find(r => r.expenses.some(repExp => repExp.id === e.id));
                        return (
                          <div key={e.id} className="transaction-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input
                                type="checkbox"
                                checked={selectedExpenses.includes(e.id)}
                                onChange={() => toggleSelectExpense(e.id)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {e.title}
                                  {parentReport && <span style={{ fontSize: '0.7rem', background: '#eef2ff', color: '#4f46e5', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>In Report: {parentReport.title}</span>}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  <span className="category-tag">{e.category}</span> • {new Date(e.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div className="amount-text">${e.amount.toFixed(2)}</div>
                              <button onClick={() => startEdit(e)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                              <button
                                onClick={() => handleDelete(e.id)} 
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Reports */}
              <div>
                <div className="card">
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Reports</h2>
                  {reports.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No reports created yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reports.map(r => (
                        <div key={r.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{r.title}</h3>
                            <span className="status-badge status-pending">{r.status}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Includes {r.expenses.length} line items
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>${r.total.toFixed(2)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Edit */}
      {editingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Edit Transaction</h2>
            <div className="form-group">
              <label>Description</label>
              <input type="text" className="input-field" value={editTitle} onChange={ev => setEditTitle(ev.target.value)} />
            </div>
            <div className="form-group">
              <label>Amount ($)</label>
              <input type="number" className="input-field" value={editAmount} onChange={ev => setEditAmount(ev.target.value)} step="0.01" />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="input-field" value={editDate} onChange={ev => setEditDate(ev.target.value)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="input-field" value={editCategory} onChange={ev => setEditCategory(ev.target.value)}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setEditingId(null)} className="btn btn-outline">Cancel</button>
              <button onClick={() => handleSave(editingId)} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
