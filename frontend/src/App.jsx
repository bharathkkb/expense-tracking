import React, { useState, useEffect, useRef } from 'react'

const mockAvailableExpenses = [
  { merchant: 'Delta Airlines', details: 'DL123 (SFO-JFK)', amount: 450.00, category: 'airfare', status: 'Approved', compliance: 'green' },
  { merchant: 'Uber', details: 'Transportation', amount: 42.50, category: 'taxi', status: 'Awaiting Mgr.', compliance: 'yellow' },
  { merchant: "Ruth's Chris Steakhouse", details: 'Meals', amount: 215.80, category: 'meals', status: 'Action Req.', compliance: 'red', note: 'Policy Breach: Over Per Diem' },
  { merchant: 'Flight tickets', details: 'roundtrip SFO-LAS', amount: 350.00, category: 'airfare', status: 'Awaiting Mgr.', compliance: 'green' },
  { merchant: 'Business meals', details: 'Vegas', amount: 120.50, category: 'meals', status: 'Approved', compliance: 'green' }
]

function App() {
  const [expenses, setExpenses] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [user, setUser] = useState(null)
  const [loginUsername, setLoginUsername] = useState('')
  
  // Simple state for switching views
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Reports State
  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [reports, setReports] = useState([])
  const [reportTitle, setReportTitle] = useState('')
  const [filterOption, setFilterOption] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editJobTitle, setEditJobTitle] = useState('')
  const [editCostCtr, setEditCostCtr] = useState('')
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUsername = urlParams.get('username');
    if (urlUsername) {
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: urlUsername })
      })
        .then(res => res.json())
        .then(userData => setUser(userData))
        .catch(err => console.error('Error auto-logging in:', err))
    }
  }, [])

  useEffect(() => {
    if (user) {
      // Fetch Expenses
      fetch(`/api/expenses?username=${user.username}`)
        .then(res => res.json())
        .then(data => setExpenses(data))
        .catch(err => console.error('Error fetching expenses:', err))
        
      // Fetch Reports
      fetch(`/api/reports?username=${user.username}`)
        .then(res => res.json())
        .then(data => setReports(data))
        .catch(err => console.error('Error fetching reports:', err))
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
      .then(userData => {
        setUser(userData)
        window.history.pushState({}, '', `?username=${userData.username}`)
      })
      .catch(err => console.error('Error logging in:', err))
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const payload = { title, amount: parseFloat(amount), category, username: user.username, date }
    
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(newExpense => {
        setExpenses([newExpense, ...expenses])
        setTitle('')
        setAmount('')
        setCategory('')
      })
      .catch(err => console.error('Error adding expense:', err))
  }

  const handlePrepopulate = (mock) => {
    setTitle(`${mock.merchant} - ${mock.details}`)
    setAmount(mock.amount.toString())
    setCategory(mock.category)
    setDate(new Date().toISOString().substring(0, 10))
  }

  const toggleSelectExpense = (id) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(expId => expId !== id))
    } else {
      setSelectedExpenses([...selectedExpenses, id])
    }
  }

  const handleCreateReport = (e) => {
    e.preventDefault()
    if (selectedExpenses.length === 0 || !reportTitle) return
    
    const payload = {
      title: reportTitle,
      username: user.username,
      expense_ids: selectedExpenses
    }
    
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(newReport => {
        setReports([...reports, newReport])
        setReportTitle('')
        setSelectedExpenses([])
      })
      .catch(err => console.error('Error creating report:', err))
  }

  const handleUpdateProfile = () => {
    fetch(`/api/users/${user.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: editFirstName,
        last_name: editLastName,
        job_title: editJobTitle,
        cost_ctr: editCostCtr
      })
    })
      .then(res => res.json())
      .then(updatedUser => {
        setUser(updatedUser);
        setIsProfileModalOpen(false);
      })
      .catch(err => console.error('Error updating profile:', err))
  };

  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0)
  const totalPending = reports.reduce((acc, r) => acc + (r.total !== undefined ? r.total : r.expenses.reduce((sum, e) => sum + e.amount, 0)), 0)

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    // Dropdown Filter
    let matchesFilter = true;
    if (filterOption === 'amount') matchesFilter = e.amount > 200;
    if (filterOption === 'date') {
      const dateObj = new Date(e.date);
      const now = new Date();
      const diffTime = Math.abs(now - dateObj);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesFilter = diffDays <= 7;
    }

    // Search Filter
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = e.title ? e.title.toLowerCase() : '';
      const category = e.category ? e.category.toLowerCase() : '';
      matchesSearch = title.includes(query) || category.includes(query);
    }

    return matchesFilter && matchesSearch;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (sortColumn === 'compliance') {
      valA = a.amount > 500 ? 1 : 0;
      valB = b.amount > 500 ? 1 : 0;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="app-wrapper" style={{ backgroundColor: '#f4f5f7', minHeight: '100vh', width: '100%' }}>
      {!user ? (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Left Side: Hero/Marketing */}
          <div style={{ flex: 1, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontWeight: '700', fontSize: '2rem', color: '#fff' }}>g<span style={{ color: '#b5a46d' }}>Spend</span></span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '600', marginBottom: '1rem', lineHeight: '1.2' }}>Precision Expense Analytics for Teams</h1>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', lineHeight: '1.6' }}>
              Streamline your compliance operations and real-time transaction approvals across borders.
            </p>
          </div>

          {/* Right Side: Login Form */}
          <div style={{ width: '450px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ maxWidth: '320px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>Welcome Back</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Please sign in to your account.</p>
              
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Username</label>
                  <input
                    type="text"
                    className="input-field"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="E.g. john.doe@company.com"
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" style={{ width: '100%', padding: '0.75rem' }}>Sign In</button>
              </form>

              <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Protected by SSO. </span>
                <span style={{ color: 'var(--active-nav)', cursor: 'pointer' }}>Need Help?</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar Nav */}
          <div className="sidebar">
            <div>
              <div style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#ffffff' }}>g<span style={{ color: '#b5a46d' }}>Spend</span></span>

                </div>
              </div>
              <div className="nav-links">
                <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                  Dashboard
                </div>
                <div className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                  My Expenses
                </div>
                <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                  Analytics
                </div>
              </div>
            </div>
            <div className="user-profile" style={{ cursor: 'pointer' }} onClick={() => {
              setEditFirstName(user?.first_name || '');
              setEditLastName(user?.last_name || '');
              setEditJobTitle(user?.job_title || '');
              setEditCostCtr(user?.cost_ctr || '');
              setIsProfileModalOpen(true);
            }}>
              <div className="avatar">{user?.first_name && user?.last_name ? `${user.first_name[0]}${user.last_name[0]}` : 'JD'}</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Jane Doe'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.job_title ? `${user.job_title}, ${user.cost_ctr}` : 'Job Title, Cost Ctr'}</div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="main-content" style={{ flex: 1 }}>
            {/* Header */}
            <div className="header">
              <div className="logo-area">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Operations Dashboard</span>
              </div>
              <div className="header-right">

                <div style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>🌐</div>
                <div style={{ cursor: 'pointer', color: 'var(--text-muted)', position: 'relative' }}>
                  🔔 <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '0.1rem 0.3rem', fontSize: '0.6rem' }}>3</span>
                </div>

              </div>
            </div>

            <div className="dashboard-body">
              {activeTab === 'dashboard' ? (
                <>
              {/* Top row cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Pending Reimbursements:</h3>
                  <div className="stat-value">${totalPending.toFixed(2)}</div>
                  <div className="mock-line-chart"></div>
                </div>
                <div className="stat-card">
                  <h3>YTD Total Spend:</h3>
                  <div className="stat-value">${totalSpent.toFixed(2)}</div>
                  <div className="mock-chart" style={{ gap: '2px' }}>
                    <div style={{ width: '8px', height: '10px', background: '#e5e7eb' }}></div>
                    <div style={{ width: '8px', height: '15px', background: '#e5e7eb' }}></div>
                    <div style={{ width: '8px', height: '25px', background: '#e5e7eb' }}></div>
                    <div style={{ width: '8px', height: '35px', background: '#10b981' }}></div>
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Awaiting Mgr. Approval:</h3>
                  <div className="stat-value">2</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--active-nav)', marginTop: 'auto', textDecoration: 'underline', cursor: 'pointer' }}>
                    Detailed Mgr Request Link
                  </div>
                </div>
              </div>

              {/* Content Grid Container */}
              <div className="content-grid">
                
                {/* Left Box - Quick Submit */}
                <div className="quick-submit-card">
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>Quick Submit</div>
                  <div className="drop-area">
                    <span className="icon">↑</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Drag or Drop Receipts for Instant OCR & Matching.
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--active-nav)', textDecoration: 'underline' }}>
                      or Capture on Mobile App.
                    </div>
                  </div>
                  
                  {/* Mock drafts inserted here to keep image fidelity while satisfying initial goal */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Available Drafts</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {mockAvailableExpenses.map((mock, idx) => (
                        <div key={idx} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => handlePrepopulate(mock)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '600' }}>{mock.merchant}</span>
                            <span>${mock.amount.toFixed(2)}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{mock.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hidden Add Transaction logic bound to Form below drafts instead of toggles to mirror form styling */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Direct Add Entry</div>
                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <input type="text" placeholder="Merchant / Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <input type="number" placeholder="Amount" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <select className="input-field" value={category} onChange={e => setCategory(e.target.value)} required>
                          <option value="">Category</option>
                          <option value="airfare">Airfare</option>
                          <option value="meals">Meals</option>
                          <option value="taxi">Taxi</option>
                          <option value="lodging">Lodging</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-submit" style={{ width: '100%', textTransform: 'none', fontSize: '0.85rem', padding: '0.625rem', borderRadius: '6px' }}>Submit Line Item</button>
                    </form>
                  </div>
                </div>

                {/* Right Box - Table */}
                <div className="transactions-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>Recent Transactions</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <form onSubmit={handleCreateReport} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Report Title" 
                          className="input-field"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '150px' }}
                          value={reportTitle}
                          onChange={e => setReportTitle(e.target.value)}
                          required 
                          disabled={selectedExpenses.length === 0}
                        />
                        <button 
                          type="submit" 
                          className="btn-submit" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', textTransform: 'none', opacity: selectedExpenses.length === 0 ? 0.5 : 1, cursor: selectedExpenses.length === 0 ? 'not-allowed' : 'pointer' }}
                          disabled={selectedExpenses.length === 0}
                        >
                          Create Report ({selectedExpenses.length})
                        </button>
                      </form>
                      <select 
                        value={filterOption}
                        onChange={e => setFilterOption(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                      >
                        <option value="all">All Transactions</option>
                        <option value="amount">Amount &gt; $200</option>
                        <option value="date">Date (Last 7 Days)</option>
                      </select>
                            <input
                              type="text"
                              placeholder="Search"
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                            />
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>Date {sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>Merchant {sortColumn === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('amount')}>Amount {sortColumn === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Category {sortColumn === 'category' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('compliance')}>Policy Compliance {sortColumn === 'compliance' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions matching filter.</td>
                        </tr>
                      ) : (
                        sortedExpenses.map(e => {
                          // Fallback static fields for parsed mock looks matching user visual input
                          const merchant = e.title.split(' - ')[0] || e.title
                          const details = e.title.split(' - ')[1] || ''
                          
                          // Mock policy flag checks purely calculated towards UI look match
                          const isPolicyRed = e.amount > 200 && e.category === 'meals'
                          const parentReport = reports.find(r => r.expenses.some(repExp => repExp.id === e.id))

                          return (
                            <tr key={e.id}>
                              <td>
                                {!parentReport && (
                                  <input
                                    type="checkbox"
                                    checked={selectedExpenses.includes(e.id)}
                                    onChange={() => toggleSelectExpense(e.id)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                )}
                              </td>
                              <td>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td>
                                <div className="merchant-container">
                                  <span className="merchant-title">
                                    {merchant}
                                    {parentReport && <span style={{ fontSize: '0.65rem', background: '#eef2ff', color: '#4f46e5', padding: '0.1rem 0.3rem', borderRadius: '3px', marginLeft: '0.5rem', fontWeight: '500' }}>In Report: {parentReport.title}</span>}
                                  </span>
                                  {details && <span className="merchant-sub">{details}</span>}
                                </div>
                              </td>
                              <td style={{ fontWeight: '600' }}>${e.amount.toFixed(2)}</td>
                              <td>
                                <span style={{ color: 'var(--text-muted)', textTransform: 'lowercase' }}>{e.category || 'other'}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div className="policy-compliance">
                                    <span className="circle-indicator indicator-green"></span>
                                    <span className="circle-indicator indicator-yellow"></span>
                                    <span className={`circle-indicator ${isPolicyRed ? 'indicator-red' : 'indicator-green'}`}></span>
                                  </div>
                                  {isPolicyRed && <div className="policy-tag">Policy Breach: Over Per Diem</div>}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Active Reports Panel */}
                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>Submitted Reports</div>
                  {reports.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No submitted reports.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reports.map(r => (
                        <div key={r.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{r.title}</span>
                            <span className="status-badge status-pending" style={{ fontSize: '0.65rem' }}>Pending</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.5rem' }}>{r.expenses.length} line items</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>${(r.total !== undefined ? r.total : r.expenses.reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </>
              ) : activeTab === 'expenses' ? (
                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '1rem' }}>My Reports & Associated Transactions</div>
                  {reports.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No submitted reports.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {reports.map(r => (
                        <div key={r.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{r.title}</span>
                            <span className="status-badge status-pending">Pending</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | ${r.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                          </div>
                          
                          {/* Associated Transactions List */}
                          <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Line Items</div>
                            {r.expenses.map(e => (
                              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{e.title.split(' - ')[0]}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.category}</div>
                                </div>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>${e.amount.toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'analytics' ? (
                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '1rem' }}>Spend Analytics</div>
                  
                  {(() => {
                    const breakdown = expenses.reduce((acc, exp) => {
                      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
                      return acc
                    }, {})
                    
                    const categories = Object.keys(breakdown)
                    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
                    
                    return categories.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transaction data available.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {categories.map(cat => {
                          const amount = breakdown[cat]
                          const percentage = total > 0 ? (amount / total) * 100 : 0
                          
                          return (
                            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{cat}</span>
                                <span style={{ fontWeight: '600' }}>${amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--active-nav)' }}></div>
                              </div>
                            </div>
                          )
                        })}
                        
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.9rem' }}>
                          <span>Total Tracked Spend</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Tab not implemented yet.</div>
              )}
            </div>
          </div>

          {isProfileModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>Update Profile</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>First Name</label>
                  <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>Last Name</label>
                  <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>Job Title</label>
                  <input type="text" value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>Cost Center</label>
                  <input type="text" value={editCostCtr} onChange={e => setEditCostCtr(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setIsProfileModalOpen(false)} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                  <button onClick={handleUpdateProfile} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: 'none', background: 'var(--active-nav)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
