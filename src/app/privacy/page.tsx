import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — The Mirror",
  description: "How The Mirror protects your privacy and handles your data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030304] text-white/90 font-['Inter',system-ui,sans-serif]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-block mb-12 text-white/40 hover:text-white/70 transition-colors text-sm tracking-widest uppercase"
        >
          ← Back to The Mirror
        </Link>

        <h1 className="text-4xl font-['Cormorant_Garamond',Georgia,serif] font-light mb-4 tracking-wide">
          Privacy Policy
        </h1>
        <p className="text-white/40 mb-12 text-sm">
          Last updated: March 26, 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              The Sacred Space
            </h2>
            <p>
              The Mirror is a space for self-reflection. We treat your
              introspection as sacred. This policy explains what data we
              collect, why, and how we protect it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              What We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white/90">Your reflections:</strong> The
                text you share with The Mirror and the questions we ask in
                return. This is stored locally on your device by default.
              </li>
              <li>
                <strong className="text-white/90">Voice recordings:</strong> If
                you use voice input, your audio is transcribed and immediately
                discarded. We do not store audio files.
              </li>
              <li>
                <strong className="text-white/90">Cognitive patterns:</strong>{" "}
                The Mirror learns how you think to ask better questions. This
                pattern data stays on your device unless you create an account.
              </li>
              <li>
                <strong className="text-white/90">Account data:</strong> If you
                sign up, we store your email and encrypted session data to sync
                across devices.
              </li>
              <li>
                <strong className="text-white/90">Usage analytics:</strong>{" "}
                Anonymous metrics like session count and feature usage to
                improve the experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Third-Party Services
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white/90">
                  Anthropic (Claude AI):
                </strong>{" "}
                Your text is sent to Anthropic's API to generate questions.
                Anthropic does not train on API data.
                <a
                  href="https://www.anthropic.com/privacy"
                  className="text-white/50 hover:text-white/90 ml-1 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Their privacy policy →
                </a>
              </li>
              <li>
                <strong className="text-white/90">OpenAI (Whisper):</strong>{" "}
                Voice transcription uses OpenAI's Whisper API. Audio is
                processed and immediately deleted.
                <a
                  href="https://openai.com/policies/privacy-policy"
                  className="text-white/50 hover:text-white/90 ml-1 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Their privacy policy →
                </a>
              </li>
              <li>
                <strong className="text-white/90">Supabase:</strong> If you
                create an account, your data is stored securely in Supabase with
                row-level security.
                <a
                  href="https://supabase.com/privacy"
                  className="text-white/50 hover:text-white/90 ml-1 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Their privacy policy →
                </a>
              </li>
              <li>
                <strong className="text-white/90">Vercel:</strong> Our hosting
                provider. They may collect standard web server logs.
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-white/50 hover:text-white/90 ml-1 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Their privacy policy →
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Data Security
            </h2>
            <p>Your data is protected by:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>HTTPS encryption for all data in transit</li>
              <li>
                Row-level security in our database (your data is isolated)
              </li>
              <li>No sharing or selling of personal data</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong className="text-white/90">Access:</strong> Request a
                copy of your data
              </li>
              <li>
                <strong className="text-white/90">Delete:</strong> Request
                deletion of your account and all data
              </li>
              <li>
                <strong className="text-white/90">Export:</strong> Download your
                reflection history
              </li>
              <li>
                <strong className="text-white/90">Correct:</strong> Update
                inaccurate information
              </li>
            </ul>
            <p className="mt-4">
              To exercise these rights, email us at{" "}
              <a
                href="mailto:privacy@machinemind.io"
                className="text-white/90 underline"
              >
                privacy@machinemind.io
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Important Disclaimer
            </h2>
            <p className="text-white/60 italic">
              The Mirror is a tool for self-reflection, not therapy. It is not a
              substitute for professional mental health care. If you are in
              crisis, please contact a mental health professional or crisis
              helpline immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Contact
            </h2>
            <p>
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:privacy@machinemind.io"
                className="text-white/90 underline"
              >
                privacy@machinemind.io
              </a>
            </p>
          </section>

          <section className="pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm">
              MachineMind Consulting
              <br />
              Built with care for your privacy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
