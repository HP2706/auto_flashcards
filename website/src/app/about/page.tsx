export default function AboutPage() {
  return (
    <main>
      <h2>About</h2>
      <p>
        This is a minimal Next.js app that reads markdown flashcards from the
        <code> markdown_cards/</code> folder and schedules reviews using a pluggable
        algorithm interface.
      </p>
      <p>
        To create a new algorithm, add a module under <code>src/algorithms/</code> that
        exports a <code>Scheduler</code>, and register it in <code>src/algorithms/index.ts</code>.
      </p>
    </main>
  );
}
