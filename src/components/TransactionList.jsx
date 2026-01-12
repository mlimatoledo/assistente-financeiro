import { ArrowUpCircle, ArrowDownCircle, Trash2, Calendar, Pencil, ArrowRightLeft } from 'lucide-react';
import styles from './TransactionList.module.css';

const TransactionList = ({ transactions, onDelete, onEdit }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    if (transactions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>Nenhuma transação recente.</p>
            </div>
        );
    }

    return (
        <div className={`glass-panel ${styles.container}`}>
            <h3 className={styles.title}>Últimas Transações</h3>
            <div className={styles.list}>
                {transactions.map((t) => (
                    <div key={t.id} className={styles.item}>
                        <div className={styles.iconWrapper}>
                            {t.isTransfer ? (
                                <ArrowRightLeft className="text-blue-500" size={24} color="#3b82f6" />
                            ) : t.type === 'income' ? (
                                <ArrowUpCircle className="text-emerald-500" size={24} color="#10b981" />
                            ) : (
                                <ArrowDownCircle className="text-red-500" size={24} color="#ef4444" />
                            )}
                        </div>

                        <div className={styles.details}>
                            <span className={styles.description}>{t.description}</span>
                            <div className={styles.meta}>
                                <span className={styles.category}>{t.category}</span>
                                <span className={styles.date}>
                                    <Calendar size={12} style={{ marginRight: 4 }} />
                                    {formatDate(t.date)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.amountWrapper}>
                            <span className={`${styles.amount} ${t.type === 'income' ? styles.income : styles.expense}`}>
                                {t.type === 'expense' ? '- ' : '+ '}
                                {formatCurrency(t.amount)}
                            </span>
                            <button
                                onClick={() => onEdit(t)}
                                className={styles.actionBtn}
                                title="Editar"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(t.id)}
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                title="Excluir"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionList;
