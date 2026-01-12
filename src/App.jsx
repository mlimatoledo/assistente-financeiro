import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import BankSummary from './components/BankSummary';
import BillManager from './components/BillManager';
import MilesManager from './components/MilesManager';
import Login from './components/Login';
import { supabase } from './lib/supabaseClient';
import styles from './App.module.css';
import { Plus, Download, Upload, Calendar as CalendarIcon, User, Users, Trash2, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('profiles');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Meu Perfil' }];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    const saved = localStorage.getItem('activeProfileId');
    return saved || 'default';
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [
      { id: 'default', name: 'Carteira', initialBalance: 0, profileId: 'default' }
    ];
  });

  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [milesEntries, setMilesEntries] = useState(() => {
    const saved = localStorage.getItem('milesEntries');
    return saved ? JSON.parse(saved) : [];
  });

  const [profileFilter, setProfileFilter] = useState('ALL'); // 'ALL' | 'PF' | 'PJ'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newProfileName, setNewProfileName] = useState('');

  // Brasilia Time Logic
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 3600000);
    return () => clearInterval(timer);
  }, []);

  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'
  }).format(currentDate);

  // Persistence Logic for Local Storage (until Supabase Sync is fully ready)
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('profiles', JSON.stringify(profiles));
      localStorage.setItem('activeProfileId', activeProfileId);
      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('accounts', JSON.stringify(accounts));
      localStorage.setItem('bills', JSON.stringify(bills));
      localStorage.setItem('milesEntries', JSON.stringify(milesEntries));
    }
  }, [profiles, activeProfileId, transactions, accounts, bills, milesEntries, isAuthenticated]);

  // Supabase Auth Listeners
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        // Clear sensitive local data on logout if desired
        // localStorage.clear(); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // CRUD Handlers
  const addProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const newProfile = { id: crypto.randomUUID(), name: newProfileName };
    setProfiles([...profiles, newProfile]);
    setNewProfileName('');
    setIsProfileModalOpen(false);
  };

  const deleteProfile = (id) => {
    if (id === 'default') return alert('Nao e possivel excluir o perfil principal.');
    if (confirm('Tem certeza? Todos os dados vinculados a este familiar serao mantidos, mas ficarao sem perfil associado.')) {
      setProfiles(profiles.filter(p => p.id !== id));
      if (activeProfileId === id) setActiveProfileId('default');
    }
  };

  const filteredAccounts = accounts.filter(a => {
    const accountProfile = a.profile || 'PF';
    return profileFilter === 'ALL' || accountProfile === profileFilter;
  });

  const filteredTransactions = transactions.filter(t => {
    const transactionProfile = t.profile || 'PF';
    return profileFilter === 'ALL' || transactionProfile === profileFilter;
  });

  const filteredBills = bills.filter(b => {
    const billProfile = b.profile || 'PF';
    return profileFilter === 'ALL' || billProfile === profileFilter;
  });

  const filteredMiles = milesEntries.filter(m => activeProfileId === 'ALL' || m.profileId === activeProfileId);

  const handleSaveTransaction = (transactionData) => {
    if (transactionData.isTransfer) {
      const outbound = {
        ...transactionData,
        id: crypto.randomUUID(),
        type: 'expense',
        description: `[SAIDA] ${transactionData.description}`,
        accountId: transactionData.accountId,
        isTransfer: true,
        transferPartnerId: transactionData.destinationAccountId
      };

      const inbound = {
        ...transactionData,
        id: crypto.randomUUID(),
        type: 'income',
        description: `[ENTRADA] ${transactionData.description}`,
        accountId: transactionData.destinationAccountId,
        isTransfer: true,
        transferPartnerId: transactionData.accountId
      };

      setTransactions([outbound, inbound, ...transactions]);
    } else if (transactionData.id) {
      setTransactions(transactions.map(t => t.id === transactionData.id ? transactionData : t));
    } else {
      setTransactions([{ ...transactionData, id: crypto.randomUUID() }, ...transactions]);
    }
    setEditingTransaction(null);
  };

  const handlePayBill = (bill, accountId) => {
    const selectedAccount = accounts.find(a => a.id === accountId);
    const paymentDate = new Date().toISOString().split('T')[0];

    const paymentTransaction = {
      id: crypto.randomUUID(),
      description: `PAGTO: ${bill.name}`,
      amount: bill.value,
      type: 'expense',
      date: paymentDate,
      category: 'Contas / Boletos',
      accountId: accountId,
      profile: bill.profile || 'PF',
    };

    setTransactions([paymentTransaction, ...transactions]);

    setBills(bills.map(b =>
      b.id === bill.id
        ? { ...b, paid: true, paidDate: paymentDate, paidAccount: selectedAccount.name }
        : b
    ));

    alert(`Sucesso! Pagamento de ${bill.name} registrado.`);
  };

  const addAccount = (accountData) => {
    setAccounts([...accounts, { ...accountData, id: crypto.randomUUID() }]);
  };

  const handleSaveBill = (billData) => {
    const exists = bills.find(b => b.id === billData.id);
    if (exists) {
      setBills(bills.map(b => b.id === billData.id ? billData : b));
    } else {
      setBills([...bills, { ...billData, id: billData.id || crypto.randomUUID() }]);
    }
  };

  const handleAddMilesEntry = (entry) => {
    setMilesEntries([...milesEntries, { ...entry, profileId: activeProfileId === 'ALL' ? 'default' : activeProfileId }]);
  };

  const handleExportData = () => {
    const data = { transactions, accounts, bills, milesEntries, profiles, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transactions && data.accounts) {
          if (confirm('Isso substituira todos os dados locais. Continuar?')) {
            setTransactions(data.transactions);
            setAccounts(data.accounts);
            if (data.profiles) setProfiles(data.profiles);
            if (data.bills) setBills(data.bills);
            if (data.milesEntries) setMilesEntries(data.milesEntries);
          }
        }
      } catch (err) { alert('Erro na importacao.'); }
    };
    reader.readAsText(file);
  };

  if (isAuthChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <div className="animate-pulse">Autenticando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
          <div>
            <h1>Minhas Financas</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
              <CalendarIcon size={14} />
              <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{formattedToday}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => supabase.auth.signOut()} className={styles.logoutBtn} title="Sair do App">
              <LogOut size={20} />
            </button>
            <button onClick={handleExportData} className={styles.actionBtnHeader} title="Exportar Backup"><Download size={20} /></button>
            <label className={styles.actionBtnHeader} title="Importar Backup" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} /><input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className={styles.filterContainer}>
          {['ALL', 'PF', 'PJ'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${profileFilter === f ? styles.activeFilter : ''}`}
              onClick={() => setProfileFilter(f)}
            >
              {f === 'ALL' ? 'Geral' : f}
            </button>
          ))}
        </div>
      </header>

      <BankSummary
        accounts={filteredAccounts}
        transactions={transactions}
        onAddAccount={addAccount}
        onDeleteAccount={(id) => setAccounts(accounts.filter(a => a.id !== id))}
        onEditAccount={(updated) => setAccounts(accounts.map(a => a.id === updated.id ? updated : a))}
      />

      <BillManager
        bills={filteredBills}
        onSaveBill={handleSaveBill}
        onDeleteBill={(id) => setBills(bills.filter(b => b.id !== id))}
        onPayBill={handlePayBill}
        accounts={accounts}
      />

      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'white' }}>Milhas da Familia</h3>
        </div>

        <div className={styles.profileToolbar}>
          <div className={styles.profileList}>
            <div
              className={`${styles.profileItem} ${activeProfileId === 'ALL' ? styles.activeProfileItem : ''}`}
              onClick={() => setActiveProfileId('ALL')}
            >
              <div className={styles.profileAvatar}><Users size={24} /></div>
              <span className={styles.profileName}>Todos</span>
            </div>
            {profiles.map(p => (
              <div
                key={p.id}
                className={`${styles.profileItem} ${activeProfileId === p.id ? styles.activeProfileItem : ''}`}
                onClick={() => setActiveProfileId(p.id)}
                onContextMenu={(e) => { e.preventDefault(); deleteProfile(p.id); }}
                title="Botao direito para excluir"
              >
                <div className={styles.profileAvatar}><User size={24} /></div>
                <span className={styles.profileName}>{p.name}</span>
              </div>
            ))}
            <button className={styles.addProfileBtn} onClick={() => setIsProfileModalOpen(true)}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        <MilesManager
          milesEntries={filteredMiles}
          onAddEntry={handleAddMilesEntry}
          onDeleteEntry={(id) => setMilesEntries(milesEntries.filter(m => m.id !== id))}
          onEditEntry={(updated) => setMilesEntries(milesEntries.map(m => m.id === updated.id ? updated : m))}
        />
      </div>

      <Dashboard transactions={filteredTransactions} accounts={filteredAccounts} allTransactions={transactions} />

      <TransactionList
        transactions={filteredTransactions}
        onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))}
        onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
      />

      <button className={styles.fab} onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} aria-label="Adicionar Transacao">
        <Plus size={32} />
      </button>

      {isModalOpen && (
        <TransactionForm
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          accounts={filteredAccounts}
        />
      )}

      {isProfileModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modalContent} animate-fade-in`}>
            <h3>Adicionar Membro da Familia</h3>
            <form onSubmit={addProfile}>
              <div className={styles.formGroup}>
                <label>Nome do Familiar</label>
                <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="Ex: Maria" required autoFocus />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
