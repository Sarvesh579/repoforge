import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import SpecularButton from '../../components/ui/SpecularButton';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { login as loginUser } from '../../lib/api';
import { loginSchema } from '../../lib/validators';
import styles from './Login.module.css';

// Squircle SpecularButton wrapper for consistent styling
const SqBtn = ({ children, onClick, type = 'button', lineColor = '#FAB600', baseColor = '#261005', textColor = '#ffffff', intensity = 1, fullWidth = false, danger = false }) => (
  <SpecularButton
    size="md"
    radius={16}
    lineColor={danger ? '#ff6b75' : lineColor}
    baseColor={danger ? '#2a1215' : baseColor}
    textColor={danger ? '#ff6b75' : textColor}
    intensity={intensity}
    speed={0.35}
    onClick={onClick}
    type={type}
    className={fullWidth ? styles.fullWidthBtn : ''}
  >
    {children}
  </SpecularButton>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await loginUser(values.email, values.password);
      const auth = {
        token: response.data.token,
        role: response.data.role,
        teamId: response.data.teamId || response.data.user?.id || response.data.user?.teamId,
        user: response.data.user,
      };
      login(auth);
      const dashPath = ['admin', 'judge'].includes(response.data.role) ? 'admin' : 'user';
      navigate(`/dashboard/${dashPath}`);
    } catch (error) {
      form.setError('root', { message: error.message || 'Login failed.' });
    }
  });

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.shell}>
        {/* Back to home button */}
        <div className={styles.backRow}>
          <SqBtn onClick={() => navigate('/')} lineColor="#FAB600" baseColor="#261005" textColor="#ffffff">
            ← Back
          </SqBtn>
        </div>

        <motion.div className={styles.loginCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1>Welcome back.</h1>
          <form onSubmit={onSubmit} className={styles.form}>
            <label>
              Email
              <input type="email" placeholder="example@gmail.com" {...form.register('email')} />
              {form.formState.errors.email && <small>{form.formState.errors.email.message}</small>}
            </label>

            <label>
              Password
              <input type="password" {...form.register('password')} />
              {form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}
            </label>

            {form.formState.errors.root && <div className={styles.error}>{form.formState.errors.root.message}</div>}

            <div className={styles.helperRow}>
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/register">Create account</Link>
            </div>

            <SqBtn type="submit" fullWidth intensity={1.2}>Login</SqBtn>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
