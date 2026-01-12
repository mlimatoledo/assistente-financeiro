import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, User, Briefcase, ArrowRightLeft } from 'lucide-react';
import styles from './TransactionForm.module.css';

const TransactionForm = ({ onClose, onSave, initialData, accounts }) => {
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [type, setType] = useState(initialData?.type || 'expense');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(initialData?.category || '');
    const [accountId, setAccountId] = useState(initialData?.accountId || (accounts?.[0]?.id || ''));
    const [destinationAccountId, setDestinationAccountId] = useState('');
    const [profile, setProfile] = useState(initialData?.profile || 'PF'); // 'PF' or 'PJ'

    useEffect(() => {
        if (type === 'transfer' && !description) {
            setDescription('Transferência entre contas');
            setCategory('Transferência');
        }
    }, [type]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description || !amount) return;
        if (type === 'transfer' && (!accountId || !destinationAccountId)) {
            alert('Selecione as contas de origem e destino.');
            return;
        }
        if (type === 'transfer' && accountId === destinationAccountId) {
            alert('A conta de origem e destino não podem ser as mesmas.');
            return;
        }

        onSave({
            id: initialData?.id,
            description,
            amount: parseFloat(amount),
            type,
            date,
            category,
            accountId,
            destinationAccountId: type === 'transfer' ? destinationAccountId : null,
            profile,
            isTransfer: type === 'transfer'
        });
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} glass-panel`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {initialData ? 'Editar Transação' : 'Nova Transação'}
                    </h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.typeToggle}>
                        <button
                            type="button"
                            className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
                            onClick={() => setType('income')}
                        >
                            <Plus size={16} style={{ marginRight: 8 }} />
                            Receita
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeBtn} ${type === 'expense' ? styles.activeExpense : ''}`}
                            onClick={() => setType('expense')}
                        >
                            <Minus size={16} style={{ marginRight: 8 }} />
                            Despesa
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeBtn} ${type === 'transfer' ? styles.activeTransfer : ''}`}
                            onClick={() => setType('transfer')}
                        >
                            <ArrowRightLeft size={16} style={{ marginRight: 8 }} />
                            Transf.
                        </button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Perfil</label>
                        <div className={styles.typeToggle} style={{ marginBottom: 0 }}>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${profile === 'PF' ? styles.activeProfile : ''}`}
                                onClick={() => setProfile('PF')}
                                style={{ justifyContent: 'center' }}
                            >
                                <User size={16} style={{ marginRight: 8 }} />
                                PF
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeBtn} ${profile === 'PJ' ? styles.activeProfile : ''}`}
                                onClick={() => setProfile('PJ')}
                                style={{ justifyContent: 'center' }}
                            >
                                <Briefcase size={16} style={{ marginRight: 8 }} />
                                PJ
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: type === 'transfer' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                        <div className={styles.inputGroup}>
                            <label>{type === 'transfer' ? 'Conta de Origem' : 'Conta / Banco'}</label>
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                required
                                style={{ backgroundColor: 'var(--bg-primary)', color: 'white', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            >
                                <option value="" disabled>Selecione</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {type === 'transfer' && (
                            <div className={styles.inputGroup}>
                                <label>Conta de Destino</label>
                                <select
                                    value={destinationAccountId}
                                    onChange={e => setDestinationAccountId(e.target.value)}
                                    required
                                    style={{ backgroundColor: 'var(--bg-primary)', color: 'white', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                >
                                    <option value="" disabled>Selecione</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Descrição</label>
                        <input
                            type="text"
                            placeholder="Ex: Supermercado"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Valor (R$)</label>
                        <input
                            type="number"
                            placeholder="0,00"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Categoria</label>
                        <input
                            type="text"
                            placeholder="Ex: Alimentação"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        Salvar {type === 'transfer' ? 'Transferência' : 'Transação'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;
