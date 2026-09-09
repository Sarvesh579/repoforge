import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../../components/ui/Footer';
import Navbar from '../../components/ui/Navbar';
import GradientText from '../../components/ui/GradientText';
import CountdownTimer from '../../components/ui/CountdownTimer';
import MagneticButton from '../../components/ui/MagneticButton';
import SpecularButton from '../../components/ui/SpecularButton';
import GlareHover from '../../components/ui/GlareHover';
import { useParallax } from '../../hooks/useParallax';
import { smoothScrollTo } from '../../utils/smoothScroll';
import n8nLogo from '../../assets/sponsors/n8n.png';
import styles from './Landing.module.css';

const MotionGlareHover = motion.create ? motion.create(GlareHover) : motion(GlareHover);

const faqItems = [
  { q: 'When / where do we pay registration fee?', a: "No registration fees for PPT round. Pay ₹300 after you've been shortlisted for Offline Hackathon" },
  { q: 'Who can participate?', a: 'Any year engineering student with a passion for shipping impactful ideas.' },
  { q: 'Do we need a fully working product?', a: 'Ideally yes. Teams shall show a proototype or demo in the first offline judging round, but final judging round would require a product.' },
  { q: 'Is there a theme?', a: 'The event focuses on real-world impact with PSs across various domains. No limitation on APP/WEB deployment' },
  { q: 'Are the PS same for PPT and Offline rounds?', a: 'Yes. Your PS for offline round will be same as your selected PS for PPT round.' },
];

const rewards = [
  { title: '₹25k+ Prize Pool', text: 'Goodies and Prizes for the top teams.' },
  { title: 'Mentor access', text: 'Direct sessions with founders, operators, and product leaders.' },
  { title: 'Career network', text: 'Introductions to hiring partners and startup communities.' },
  { title: 'Internship Opportunities', text: 'Internship opportunities to selected students who show promising passion' },
];

const sponsorRow1 = [
  { name: 'Infraon', tier: 'TITLE SPONSOR', tierClass: 'tierGreen', bg: '#1a5c35', logoimg: '/infraon_logo_white.png', links: { linkedin: 'https://www.linkedin.com/company/infraon/', instagram: 'https://www.instagram.com/infraoncorp' } },
  { name: 'SATPrep1600', tier: 'SPONSOR', tierClass: 'tierOrange', bg: '#7a2d00', logoimg: '/SAT_Prep.png', links: { website: 'https://www.satprep1600.com/' } },
];
const sponsorRow2 = [
  { name: 'Mumbai Tech Community', tier: 'COMMUNITY PARTNER', tierClass: 'tierBlue', bg: '#1a237e', logoimg: '/Mumbai_Tech_Community.png', links: { linkedin: 'https://www.linkedin.com/company/mumbai-tech-community/', instagram: 'https://www.instagram.com/mumbaitechcommunity' } },
  { name: 'Third Wave Coffee', tier: 'DRINKS PARTNER', tierClass: 'tierBlue', bg: '#3b1a0d', logoimg: '/Third_Wave_Coffee.png', links: { website: 'https://www.thirdwavecoffeeroasters.com/' } },
  { name: 'Pizza Hut', tier: 'SNACKS PARTNER', tierClass: 'tierBlue', bg: '#1a237e', logoimg: '/Pizza_Hut.png', links: { website: 'https://www.pizzahut.co.in/' } },
  { name: 'Scroll Connect', tier: 'CAMPUS PARTNER', tierClass: 'tierBlue', bg: '#1a237e', logoimg: '/scroll-connect-light.png', links: { website: 'https://www.scrollconnect.com/' } },
  { name: 'MiniMoth.dev', tier: 'MESSAGING PARTNER', tierClass: 'tierBlue', bg: '#1a237e', logoimg: '/moth-light.png', links: { linkedin: 'https://www.linkedin.com/company/minimoth', X: 'https://x.com/minimoth_dev' } },
  { name: 'n8n', tier: 'CLOUD PARTNER', tierClass: 'tierBlue', bg: '#1a237e', logoimg: n8nLogo, links: { website: 'https://n8n.io/' } },
];

