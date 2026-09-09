import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { getRegistrationStatus, getTracks, register as registerTeam } from '../../lib/api';
import { registerSchema } from '../../lib/validators';
import Navbar from '../../components/ui/Navbar';
import SpecularButton from '../../components/ui/SpecularButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import styles from './Register.module.css';

const steps = ['Team', 'Lead', 'Members', 'Review'];

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.2 } }),
};

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

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState({ open: true });
  const [submitted, setSubmitted] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [idsFile, setIdsFile] = useState(null);
  const [idsFileError, setIdsFileError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      teamName: '',
      teamSize: 3,
      leadName: '',
      leadEmail: '',
      leadPhone: '',
      college: '',
      year: '1st Year',
      dept: '',
      password: '',
      confirmPassword: '',
      members: [
        { name: '', email: '', phone: '', college: '', role: 'Developer', year: '1st Year', dept: '' },
        { name: '', email: '', phone: '', college: '', role: 'Designer', year: '1st Year', dept: '' },
      ],
    },
  });

  useEffect(() => {
    async function init() {
      try {
        const [tracksRes, statusRes] = await Promise.all([
          getTracks(),
          getRegistrationStatus()
        ]);

        setTracks(tracksRes.data || []);
        const REGISTRATION_DEADLINE = new Date('2026-09-26T18:29:59.000Z'); // 23:59 IST = 18:29 UTC
        const isPastDeadline = new Date() > REGISTRATION_DEADLINE;
        setStatus(isPastDeadline ? { open: false, reason: 'Registration window closed on 26th September.' } : (statusRes.data || { open: true }));
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const goNext = async () => {
    let valid = false;
    if (step === 0) valid = await form.trigger(['teamName', 'teamSize']);
    else if (step === 1) valid = await form.trigger(['leadName', 'leadEmail', 'leadPhone', 'college', 'year', 'dept']);
    else if (step === 2) valid = await form.trigger('members');
    if (valid) {
      setDir(1);
      setStep((v) => Math.min(v + 1, steps.length - 1));
    }
  };

  const goBack = () => { setDir(-1); setStep((v) => Math.max(v - 1, 0)); };

  const addMember = () => {
    const members = form.getValues('members') || [];
    if (members.length >= 3) return;
    form.setValue('teamSize', 4);
    form.setValue('members', [...members, { name: '', email: '', phone: '', college: '', role: '', year: '1st Year', dept: '' }]);
  };

  const removeMember = (index) => {
    const members = form.getValues('members');
    if (members.length !== 3) return;
    form.setValue('members', members.filter((_, i) => i !== index));
    form.setValue('teamSize', 3);
  };

  const handleIdsFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setIdsFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setIdsFileError('Please upload a single PDF combining every member\u2019s ID proof.');
      setIdsFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setIdsFileError('File is too large (max 1MB).');
      setIdsFile(null);
      e.target.value = '';
      return;
    }
    setIdsFileError('');
    setIdsFile(file);
  };

  const onFinalSubmit = async (payload) => {
    if (!idsFile) {
      setIdsFileError('Please upload a combined PDF of all participant ID proofs.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await registerTeam(
        { ...payload, cf_turnstile_response: turnstileToken },
        idsFile
      );

      setSuccessData(response.data);
      setSubmitted(true);
    } catch (err) {
      form.setError('root', {
        message: err.message || 'Registration failed. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (step < steps.length - 1) {
      await goNext();
    } else {
      form.handleSubmit(onFinalSubmit)(e);
    }
  };

  if (submitted && successData) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.shell}>
          <motion.div className={styles.card} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={styles.successIcon}>✦</div>
            <p className={styles.eyebrow}>REGISTRATION COMPLETE</p>
            <h1 className={styles.successTitle}>You're in.</h1>
            <p className={styles.successDesc}>Credentials also sent to your mail. Please check the Spam Folder.</p>
            <p className={styles.successDesc}>{successData.message}</p>
            <div className={styles.teamIdBox}>
              <span>Team ID</span>
              <strong>{successData.teamId || '—'}</strong>
            </div>
            <div className={styles.teamIdBox}>
              <span>Team login mail</span>
              <strong>{successData.email || form.getValues('leadEmail') || '—'}</strong>
            </div>
            <div className={styles.actions}>
              <SqBtn onClick={() => navigate('/login')} lineColor="#FAB600" baseColor="#261005" intensity={1.2}>Go to Login</SqBtn>
              <SqBtn onClick={() => navigate('/')} lineColor="#FAB600" baseColor="#261005">Back Home</SqBtn>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!status.open) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>REGISTRATIONS</p>
            <h1>Registrations are closed.</h1>
            <p className={styles.closedDesc}>Check back soon or follow us on social for the next event.</p>
            <SqBtn onClick={() => navigate('/')}>Return Home</SqBtn>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <LoadingOverlay visible={isSubmitting} label="Creating your team..." />
      <Navbar />
      <main className={styles.shell}>
        {/* Back to home button */}
        <div className={styles.backRow}>
          <SqBtn onClick={() => navigate('/')}>
            ← Back
          </SqBtn>
        </div>

        <motion.div className={styles.card} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <p className={styles.eyebrow}>JOIN RepoForge</p>
            <h2 className={styles.cardTitle}>{steps[step]}</h2>
          </div>

          {/* Step indicators */}
          <div className={styles.stepper}>
            {steps.map((label, i) => (
              <div key={label} className={styles.stepItem}>
                <div className={`${styles.stepDot} ${i < step ? styles.done : ''} ${i === step ? styles.active : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={styles.stepLabel}>{label}</span>
                {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.doneLine : ''}`} />}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <form onSubmit={handleFormSubmit} className={styles.form}>
            <div className={styles.stepWrap}>
              <AnimatePresence custom={dir} mode="wait" initial={false}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={styles.stepPanel}
                >
                  {step === 0 && (
                    <>
                      <div className={styles.field}>
                        <label>Team Name</label>
                        <input {...form.register('teamName')} placeholder="The Builders" />
                        {form.formState.errors.teamName && <small>{form.formState.errors.teamName.message}</small>}
                      </div>
                      <div className={styles.field}>
                        <label>Team Size <span className={styles.hint}>(3-4 members)</span></label>
                        <input type="number" min="3" max="4" {...form.register('teamSize')} />
                        {form.formState.errors.teamSize && <small>{form.formState.errors.teamSize.message}</small>}
                      </div>
                      {/* Cloudflare Turnstile CAPTCHA */}
                      <div className={styles.field}>
                        {/* <div
                          className="cf-turnstile"
                          data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                          data-callback={(token) => setTurnstileToken(token)}
                          data-theme="dark"
                        /> */}
                        <small style={{ color: '#c99a2e' }}>Verification your details before submission.</small>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className={styles.field}>
                        <label>Full Name</label>
                        <input {...form.register('leadName')} placeholder="Jane Doe" />
                        {form.formState.errors.leadName && <small>{form.formState.errors.leadName.message}</small>}
                      </div>
                      <div className={styles.splitFields}>
                        <div className={styles.field}>
                          <label>Email</label>
                          <input {...form.register('leadEmail')} placeholder="jane@example.com" />
                          {form.formState.errors.leadEmail && <small>{form.formState.errors.leadEmail.message}</small>}
                        </div>
                        <div className={styles.field}>
                          <label>Phone <span className={styles.hint}>(10 digits, no country code)</span></label>
                          <input {...form.register('leadPhone')} placeholder="9876543210" inputMode="numeric" maxLength={10} />
                          {form.formState.errors.leadPhone && <small>{form.formState.errors.leadPhone.message}</small>}
                        </div>
                      </div>
                      <div className={styles.splitFields}>
                        <div className={styles.field}>
                          <label>College</label>
                          <input {...form.register('college')} placeholder="E.g. Xavier Institute of Engineering" />
                          {form.formState.errors.college && <small>{form.formState.errors.college.message}</small>}
                        </div>
                        <div className={styles.field}>
                          <label>Year</label>
                          <select {...form.register('year')}>
                            {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => <option key={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label>Dept</label>
                          <input {...form.register('dept')} placeholder="IT" />
                          {form.formState.errors.dept && <small>{form.formState.errors.dept.message}</small>}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className={styles.membersHeader}>
                        <h3 className={styles.membersTitle}>Team Members</h3>
                        {(form.watch('members') || []).length === 2 && (
                          <SqBtn onClick={addMember}>+ Add</SqBtn>
                        )}
                      </div>
                      {(form.watch('members') || []).map((_, index) => (
                        <div key={index} className={styles.memberCard}>
                          <div className={styles.memberCardHeader}>
                            <span className={styles.memberNum}>Member {index + 1}</span>
                            {index > 0 && (form.watch('members') || []).length === 3 && (
                              <SqBtn onClick={() => removeMember(index)} danger>Remove</SqBtn>
                            )}
                          </div>
                          <div className={styles.splitFields}>
                            <div className={styles.field}>
                              <label>Name</label>
                              <input {...form.register(`members.${index}.name`)} placeholder="Full name" />
                              {form.formState.errors.members?.[index]?.name && (
                                <small>{form.formState.errors.members[index].name.message}</small>
                              )}
                            </div>
                            <div className={styles.field}>
                              <label>Role</label>
                              <input {...form.register(`members.${index}.role`)} placeholder="e.g. Developer" />
                            </div>
                          </div>
                          <div className={styles.splitFields}>
                            <div className={styles.field}>
                              <label>Email</label>
                              <input {...form.register(`members.${index}.email`)} placeholder="email@example.com" />
                              {form.formState.errors.members?.[index]?.email && (
                                <small>{form.formState.errors.members[index].email.message}</small>
                              )}
                            </div>
                            <div className={styles.field}>
                              <label>Phone <span className={styles.hint}>(10 digits)</span></label>
                              <input {...form.register(`members.${index}.phone`)} placeholder="1234567890" inputMode="numeric" maxLength={10} />
                              {form.formState.errors.members?.[index]?.phone && (
                                <small>{form.formState.errors.members[index].phone.message}</small>
                              )}
                            </div>
                          </div>
                          <div className={styles.splitFields}>
                            <div className={styles.field}>
                              <label>College</label>
                              <input {...form.register(`members.${index}.college`)} placeholder="E.g. Xavier Institute of Engineering" />
                              {form.formState.errors.members?.[index]?.college && (
                                <small>{form.formState.errors.members[index].college.message}</small>
                              )}
                            </div>
                            <div className={styles.field}>
                              <label>Year</label>
                              <select {...form.register(`members.${index}.year`)}>
                                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => <option key={y} style={{ backgroundColor: '#3f1200ff', color: '#fff' }}>{y}</option>)}
                              </select>
                            </div>
                            <div className={styles.field}>
                              <label>Dept</label>
                              <input {...form.register(`members.${index}.dept`)} placeholder="IT" />
                              {form.formState.errors.members?.[index]?.dept && (
                                <small>{form.formState.errors.members[index].dept.message}</small>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h3 className={styles.reviewHeading}>Review your details</h3>
                      <div className={styles.reviewGrid}>
                        {[
                          { label: 'Team Name', value: form.watch('teamName') },
                          { label: 'Team Size', value: form.watch('teamSize') },
                          { label: 'Lead Name', value: form.watch('leadName') },
                          { label: 'College', value: form.watch('college') },
                          { label: 'Email', value: form.watch('leadEmail') },
                          { label: 'Phone', value: form.watch('leadPhone') },
                          { label: 'Year', value: form.watch('year') },
                          { label: 'Dept', value: form.watch('dept') }
                        ].map(({ label, value }) => (
                          <div key={label} className={styles.reviewCell}>
                            <span>{label}</span>
                            <strong>{value || '—'}</strong>
                          </div>
                        ))}
                      </div>
                      <div className={styles.reviewMembers}>
                        <p className={styles.reviewMembersLabel}>MEMBERS</p>
                        {(form.watch('members') || []).map((m, i) => (
                          <div key={i} className={styles.reviewMemberRow}>
                            <div>
                              <strong>{m.name || `Member ${i + 1}`}</strong>
                              {m.role && <span style={{ marginLeft: 8, color: '#fab600', opacity: 0.9 }}>({m.role})</span>}
                              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '3px' }}>
                                {m.email || 'No email'} · {m.phone || 'No phone'} · {m.college || 'No college'} · {m.dept || 'No dept'} · {m.year || '1st Year'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Participant ID proofs (single combined PDF) */}
                      <div className={styles.reviewSection}>
                        <div className={styles.reviewSectionHeader}>
                          <h4 className={styles.reviewSectionTitle}>Participant ID Proofs</h4>
                          <p className={styles.reviewDesc}>
                            Upload one PDF containing the ID proof of every team member (combined into a single file).
                          </p>
                        </div>
                        <div className={styles.field}>
                          <label>Combined ID Proofs (PDF)</label>
                          <input type="file" accept="application/pdf" onChange={handleIdsFileChange} />
                          {idsFile && (
                            <small style={{ color: '#fab600' }}>✓ {idsFile.name} selected</small>
                          )}
                          {idsFileError && <small>{idsFileError}</small>}
                        </div>
                      </div>

                      {/* Password setup for team login */}
                      <div className={styles.reviewSection}>
                        <div className={styles.reviewSectionHeader}>
                          <h4 className={styles.reviewSectionTitle}>Set Team Password</h4>
                          <h4 className={styles.reviewSectionTitle}>Login ID is the same as Team Leader Email</h4>
                          <p className={styles.reviewDesc}>
                            Create a password to access your team dashboard after registration.
                          </p>
                        </div>
                        <div className={styles.splitFields}>
                          <div className={styles.field}>
                            <label>Password</label>
                            <input
                              type="password"
                              {...form.register('password')}
                              placeholder="Min. 6 characters"
                              autoComplete="new-password"
                            />
                            {form.formState.errors.password && (
                              <small>{form.formState.errors.password.message}</small>
                            )}
                          </div>
                          <div className={styles.field}>
                            <label>Confirm Password</label>
                            <input
                              type="password"
                              {...form.register('confirmPassword')}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                            />
                            {form.formState.errors.confirmPassword && (
                              <small>{form.formState.errors.confirmPassword.message}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form Actions */}
            {form.formState.errors.root && (
              <div style={{ color: '#ff6b75', fontSize: '13px', marginBottom: '8px', padding: '10px 14px', background: 'rgba(255,107,117,0.08)', borderRadius: '8px', border: '1px solid rgba(255,107,117,0.2)' }}>
                {form.formState.errors.root.message}
              </div>
            )}
            <div className={styles.formActions}>
              {step > 0 ? (
                <SqBtn type="button" onClick={goBack}>← Back</SqBtn>
              ) : <span />}

              {step < steps.length - 1 ? (
                <SqBtn type="button" onClick={goNext} intensity={1.2}>Next →</SqBtn>
              ) : (
                <SqBtn type="submit" intensity={1.5}>Submit Registration ✦</SqBtn>
              )}
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}