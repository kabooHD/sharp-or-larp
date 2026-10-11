export const CONTACT_EMAIL = 's.mounier.contact@gmail.com'

// The terms page: what the site does, the leaderboard, data and how to reach us.
export default function Terms() {
  return (
    <main className="terms">
      <a className="terms-back" href="/">
        &lt;- Back to the LARP meter
      </a>
      <h1>Terms & privacy</h1>
      <p className="kicker">Last updated October 11, 2026</p>

      <h2>What Sharp or Larp is</h2>
      <p>
        Sharp or Larp gives a light-hearted opinion on a public GitHub profile or a CV: a "larp"
        percentage, red and green flags, and a one-line roast. The verdict is generated
        automatically by code and an AI model. It is entertainment, not a factual assessment of
        anyone's skills, and should not be used to make hiring decisions.
      </p>

      <h2>Your data</h2>
      <p>
        A CV is read in your browser; its text and links are sent to our server and to an AI
        model provider to produce the verdict, then discarded. For each check we keep the GitHub
        username, avatar and score, so the leaderboard can show it. Anyone can add a checked
        GitHub profile to the leaderboard; it then shows that profile's username, avatar and
        latest score. To have a profile removed, write to us. We also keep each verdict for 30
        days, so that checking the same unchanged profile again gives the same verdict. We use no
        tracking cookies. Share cards are drawn in your browser and never sent to us.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or removal requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  )
}
