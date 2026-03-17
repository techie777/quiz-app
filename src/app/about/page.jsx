import styles from "@/styles/LandingPage.module.css";

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <div style={{ paddingTop: '80px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>About QuizWeb</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          QuizWeb is a leading platform for knowledge seekers and quiz enthusiasts. 
          Our mission is to make learning fun and accessible to everyone, anywhere in the world.
        </p>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          Founded in 2026, we have grown into a community of millions of users who challenge 
          themselves daily across hundreds of categories, from Science and History to Pop Culture and Sports.
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '40px', marginBottom: '20px' }}>Our Vision</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
          We believe that knowledge should be free, engaging, and always within reach. 
          Whether you're a student preparing for exams or just someone who loves trivia, 
          QuizWeb is designed to help you grow.
        </p>
      </div>
    </main>
  );
}
