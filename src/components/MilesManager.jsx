import React, { useState } from 'react';
import { Plane, Plus, Trash2, TrendingUp, DollarSign, Tag, Pencil } from 'lucide-react';
import styles from './MilesManager.module.css';

const MilesManager = ({ milesEntries, onAddEntry, onDeleteEntry, onEditEntry }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [formData, setFormData] = useState({
        airline: '',
        quantity: '',
        totalCost: '',
        date: new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
    });

    const airlines = [
        'Latam Pass',
        'Smiles (Gol)',
        'TudoAzul (Azul)',
        'Livelo',
        'Esfera',
        'Átomos (C6 Bank)',
        'TAP Miles&Go',
        'Iberia Plus',
        'Outros'
    ];

    // Grouping logic for summary cards
    const summary = milesEntries.reduce((acc, entry) => {
        if (!acc[entry.airline]) {
            acc[entry.airline] = { quantity: 0, totalCost: 0 };
        }
        acc[entry.airline].quantity += parseFloat(entry.quantity);
        acc[entry.airline].totalCost += parseFloat(entry.totalCost);
        return acc;
    }, {});

    // Calculate grand totals
    const grandTotal = Object.values(summary).reduce((acc, data) => ({
        quantity: acc.quantity + data.quantity,
        totalCost: acc.totalCost + data.totalCost
    }), { quantity: 0, totalCost: 0 });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatNumber = (val) => {
        return new Intl.NumberFormat('pt-BR').format(val);
    };

    const openAddModal = () => {
        setEditingEntry(null);
        setFormData({
            airline: '',
            quantity: '',
            totalCost: '',
            date: new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
        });
        setIsModalOpen(true);
    };

    const openEditModal = (entry) => {
        setEditingEntry(entry);
        setFormData({
            airline: entry.airline,
            quantity: entry.quantity.toString(),
            totalCost: entry.totalCost.toString(),
            date: entry.date
        });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const entryData = {
            ...formData,
            quantity: parseFloat(formData.quantity),
            totalCost: parseFloat(formData.totalCost)
        };

        if (editingEntry) {
            onEditEntry({ ...entryData, id: editingEntry.id, profileId: editingEntry.profileId });
        } else {
            onAddEntry({ ...entryData, id: crypto.randomUUID() });
        }

        setFormData({
            airline: '',
            quantity: '',
            totalCost: '',
            date: new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
        });
        setEditingEntry(null);
        setIsModalOpen(false);
    };

    return (
        <div className={`glass-panel ${styles.container}`}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Plane size={24} color="#f59e0b" />
                    <h3>Pontos e Milhas</h3>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    <Plus size={18} />
                    Lançar Entrada
                </button>
            </div>

            <div className={styles.summaryGrid}>
                {Object.keys(summary).length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Nenhum dado de milhas registrado ainda.</p>
                    </div>
                ) : (
                    <>
                        {/* Grand Total Card */}
                        <div className={`${styles.airlineCard} ${styles.totalCard}`}>
                            <div className={styles.cardHeader}>
                                <span className={styles.airlineName}>Total Geral</span>
                                <TrendingUp size={20} color="var(--accent-primary)" />
                            </div>
                            <div className={styles.statsRow}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Total de Pontos/Milhas</span>
                                    <span className={`${styles.statValue} ${styles.totalValue}`}>{formatNumber(grandTotal.quantity)} pts</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Investimento Total</span>
                                    <span className={`${styles.statValue} ${styles.totalValue}`}>{formatCurrency(grandTotal.totalCost)}</span>
                                </div>
                                <div className={styles.statItem} style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                    <span className={styles.statLabel}>CPP Médio Geral</span>
                                    <span className={styles.milheiroValue}>
                                        {grandTotal.quantity > 0 ? formatCurrency(grandTotal.totalCost / (grandTotal.quantity / 1000)) : 'R$ 0,00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Individual Airline Cards */}
                        {Object.entries(summary).map(([airline, data]) => {
                            const avgMilheiro = data.quantity > 0 ? (data.totalCost / (data.quantity / 1000)) : 0;
                            return (
                                <div key={airline} className={styles.airlineCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.airlineName}>{airline}</span>
                                        <Tag size={18} color="var(--text-secondary)" />
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Total Acumulado</span>
                                            <span className={styles.statValue}>{formatNumber(data.quantity)} pts</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Investimento Total</span>
                                            <span className={styles.statValue}>{formatCurrency(data.totalCost)}</span>
                                        </div>
                                        <div className={styles.statItem} style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                            <span className={styles.statLabel}>CPP Médio (Milheiro)</span>
                                            <span className={styles.milheiroValue}>{formatCurrency(avgMilheiro)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {milesEntries.length > 0 && (
                <div className={styles.entryList}>
                    <div className={styles.entryHeader}>
                        <span>Data</span>
                        <span>Programa</span>
                        <span>Quantidade</span>
                        <span>Custo</span>
                        <span></span>
                    </div>
                    {milesEntries.slice().reverse().map(entry => (
                        <div key={entry.id} className={styles.entryItem}>
                            <span>{entry.date.split('-').reverse().join('/')}</span>
                            <span style={{ fontWeight: 500 }}>{entry.airline}</span>
                            <span>{formatNumber(entry.quantity)} pts</span>
                            <span>{formatCurrency(entry.totalCost)}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => openEditModal(entry)}
                                    title="Editar Entrada"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => onDeleteEntry(entry.id)}
                                    title="Excluir Entrada"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Lançamento */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel ${styles.modalContent} animate-fade-in`}>
                        <h3>{editingEntry ? 'Editar Entrada de Milhas' : 'Nova Entrada de Milhas'}</h3>
                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup}>
                                <label>Companhia / Programa</label>
                                <select
                                    value={formData.airline}
                                    onChange={e => setFormData({ ...formData, airline: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Quantidade de Pontos/Milhas</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="Ex: 10000"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Custo Total (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.totalCost}
                                    onChange={e => setFormData({ ...formData, totalCost: e.target.value })}
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditingEntry(null); }} className={styles.cancelBtn}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    {editingEntry ? 'Salvar' : 'Lançar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MilesManager;
