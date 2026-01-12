import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro ao fazer login: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`${styles.glassPanel} ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={32} />
          </div>
          <h2>Bem-vindo</h2>
          <p>Acesse seu Assistente Financeiro</p>
        </div>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.icon} />
              <input
                type="email"
                id="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.icon} />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? 'Entrando...' : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