const stats = [
  { value: '₹25k', label: 'Prize Pool' },
  { value: '200+', label: 'Members' },
  { value: 'Mahim', label: 'Location' },
  { value: '5', label: 'Problem Statements' },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

// Stagger child cards when a section enters the viewport
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Milestone dates for automatic active status activation
const milestoneDates = {
  '01': '2026-08-20T00:00:00',
  '02': '2026-09-20T00:00:00',
  '03': '2026-09-26T00:00:00',
  '04': '2026-09-27T00:00:00',
  '05': '2026-09-30T00:00:00',
  '06': '2026-10-02T00:00:00',
  '07': '2026-10-03T08:00:00',
  '08': '2026-10-03T08:30:00',
  '09': '2026-10-03T09:00:00',
  '10': '2026-10-03T11:00:00',
  '11': '2026-10-03T13:00:00',
  '12': '2026-10-03T14:00:00',
  '13': '2026-10-03T15:00:00',
  '14': '2026-10-03T17:00:00',
};

const isDateReached = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() <= Date.now();
};

export default function Landing() {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(-1);
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  // ── Parallax refs ────────────────────────────────────────────────────────
  const hero = useParallax(80);   // hero visual drifts up
  const orbit = useParallax(50);   // decorative orbit ring – slower
  const statsSection = useParallax(50);
  const rewardsHeading = useParallax(40);
  const faqHeading = useParallax(30);

  useEffect(() => {
    const id = location.hash.replace('#', '');
    if (id) {
      setTimeout(() => {
        smoothScrollTo(id, { offset: 80, duration: 850 });
      }, 100);
    }
  }, [location.hash]);


  return (
    <div className={`${styles.page} landing-page`}>
      <Navbar />

      <main className={styles.main}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section id="herosec1" className={styles.heroSection}>
          <div className={styles.heroGlow} />
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={styles.heroCentered}
            >
              <div className={styles.xiecsilogos}>
                <img src="/White-XIE.png" alt="XIE" />
                <img src="/CSI-logo.png" alt="CSI" />
              </div>

              {/* Hero Title with Shuffle animation */}
              <h1 className={styles.heroTitle} aria-label="RepoForge">
                {/* <GradientText
                  colors={["#3794f8ff", "#8bbaff", "#ffffff"]}
                  animationSpeed={6}
                  showBorder={false}
                  className={styles.shuffleHeroProject}
                >
                </GradientText>
                <GradientText
                  colors={["#ffffff", "#8bbaff", "#3794f8ff"]}
                  animationSpeed={6}
                  showBorder={false}
                  className={styles.shuffleHeroCrucible}
                >

                </GradientText> */}
                <img src="/title-logo.png" alt="RepoForge" />
              </h1>

              {/* Subtitle & Description */}
              <h2 className={styles.heroSubtitle}>Build the Foundation; Commit the Future.</h2>
              <p className={styles.heroDesc}>
                The premier high-intensity hackathon where software architects, engineers, and product builders collaborate to solve real-world industry challenges. Win Exciting Prizes!
              </p>

              {/* Meta Line */}
              <div className={styles.heroMetaLine}>
                20th SEPTEMBER to 3rd OCTOBER, 2026 &nbsp;•&nbsp; HYBRID &nbsp;•&nbsp; 3 ROUNDS
              </div>

              {/* Action Buttons */}
              <div className={styles.heroActionsCenter}>
                <SpecularButton
                  size="md"
                  radius={14}
                  lineColor="#FAB600"
                  baseColor="#B02501"
                  textColor="#ffffff"
                  intensity={1.2}
                  speed={0.4}
                  onClick={() => window.location.assign('/register')}
                >
                  Register Now &rarr;
                </SpecularButton>
                <SpecularButton
                  size="md"
                  radius={14}
                  lineColor="#FAB600"
                  baseColor="#261005"
                  textColor="#ffffff"
                  intensity={1}
                  speed={0.35}
                  onClick={() => {
                    const el = document.getElementById('problem-statements');
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                    else alert("Not released yet! All PS will be released on 20th September 2026. Thank you");
                  }}
                >
                  Explore Problem Statements &rsaquo;
                </SpecularButton>
              </div>

              {/* Digital Countdown Timer */}
              <div className={styles.countdownContainer}>
                <CountdownTimer targetDate="2026-09-26T00:00:00Z" />
              </div>
              <div className={styles.heroMetaLine} style={{ margin: '5px 0' }}>
                REMAINING FOR REGISTRATION
              </div>
            </motion.div>
          </div>
        </section>


        {/* ── SPONSORS ──────────────────────────────────────────────────────── */}
        <motion.section
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container">
            <div className={styles.sponsorsHeader}>
              <p className={styles.sponsorsEyebrow}>BACKED BY THE BEST</p>
              <h2 className={styles.sponsorsTitle}>
                Our <span>Sponsors</span>
              </h2>
            </div>

            <div className={styles.sponsorsContainer}>

              {/* Row 1 – Title Sponsor & Sponsor */}
              <motion.div
                className={styles.sponsorCardsRow}
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {sponsorRow1.map((sponsor) => (
                  <div
                    key={sponsor.name}
                    onClick={() => setSelectedSponsor(sponsor)}
                    style={{ cursor: 'pointer' }}
                  >
                    <MotionGlareHover
                      className={styles.sponsorCard}
                      variants={cardReveal}
                      whileHover={{
                        y: -6,
                        scale: 1.02,
                        transition: { duration: 0.25 }
                      }}
                      glareColor="#ffffff"
                      glareOpacity={0.15}
                      glareSize={250}
                      transitionDuration={600}
                    >
                      <div
                        className={styles.sponsorLogoBox}
                        style={{
                          background: sponsor.logoimg
                            ? 'rgba(255,255,255,0.1)'
                            : sponsor.bg
                        }}
                      >
                        {sponsor.logoimg ? (
                          <img
                            src={sponsor.logoimg}
                            alt={sponsor.name}
                            className={styles.sponsorLogoImg}
                          />
                        ) : (
                          <span className={styles.sponsorFallbackLetters}>
                            {sponsor.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <h3 className={styles.sponsorName}>
                        {sponsor.name}
                      </h3>

                      <p
                        className={`${styles.sponsorTier} ${styles[sponsor.tierClass]}`}
                      >
                        {sponsor.tier}
                      </p>
                    </MotionGlareHover>
                  </div>
                ))}
              </motion.div>


              {/* Row 2 – Community & Drinks Partners */}
              <motion.div
                className={styles.sponsorCardsRow}
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {sponsorRow2.map((sponsor) => (
                  <div
                    key={sponsor.name}
                    onClick={() => setSelectedSponsor(sponsor)}
                    style={{ cursor: 'pointer' }}
                  >
                    <MotionGlareHover
                      className={styles.sponsorCard}
                      variants={cardReveal}
                      whileHover={{
                        y: -6,
                        scale: 1.02,
                        transition: { duration: 0.25 }
                      }}
                      glareColor="#ffffff"
                      glareOpacity={0.12}
                      glareSize={200}
                      transitionDuration={600}
                    >
                      <div
                        className={styles.sponsorLogoBox}
                        style={{
                          background: sponsor.logoimg
                            ? 'rgba(255,255,255,0.1)'
                            : sponsor.bg
                        }}
                      >
                        {sponsor.logoimg ? (
                          <img
                            src={sponsor.logoimg}
                            alt={sponsor.name}
                            className={styles.sponsorLogoImg}
                          />
                        ) : (
                          <span className={styles.sponsorFallbackLetters}>
                            {sponsor.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <h3 className={styles.sponsorName}>
                        {sponsor.name}
                      </h3>

                      <p
                        className={`${styles.sponsorTier} ${styles[sponsor.tierClass]}`}
                      >
                        {sponsor.tier}
                      </p>
                    </MotionGlareHover>
                  </div>
                ))}
              </motion.div>


              {/* Sponsor Modal */}
              {selectedSponsor && (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setSelectedSponsor(null)}
                >
                  <div
                    className={styles.sponsorModal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.modalClose}
                      onClick={() => setSelectedSponsor(null)}
                    >
                      ×
                    </button>

                    <h2>{selectedSponsor.name}</h2>

                    <div className={styles.sponsorLinks}>
                      {Object.entries(selectedSponsor.links || {}).map(
                        ([name, url]) => (
                          <a
                            key={name}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Follow on {name}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.section>


        {/* ── ROADMAP / EVENT FLOW ───────────────────────────────────────────── */}
        <motion.section
          id="roadmap"
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
        >
          <div className="container">
            {/* Centered Heading */}
            <div className={styles.tracksHeaderCentered}>
              <p className={styles.eyebrowBlue}>ROAD TO RepoForge</p>
              <h2 className={styles.tracksTitle}>
                One challenge. <span>Many milestones.</span>
              </h2>
            </div>

            {/* Top Row: Milestones 01 to 06 */}
            <div className={styles.milestoneRowTop}>
              {/* Connected Line and Badges */}
              <div className={styles.milestoneLineHeader}>
                {['01', '02', '03', '04', '05', '06'].map((num) => (
                  <div
                    key={num}
                    className={`${styles.milestoneBadgeCircle} ${isDateReached(milestoneDates[num]) ? styles.badgeActive : ''}`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Cards Grid Top */}
              <div className={styles.milestoneGridTop}>
                {/* 01: Registrations Ongoing */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['01']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>6 SEPT</div>
                  <h3>Registrations OPEN</h3>
                  <p>Register via this website to secure your spot in RepoForge Hackathon 2026.</p>
                </div>

                {/* 02: Problem Statement Release */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['02']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>20 SEPT</div>
                  <div className={styles.dateSubtextDark}></div>
                  <h3>Problem Statement Release</h3>
                  <p>The PS for PPT round are released and PPT submissions are open.</p>
                </div>

                {/* 03: Registration Deadline */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['03']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>26 SEPT</div>
                  <div className={styles.dateSubtextDark}></div>
                  <h3>Registration Deadline</h3>
                  <p>Last date to register for RepoForge hackathon 2026.</p>
                </div>

                {/* 04: PPT Submission Deadline */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['04']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>27 SEPT</div>
                  <div className={styles.dateSubtextDark}></div>
                  <h3>PPT Submission Deadline</h3>
                  <p>Last date to select your PS and submit your Project Presentation (PPT) for the qualifier round.</p>
                </div>

                {/* 05: Shortlisting */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['05']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>30 SEPT</div>
                  <div className={styles.dateSubtextGreen}></div>
                  <h3>Shortlisting</h3>
                  <p>Shortlisted teams based on PPT will be announced. Payment to be completed by 2nd Oct, 12 NOON.</p>
                </div>

                {/* 06: Final Registration */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['06']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>2 OCT</div>
                  <div className={styles.dateSubtextGreen}></div>
                  <h3>Final Registration</h3>
                  <p>After 12 Noon, Waitlisted teams will be allowed to pay & register for the remaining limited spots.</p>
                </div>
              </div>
            </div>

            {/* Divider Label */}
            <div className={styles.dividerLabelContainer}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>HACKATHON DAY <b>(SATURDAY,  03 OCTOBER 2026)</b></span>
              <div className={styles.dividerLine} />
            </div>

            {/* Bottom Row: Milestones 07 to 10 */}
            <div className={styles.milestoneRowBottom}>
              {/* Badges Header */}
              <div className={styles.milestoneLineHeaderBottom}>
                {['07', '08', '09', '10'].map((num) => (
                  <div
                    key={num}
                    className={`${styles.milestoneBadgeCircle} ${isDateReached(milestoneDates[num]) ? styles.badgeActive : ''}`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Cards Grid Bottom */}
              <div className={styles.milestoneGridBottom}>
                {/* 07: Hackathon Begins */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['07']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>8:00 AM</div>
                  <h3>Registration Begins</h3>
                  <p>Entry of final 30 teams for offline hackathon begins. Please be on time.</p>
                </div>

                {/* 08: Inauguration */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['08']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>8:30 AM</div>
                  <h3>Inauguration Ceremony</h3>
                  <p>A short ceremony to declare the hackathon open.</p>
                </div>

                {/* 09: Coding Begins */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['09']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>9:00 AM</div>
                  <h3>Coding Begins</h3>
                  <p>Labs will be allotted and participants can work on their projects.</p>
                </div>

                {/* 10: Judging Round 1 */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['10']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>11:00 AM</div>
                  <h3>Judging Round 1</h3>
                  <p>Panel of judges will judge the product and shortlist teams for final round</p>
                </div>
              </div>
            </div>

            {/* Divider Label */}
            <div className={styles.dividerLabelContainer}>
              <div className={styles.dividerLine} />
            </div>

            {/* Bottom Row: Milestones 11 to 14*/}
            <div className={styles.milestoneRowBottom}>
              {/* Badges Header */}
              <div className={styles.milestoneLineHeaderBottom}>
                {['11', '12', '13', '14'].map((num) => (
                  <div
                    key={num}
                    className={`${styles.milestoneBadgeCircle} ${isDateReached(milestoneDates[num]) ? styles.badgeActive : ''}`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Cards Grid Bottom */}
              <div className={styles.milestoneGridBottom}>
                {/* 11: Lunch */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['11']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>1:00 PM</div>
                  <h3>Lunch</h3>
                  <p>Lunch will be served to all participants</p>
                </div>

                {/* 12: Result of Judging 1 */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['12']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>2:00 PM</div>
                  <h3>Results of Judging Round 1</h3>
                  <p>The final Shortlisted teams will be announced</p>
                </div>

                {/* 13: Judging Round 2 */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['13']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>3:00 PM</div>
                  <h3>Judging Round 2</h3>
                  <p>Present the final product on-stage in front of the full judging panel and audience.</p>
                </div>

                {/* 14 : Valedictory Ceremony */}
                <div className={`${styles.milestoneCard} ${isDateReached(milestoneDates['14']) ? styles.cardActive : styles.cardDark}`}>
                  <div className={styles.dateLabelDark}>5:00 PM</div>
                  <h3>Valedictory Ceremony</h3>
                  <p>Felicitation of the winners and closing of the event.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── WHY US ────────────────────────────────────────────────────────── */}
        <motion.section
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">WHY US</p>
              <h2>Built for builders who love messy, meaningful work.</h2>
            </div>
            <motion.div
              className={styles.valueGrid}
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
            >
              {[
                ['Rapid prototyping', 'Turn a thesis into a demo within 6 hours of intentional design and coding.'],
                ['Hands-on mentorship', 'Work directly with technologists, operators, and product builders.'],
                ['Real-world constraints', 'Solve issues tied to measurable impact rather than abstract novelty.'],
                ['Strong network', 'Meet investors, operators, and teams building serious products.'],
              ].map(([title, text]) => (
                <MotionGlareHover
                  key={title}
                  className={styles.valueCard}
                  variants={cardReveal}
                  whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
                  glareColor="#ffffff"
                  glareOpacity={0.15}
                  glareSize={250}
                  transitionDuration={600}
                >
                  <div className={styles.valueHeader}>
                    <div className={styles.valueBadge}>✦</div>
                    <h3>{title}</h3>
                  </div>
                  <p>{text}</p>
                </MotionGlareHover>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <motion.section
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container">
            <motion.div
              ref={statsSection.ref}
              className="section-heading"
              style={{ y: statsSection.y }}
            >
              <p className="eyebrow">BY THE NUMBERS</p>
              <h2>Momentum that compounds.</h2>
            </motion.div>

            <motion.div
              className={styles.statsStrip}
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {stats.map((stat) => (
                <MotionGlareHover
                  key={stat.label}
                  className={styles.statCard}
                  variants={cardReveal}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  glareColor="#ffffff"
                  glareOpacity={0.15}
                  glareSize={250}
                  transitionDuration={600}
                >
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </MotionGlareHover>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── REWARDS ───────────────────────────────────────────────────────── */}
        <motion.section
          id="rewards"
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container">
            <motion.div
              ref={rewardsHeading.ref}
              className="section-heading"
              style={{ y: rewardsHeading.y }}
            >
              <p className="eyebrow">REWARDS</p>
              <h2>Backing ideas that deserve momentum.</h2>
            </motion.div>

            <motion.div
              className={styles.rewardsGrid}
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
            >
              {rewards.map((reward, index) => (
                <MotionGlareHover
                  key={reward.title}
                  className={styles.rewardCard}
                  variants={cardReveal}
                  whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
                  glareColor="#ffffff"
                  glareOpacity={0.15}
                  glareSize={250}
                  transitionDuration={600}
                >
                  <div className={styles.valueHeader}>
                    <span>0{index + 1}</span>
                    <h3>{reward.title}</h3>
                  </div>
                  <p>{reward.text}</p>
                </MotionGlareHover>
              ))}
            </motion.div>
          </div>
        </motion.section>



        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <motion.section
          id="faq"
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container faq-wrap">
            <motion.div
              ref={faqHeading.ref}
              className="section-heading left-align"
              style={{ y: faqHeading.y }}
            >
              <p className="eyebrow">FAQ</p>
              <h2>Common questions before the sprint.</h2>
            </motion.div>

            <div className={styles.faqList}>
              {faqItems.map((item, index) => (
                <MotionGlareHover
                  key={item.q}
                  className={`${styles.faqItem} ${openFaq === index ? styles.open : ''}`}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.07,
                    duration: 0.5,
                    layout: { type: 'spring', stiffness: 220, damping: 28, mass: 0.8 },
                  }}
                  glareColor="#ffffff"
                  glareOpacity={0.15}
                  glareSize={250}
                  transitionDuration={600}
                >
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    <span>{item.q}</span>
                    <motion.strong
                      animate={{ rotate: openFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {openFaq === index ? '-' : '+'}
                    </motion.strong>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: {
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.3, delay: 0.05, ease: 'easeOut' },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.2, ease: 'easeIn' },
                          },
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className={styles.faqAnswer}>
                          <p>{item.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MotionGlareHover>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── CONTACT ───────────────────────────────────────────────────────── */}
        <motion.section
          id="contact"
          className="section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={sectionVariants}
        >
          <div className="container">
            {/* Header */}
            <div className={styles.contactHeader}>
              <div className={styles.contactBadgePill}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
                GET IN TOUCH
              </div>
              <h2 className={styles.contactTitle}>
                Contact <span>Organising Team</span>
              </h2>
              <p className={styles.contactSubtitle}>
                Have questions about the hackathon? Need help with registration or finding a team?
                Reach out to us through any of the channels below.
              </p>
            </div>

            <div className={styles.contactLayout}>
              {/* Left – channel cards */}
              <a href="https://www.linkedin.com/company/xie-csi/" className={`${styles.channelLink} ${styles.linkBlue}`}>
                <MotionGlareHover className={styles.channelCard} whileHover={{ y: -4, transition: { duration: 0.2 } }} glareColor="#ffffff" glareOpacity={0.15}>
                  <div className={`${styles.channelIconWrap} ${styles.iconBlue}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-linkedin" viewBox="0 0 16 16">
                      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                    </svg>
                  </div>
                  <div className={styles.channelInfo}>
                    <h3>LinkedIn</h3>
                    <p>Get activity details, connections, and announcements.</p>
                    <p>Follow on LinkedIn →</p>
                  </div>
                </MotionGlareHover>
              </a>

              <a href="https://www.instagram.com/xie.csi" className={`${styles.channelLink} ${styles.linkPink}`}>
                <MotionGlareHover className={styles.channelCard} whileHover={{ y: -4, transition: { duration: 0.2 } }} glareColor="#ffffff" glareOpacity={0.15}>
                  <div className={`${styles.channelIconWrap} ${styles.iconPink}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <div className={styles.channelInfo}>
                    <h3>Instagram</h3>
                    <p>Get real-time updates, behind-the-scenes content, and announcements.</p>
                    <p className={`${styles.linkPink}`}>Follow on Instagram →</p>
                  </div>
                </MotionGlareHover>
              </a>

              <a href="mailto:admincsi26@gmail.com" className={`${styles.channelLink} ${styles.linkWhite}`}>
                <MotionGlareHover className={styles.channelCard} whileHover={{ y: -4, transition: { duration: 0.2 } }} glareColor="#ffffff" glareOpacity={0.15}>
                  <div className={`${styles.channelIconWrap} ${styles.iconWhite}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 7L2 7" />
                    </svg>
                  </div>
                  <div className={styles.channelInfo}>
                    <h3>Email Us</h3>
                    <p>For formal queries, sponsorships, and partnership opportunities.</p>
                    <p>admincsi26@gmail.com →</p>
                  </div>
                </MotionGlareHover>
              </a>

              <a className={`${styles.channelLink} ${styles.linkWhite}`}>
                <MotionGlareHover className={styles.channelCard} whileHover={{ y: -4, transition: { duration: 0.2 } }} glareColor="#ffffff" glareOpacity={0.15}>
                  <div className={`${styles.channelIconWrap} ${styles.iconWhite}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="limeGreen" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-whatsapp"><path d='M9.516.012C4.206.262.017 4.652.033 9.929a9.798 9.798 0 0 0 1.085 4.465L.06 19.495a.387.387 0 0 0 .47.453l5.034-1.184a9.981 9.981 0 0 0 4.284 1.032c5.427.083 9.951-4.195 10.12-9.58C20.15 4.441 15.351-.265 9.516.011zm6.007 15.367a7.784 7.784 0 0 1-5.52 2.27 7.77 7.77 0 0 1-3.474-.808l-.701-.347-3.087.726.65-3.131-.346-.672A7.62 7.62 0 0 1 2.197 9.9c0-2.07.812-4.017 2.286-5.48a7.85 7.85 0 0 1 5.52-2.271c2.086 0 4.046.806 5.52 2.27a7.672 7.672 0 0 1 2.287 5.48c0 2.052-.825 4.03-2.287 5.481z' /><path d='M14.842 12.045l-1.931-.55a.723.723 0 0 0-.713.186l-.472.478a.707.707 0 0 1-.765.16c-.913-.367-2.835-2.063-3.326-2.912a.694.694 0 0 1 .056-.774l.412-.53a.71.71 0 0 0 .089-.726L7.38 5.553a.723.723 0 0 0-1.125-.256c-.539.453-1.179 1.14-1.256 1.903-.137 1.343.443 3.036 2.637 5.07 2.535 2.349 4.566 2.66 5.887 2.341.75-.18 1.35-.903 1.727-1.494a.713.713 0 0 0-.408-1.072z' /></svg>
                  </div>
                  <div className={styles.channelInfo}>
                    <h3>WhatsApp / Call us</h3>
                    <p>Soham Bagal:<br />+91 9324575153<br />Alakshya Salvi: <br />+91 9833580098<br /></p>
                  </div>
                </MotionGlareHover>
              </a>
            </div>
          </div>
        </motion.section>

      </main>

      <Footer />
    </div>
  );
}