import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, DollarSign, TrendingUp, Landmark } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = ({ transactions, accounts = [], allTransactions = [] }) => {
    // Helper to calculate totals for a specific currency and type breakdown
    const calculateTotals = (currency) => {
        // 1. Identify accounts of this currency
        const relevantAccounts = accounts.filter(a => (a.currency || 'BRL') === currency);
        const relevantAccountIds = new Set(relevantAccounts.map(a => a.id));

        // 2. Filter transactions linked to these accounts from ALL transactions
        // Use allTransactions to get the TRUE balance. 
        // If allTransactions is empty (first render?), fallback to transactions (which might be same)
        const sourceTransactions = allTransactions.length > 0 ? allTransactions : transactions;

        const relevantTransactions = sourceTransactions.filter(t => {
            if (!t.accountId) return false; // Ignore transactions without account for balance calc
            return relevantAccountIds.has(t.accountId);
        });

        // Current flows (Income/Expense) should ideally reflect the FILTERED view (transactions prop)?
        // Or if I select PF, I want to see PF Income/Expense.
        // But Balance should be REAL Balance.
        // Let's separate them.

        // Balance Calc (Using ALL transactions for these accounts)
        let checkingBalance = relevantAccounts
            .filter(a => (a.type || 'checking') === 'checking')
            .reduce((acc, curr) => acc + Number(curr.initialBalance || 0), 0);

        let investmentBalance = relevantAccounts
            .filter(a => a.type === 'investment')
            .reduce((acc, curr) => acc + Number(curr.initialBalance || 0), 0);

        relevantTransactions.forEach(t => {
            const account = accounts.find(a => a.id === t.accountId);
            const type = account?.type || 'checking';
            const amount = t.type === 'income' ? Number(t.amount) : -Number(t.amount);

            if (type === 'checking') checkingBalance += amount;
            else investmentBalance += amount;
        });

        const balance = checkingBalance + investmentBalance;

        // Flows Calc (Using FILTERED transactions prop - logic: what did I spend "as PF"?)
        // The previous logic used 'transactions' prop which is filtered.
        const filteredRelevantTransactions = transactions.filter(t => {
            if (!t.accountId) return currency === 'BRL';
            return relevantAccountIds.has(t.accountId);
        });

        const income = filteredRelevantTransactions
            .filter(t => t.type === 'income' && !t.isTransfer)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const expense = filteredRelevantTransactions
            .filter(t => t.type === 'expense' && !t.isTransfer)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        return {
            income,
            expense,
            balance,
            checkingBalance,
            investmentBalance,
            hasData: (relevantAccounts.length > 0 || filteredRelevantTransactions.length > 0)
        };
    };

    const brlTotals = calculateTotals('BRL');
    const usdTotals = calculateTotals('USD');

    const formatCurrency = (val, currency) => {
        return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(val);
    };

    const SummaryCards = ({ totals, currency }) => (
        <div className={styles.summarySection}>
            <h4 className={styles.currencyTitle}>{currency === 'BRL' ? 'Real (R$)' : 'Dólar (USD)'}</h4>

            <div className={styles.summaryGrid}>
                {/* Total Net Worth */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.cardContent}>
                        <span className={styles.label}>Patrimônio Total</span>
                        <h2 className={`${styles.value} ${styles.valueBalance}`}>{formatCurrency(totals.balance, currency)}</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {totals.checkingBalance !== 0 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Landmark size={12} /> Conta: {formatCurrency(totals.checkingBalance, currency)}
                            </span>
                        )}
                        {totals.investmentBalance !== 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <TrendingUp size={12} /> Inv.: {formatCurrency(totals.investmentBalance, currency)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Income */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.cardContent}>
                        <span className={styles.label}>Receitas</span>
                        <h2 className={`${styles.value} ${styles.valueIncome}`}>{formatCurrency(totals.income, currency)}</h2>
                    </div>
                    <ArrowUpCircle className={`${styles.icon} ${styles.iconIncome}`} />
                </div>

                {/* Expense */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.cardContent}>
                        <span className={styles.label}>Despesas</span>
                        <h2 className={`${styles.value} ${styles.valueExpense}`}>{formatCurrency(totals.expense, currency)}</h2>
                    </div>
                    <ArrowDownCircle className={`${styles.icon} ${styles.iconExpense}`} />
                </div>
            </div>
        </div>
    );

    const getCategoryData = (type) => {
        // Filter for BRL only for charts
        const brlAccountIds = new Set(accounts.filter(a => (a.currency || 'BRL') === 'BRL').map(a => a.id));
        const relevantTransactions = transactions.filter(t => !t.accountId || brlAccountIds.has(t.accountId));

        const grouped = relevantTransactions
            .filter(t => t.type === type && !t.isTransfer)
            .reduce((acc, t) => {
                const cat = t.category || 'Outros';
                acc[cat] = (acc[cat] || 0) + Number(t.amount);
                return acc;
            }, {});

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    };

    const incomeData = getCategoryData('income');
    const expenseData = getCategoryData('expense');

    const chartData = [
        { name: 'Entradas', value: brlTotals.income },
        { name: 'Saídas', value: brlTotals.expense },
    ].filter(d => d.value > 0);

    const COLORS = ['#10b981', '#ef4444'];
    const axisStyle = { fontSize: 12, fill: '#94a3b8' };

    return (
        <div className={styles.dashboardContainer}>
            {/* BRL Summary */}
            {(brlTotals.hasData || !usdTotals.hasData) && <SummaryCards totals={brlTotals} currency="BRL" />}

            {/* USD Summary */}
            {usdTotals.hasData && <SummaryCards totals={usdTotals} currency="USD" />}

            {/* Main Chart Section (BRL Focus) */}
            {brlTotals.hasData && (
                <>
                    <div className={styles.chartsGrid}>
                        <div className={`glass-panel ${styles.chartContainer}`}>
                            <h3 className={styles.chartTitle}>Entradas vs Saídas (R$)</h3>
                            {chartData.length > 0 ? (
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => formatCurrency(value, 'BRL')}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                                    <p>Nenhuma transação em R$ registrada.</p>
                                </div>
                            )}
                        </div>

                        {/* Asset Allocation Chart */}
                        {(brlTotals.checkingBalance > 0 || brlTotals.investmentBalance > 0) && (
                            <div className={`glass-panel ${styles.chartContainer}`}>
                                <h3 className={styles.chartTitle}>Alocação de Ativos (R$)</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Conta Corrente', value: brlTotals.checkingBalance },
                                                    { name: 'Investimento', value: brlTotals.investmentBalance }
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {[
                                                    { name: 'Conta Corrente', color: '#3b82f6' },
                                                    { name: 'Investimento', color: '#8b5cf6' }
                                                ].filter((_, i, arr) => {
                                                    // This filter logic is tricky because we filter data above. 
                                                    // Easier to map colors directly in Cell.
                                                    return true;
                                                }).map((entry, index) => {
                                                    // Simplified color logic
                                                    const dataArr = [
                                                        { name: 'Conta Corrente', value: brlTotals.checkingBalance, color: '#3b82f6' },
                                                        { name: 'Investimento', value: brlTotals.investmentBalance, color: '#8b5cf6' }
                                                    ].filter(d => d.value > 0);
                                                    return <Cell key={`cell-asset-${index}`} fill={dataArr[index].color} />;
                                                })}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => formatCurrency(value, 'BRL')}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {(incomeData.length > 0 || expenseData.length > 0) && (
                        <div className={styles.detailsGrid}>
                            <div className={`glass-panel ${styles.detailsCard}`}>
                                <h4 className={styles.detailsTitle}>Top Receitas (R$)</h4>
                                {incomeData.length > 0 ? (
                                    <div style={{ width: '100%', height: 250 }}>
                                        <ResponsiveContainer>
                                            <BarChart layout="vertical" data={incomeData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={80} tick={axisStyle} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                                    formatter={(value) => formatCurrency(value, 'BRL')}
                                                />
                                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <p className={styles.noData}>Sem dados</p>}
                            </div>

                            <div className={`glass-panel ${styles.detailsCard}`}>
                                <h4 className={styles.detailsTitle}>Maiores Despesas (R$)</h4>
                                {expenseData.length > 0 ? (
                                    <div style={{ width: '100%', height: 250 }}>
                                        <ResponsiveContainer>
                                            <BarChart layout="vertical" data={expenseData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={80} tick={axisStyle} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                                    formatter={(value) => formatCurrency(value, 'BRL')}
                                                />
                                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <p className={styles.noData}>Sem dados</p>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
