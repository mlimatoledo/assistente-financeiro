import React, { useState } from 'react';
import { Landmark, Plus, Trash2, Pencil, User, Briefcase, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import styles from './BankSummary.module.css';

const BankSummary = ({ accounts, transactions, onAddAccount, onDeleteAccount, onEditAccount, activeProfileName }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newBankName, setNewBankName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [newProfile, setNewProfile] = useState('PF');
    const [newCurrency, setNewCurrency] = useState('BRL');
    const [newType, setNewType] = useState('checking'); // 'checking' | 'investment'

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editBalance, setEditBalance] = useState('');
    const [editProfile, setEditProfile] = useState('PF');
    const [editCurrency, setEditCurrency] = useState('BRL');
    const [editType, setEditType] = useState('checking');

    const formatCurrency = (val, currency) => {
        return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(val);
    };

    const calculateBankBalance = (account) => {
        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const totalTransactions = accountTransactions.reduce((acc, t) => {
            return acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
        }, 0);
        return Number(account.initialBalance) + totalTransactions;
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newBankName) return;

        onAddAccount({
            name: newBankName,
            initialBalance: Number(initialBalance) || 0,
            profile: newProfile,
            currency: newCurrency,
            type: newType
        });

        setNewBankName('');
        setInitialBalance('');
        setNewProfile('PF');
        setNewCurrency('BRL');
        setNewType('checking');
        setIsAdding(false);
    };

    const startEditing = (acc) => {
        setEditingId(acc.id);
        setEditName(acc.name);
        setEditBalance(acc.initialBalance);
        setEditProfile(acc.profile || 'PF');
        setEditCurrency(acc.currency || 'BRL');
        setEditType(acc.type || 'checking');
    };

    const handleEdit = (e) => {
        e.preventDefault();
        if (!editName) return;

        onEditAccount({
            ...accounts.find(a => a.id === editingId),
            name: editName,
            initialBalance: Number(editBalance) || 0,
            profile: editProfile,
            currency: editCurrency,
            type: editType
        });

        setEditingId(null);
        setEditName('');
        setEditBalance('');
        setEditProfile('PF');
        setEditCurrency('BRL');
        setEditType('checking');
    };

    const renderTypeToggle = (currentType, setType) => (
        <>
            <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }}></div>
            <button type="button" onClick={() => setType('checking')} className={currentType === 'checking' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Conta Corrente"><Wallet size={16} /></button>
            <button type="button" onClick={() => setType('investment')} className={currentType === 'investment' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Investimento"><TrendingUp size={16} /></button>
        </>
    );

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                Contas: {activeProfileName || 'Geral'}
            </h3>

            <div className={styles.bankGrid}>
                {accounts.map(acc => {
                    if (editingId === acc.id) {
                        return (
                            <form key={acc.id} onSubmit={handleEdit} className={styles.bankCard} style={{ justifyContent: 'center' }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => setEditProfile('PF')} className={editProfile === 'PF' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Pessoa Física"><User size={16} /></button>
                                    <button type="button" onClick={() => setEditProfile('PJ')} className={editProfile === 'PJ' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Pessoa Jurídica"><Briefcase size={16} /></button>
                                    <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }}></div>
                                    <button type="button" onClick={() => setEditCurrency('BRL')} className={editCurrency === 'BRL' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Real (BRL)">R$</button>
                                    <button type="button" onClick={() => setEditCurrency('USD')} className={editCurrency === 'USD' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Dólar (USD)"><DollarSign size={16} /></button>
                                    {renderTypeToggle(editType, setEditType)}
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Nome do Banco"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className={styles.inputField}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Saldo Inicial"
                                    value={editBalance}
                                    onChange={e => setEditBalance(e.target.value)}
                                    className={styles.inputField}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className={styles.confirmBtn}>Salvar</button>
                                    <button type="button" onClick={() => setEditingId(null)} className={styles.cancelBtn}>Cancelar</button>
                                </div>
                            </form>
                        );
                    }

                    return (
                        <div key={acc.id} className={styles.bankCard}>
                            <div className={styles.bankHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span title={acc.profile === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}>
                                        {acc.profile === 'PJ' ? <Briefcase size={16} className="text-secondary" /> : <User size={16} className="text-secondary" />}
                                    </span>
                                    <span title={acc.type === 'investment' ? 'Investimento' : 'Conta Corrente'}>
                                        {acc.type === 'investment' ? <TrendingUp size={16} className="text-secondary" /> : <Landmark size={16} className="text-secondary" />}
                                    </span>
                                    <h4 className={styles.bankName}>{acc.name}</h4>
                                    {acc.currency === 'USD' && <span style={{ fontSize: '0.7em', background: '#3b82f6', padding: '2px 6px', borderRadius: 4, color: 'white' }}>USD</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {onEditAccount && (
                                        <button onClick={() => startEditing(acc)} className={styles.iconBtn} title="Editar conta">
                                            <Pencil size={14} />
                                        </button>
                                    )}
                                    {onDeleteAccount && (
                                        <button onClick={() => onDeleteAccount(acc.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Remover conta">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className={styles.bankBalance}>{formatCurrency(calculateBankBalance(acc), acc.currency)}</p>
                            {acc.type === 'investment' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: 4 }}>Investimento</span>}
                        </div>
                    );
                })}

                {isAdding ? (
                    <form onSubmit={handleAdd} className={styles.bankCard} style={{ justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setNewProfile('PF')} className={newProfile === 'PF' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Pessoa Física"><User size={16} /></button>
                            <button type="button" onClick={() => setNewProfile('PJ')} className={newProfile === 'PJ' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Pessoa Jurídica"><Briefcase size={16} /></button>
                            <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }}></div>
                            <button type="button" onClick={() => setNewCurrency('BRL')} className={newCurrency === 'BRL' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Real (BRL)">R$</button>
                            <button type="button" onClick={() => setNewCurrency('USD')} className={newCurrency === 'USD' ? styles.activeProfileIcon : styles.inactiveProfileIcon} title="Dólar (USD)"><DollarSign size={16} /></button>
                            {renderTypeToggle(newType, setNewType)}
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nome do Banco"
                            value={newBankName}
                            onChange={e => setNewBankName(e.target.value)}
                            className={styles.inputField}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Saldo Inicial"
                            value={initialBalance}
                            onChange={e => setInitialBalance(e.target.value)}
                            className={styles.inputField}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className={styles.confirmBtn}>Adicionar</button>
                            <button type="button" onClick={() => setIsAdding(false)} className={styles.cancelBtn}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <button className={styles.addBankBtn} onClick={() => setIsAdding(true)}>
                        <Plus size={24} style={{ marginBottom: 8 }} />
                        <span>Adicionar Conta</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default BankSummary;
