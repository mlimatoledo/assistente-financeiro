import React, { useState, useMemo } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Pencil,
    ExternalLink,
    Bell,
    CheckCircle2,
    Paperclip,
    Download,
    X
} from 'lucide-react';
import styles from './BillManager.module.css';

const BillManager = ({ bills, onSaveBill, onDeleteBill, onPayBill, accounts }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [selectedBillForPay, setSelectedBillForPay] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [previewFile, setPreviewFile] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        dueDate: '',
        currency: 'BRL',
        profile: 'PF',
        attachment: null
    });

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' }).format(currentDate);
    const [showHistory, setShowHistory] = useState(false);

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const [year, month] = bill.dueDate.split('-').map(Number);
            return year === currentYear && (month - 1) === currentMonth;
        }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }, [bills, currentMonth, currentYear]);

    // Separate pending and paid bills
    const pendingBills = filteredBills.filter(b => !b.paid);
    const paidBills = filteredBills.filter(b => b.paid);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const openAddModal = () => {
        setEditingBill(null);
        setFormData({
            name: '',
            value: '',
            dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
            currency: 'BRL',
            profile: 'PF',
            attachment: null
        });
        setIsModalOpen(true);
    };

    const openEditModal = (bill) => {
        setEditingBill(bill);
        setFormData({
            name: bill.name,
            value: bill.value,
            dueDate: bill.dueDate,
            currency: bill.currency || 'BRL',
            profile: bill.profile || 'PF',
            attachment: bill.attachment || null
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande! O tamanho máximo é 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setFormData({
                ...formData,
                attachment: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result
                }
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSaveBill({
            ...formData,
            id: editingBill?.id || crypto.randomUUID(),
            value: parseFloat(formData.value)
        });
        setIsModalOpen(false);
    };

    const formatCurrency = (val, currency = 'BRL') => {
        return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
            style: 'currency',
            currency: currency
        }).format(val);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const downloadAttachment = (attachment) => {
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openPreview = (attachment) => {
        setPreviewFile(attachment);
        setIsPreviewModalOpen(true);
    };

    const getGoogleCalendarUrl = (bill) => {
        const [year, month, day] = bill.dueDate.split('-');
        const dateStr = `${year}${month}${day}`;
        const nextDay = new Date(year, month - 1, parseInt(day) + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');

        const text = encodeURIComponent(`Vencimento: ${bill.name}`);
        const details = encodeURIComponent(`Valor: ${formatCurrency(bill.value, bill.currency || 'BRL')}`);

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStr}/${nextDayStr}&details=${details}&sf=true&output=xml`;
    };

    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

    const openPayModal = (bill) => {
        setSelectedBillForPay(bill);
        const currencyMatch = accounts.find(a => (a.currency || 'BRL') === (bill.currency || 'BRL'));
        setSelectedAccountId(currencyMatch?.id || accounts[0]?.id || '');
        setIsPayModalOpen(true);
    };

    const handleConfirmPay = () => {
        if (!selectedAccountId) return alert('Selecione uma conta para o pagamento.');
        onPayBill(selectedBillForPay, selectedAccountId);
        setIsPayModalOpen(false);
        setSelectedBillForPay(null);
    };

    return (
        <div className={`glass-panel ${styles.container}`}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Bell size={24} color="var(--accent-primary)" />
                    <h3>Boletos e Vencimentos</h3>
                </div>

                <div className={styles.monthSelector}>
                    <button onClick={handlePrevMonth} className={styles.selectorBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.monthDisplay}>
                        {monthName} {currentYear}
                    </span>
                    <button onClick={handleNextMonth} className={styles.selectorBtn}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${!showHistory ? styles.activeView : ''}`}
                        onClick={() => setShowHistory(false)}
                    >
                        Pendentes ({pendingBills.length})
                    </button>
                    <button
                        className={`${styles.viewBtn} ${showHistory ? styles.activeView : ''}`}
                        onClick={() => setShowHistory(true)}
                    >
                        Histórico ({paidBills.length})
                    </button>
                </div>

                <button onClick={openAddModal} className={styles.addBtn}>
                    <Plus size={18} />
                    Novo Boleto
                </button>
            </div>

            <div className={styles.billList}>
                {(showHistory ? paidBills : pendingBills).length === 0 ? (
                    <div className={styles.emptyState}>
                        <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <p>{showHistory ? 'Nenhum boleto pago este mês.' : 'Nenhum boleto pendente para este mês.'}</p>
                    </div>
                ) : (
                    (showHistory ? paidBills : pendingBills).map(bill => {
                        const isOverdue = bill.dueDate < todayStr;
                        const isToday = bill.dueDate === todayStr;
                        const [y, m, d] = bill.dueDate.split('-');

                        return (
                            <div key={bill.id} className={`${styles.billItem} ${isOverdue ? styles.overdue : ''}`}>
                                <div className={styles.dueDate}>
                                    <span className={styles.day}>{d}</span>
                                    <span className={styles.month}>{new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(y, m - 1, d))}</span>
                                </div>

                                <div className={styles.billInfo}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={styles.billName}>{bill.name}</span>
                                        {bill.currency === 'USD' && <span className={styles.usdBadge}>USD</span>}
                                        {bill.attachment && (
                                            <Paperclip
                                                size={16}
                                                style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
                                                onClick={() => openPreview(bill.attachment)}
                                                title="Ver anexo"
                                            />
                                        )}
                                    </div>
                                    <span className={styles.billValue}>
                                        {formatCurrency(bill.value, bill.currency || 'BRL')}
                                        {bill.paid && bill.paidDate && (
                                            <span style={{ color: 'var(--success)', marginLeft: '8px', fontSize: '0.8rem' }}>
                                                • Pago em {new Date(bill.paidDate).toLocaleDateString('pt-BR')}
                                                {bill.paidAccount && ` via ${bill.paidAccount}`}
                                            </span>
                                        )}
                                        {!bill.paid && isToday && <span style={{ color: 'var(--success)', marginLeft: '8px', fontSize: '0.8rem' }}>• Vence hoje</span>}
                                        {!bill.paid && isOverdue && <span style={{ color: 'var(--danger)', marginLeft: '8px', fontSize: '0.8rem' }}>• Atrasada</span>}
                                    </span>
                                </div>

                                <div className={styles.actions}>
                                    {!bill.paid && (
                                        <button
                                            onClick={() => openPayModal(bill)}
                                            className={`${styles.actionBtn} ${styles.payBtn}`}
                                            title="Marcar como Pago"
                                        >
                                            <CheckCircle2 size={18} />
                                            <span>Pagar</span>
                                        </button>
                                    )}
                                    <a
                                        href={getGoogleCalendarUrl(bill)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${styles.actionBtn} ${styles.calendarBtn}`}
                                        title="Adicionar ao Google Agenda"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                    {!bill.paid && (
                                        <button onClick={() => openEditModal(bill)} className={styles.actionBtn} title="Editar">
                                            <Pencil size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => onDeleteBill(bill.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Excluir">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel ${styles.modalContent} animate-fade-in`}>
                        <h3>{editingBill ? 'Editar Boleto' : 'Novo Boleto'}</h3>
                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup}>
                                <label>Nome da Conta</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Aluguel, Internet..."
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Perfil</label>
                                <div className={styles.currencyToggle}>
                                    <button
                                        type="button"
                                        className={formData.profile === 'PF' ? styles.activeCurrency : ''}
                                        onClick={() => setFormData({ ...formData, profile: 'PF' })}
                                    >
                                        PF
                                    </button>
                                    <button
                                        type="button"
                                        className={formData.profile === 'PJ' ? styles.activeCurrency : ''}
                                        onClick={() => setFormData({ ...formData, profile: 'PJ' })}
                                    >
                                        PJ
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Moeda</label>
                                <div className={styles.currencyToggle}>
                                    <button
                                        type="button"
                                        className={formData.currency === 'BRL' ? styles.activeCurrency : ''}
                                        onClick={() => setFormData({ ...formData, currency: 'BRL' })}
                                    >
                                        Real (R$)
                                    </button>
                                    <button
                                        type="button"
                                        className={formData.currency === 'USD' ? styles.activeCurrency : ''}
                                        onClick={() => setFormData({ ...formData, currency: 'USD' })}
                                    >
                                        Dólar (USD)
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Valor ({formData.currency === 'USD' ? '$' : 'R$'})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Anexar Boleto (PDF, Imagem - Máx. 5MB)</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    className={styles.fileInput}
                                />
                                {formData.attachment && (
                                    <div className={styles.attachmentPreview}>
                                        <Paperclip size={16} />
                                        <span>{formData.attachment.name}</span>
                                        <span className={styles.fileSize}>({formatFileSize(formData.attachment.size)})</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, attachment: null })}
                                            className={styles.removeAttachment}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPayModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel ${styles.modalContent} animate-fade-in`}>
                        <h3>Confirmar Pagamento</h3>
                        <div style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>
                            Você está pagando <strong>{selectedBillForPay?.name}</strong> no valor de <strong>{formatCurrency(selectedBillForPay?.value, selectedBillForPay?.currency || 'BRL')}</strong>.
                        </div>

                        <div className={styles.formGroup}>
                            <label>Escolha a Conta para Pagamento</label>
                            <select
                                value={selectedAccountId}
                                onChange={e => setSelectedAccountId(e.target.value)}
                                className={styles.selectInput}
                            >
                                <option value="" disabled>Selecione uma conta</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency || 'BRL'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setIsPayModalOpen(false)} className={styles.cancelBtn}>
                                Cancelar
                            </button>
                            <button type="button" onClick={handleConfirmPay} className={styles.saveBtn}>
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {isPreviewModalOpen && previewFile && (
                <div className={styles.modalOverlay} onClick={() => setIsPreviewModalOpen(false)}>
                    <div className={`glass-panel ${styles.previewModal}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.previewHeader}>
                            <h3>{previewFile.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => downloadAttachment(previewFile)}
                                    className={styles.actionBtn}
                                    title="Baixar"
                                >
                                    <Download size={20} />
                                </button>
                                <button
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className={styles.actionBtn}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.previewContent}>
                            {previewFile.type.startsWith('image/') ? (
                                <img src={previewFile.data} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                            ) : previewFile.type === 'application/pdf' ? (
                                <iframe src={previewFile.data} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF Preview" />
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <p>Pré-visualização não disponível para este tipo de arquivo.</p>
                                    <button onClick={() => downloadAttachment(previewFile)} className={styles.saveBtn} style={{ marginTop: '1rem' }}>
                                        <Download size={18} style={{ marginRight: '0.5rem' }} />
                                        Baixar Arquivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillManager;
