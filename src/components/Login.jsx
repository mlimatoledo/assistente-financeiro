import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulação de login - aqui depois conectaremos ao Supabase/Firebase
        setTimeout(() => {
            if (email === 'admin@admin.com' && password === 'admin') {
                onLogin();
            } else {
                alert('Credenciais inválidas! Tente admin@admin.com / admin');
            }
            setLoading(false);
        }, 800);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={`glass-panel ${styles.loginCard}`}>
                <div className={styles.header}>
                    <div className={styles.logoIcon}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2>Bem-vindo</h2>
                    <p>Acesse seu Assistente Financeiro</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label>E-mail</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Senha</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? 'Entrando...' : (
                            <>
                                Entrar no App
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Proteção de dados biométrica e criptografia de ponta.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
