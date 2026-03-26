import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — The Mirror",
  description: "Terms and conditions for using The Mirror.",
};

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p className="text-white/40 mb-12 text-sm">
          Last updated: March 26, 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Agreement to Terms
            </h2>
            <p>
              By using The Mirror, you agree to these terms. If you disagree
              with any part, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              What The Mirror Is
            </h2>
            <p>
              The Mirror is an AI-powered self-reflection tool. It asks
              questions designed to help you see your own blind spots. It does
              not provide advice, therapy, or professional guidance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              What The Mirror Is NOT
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mt-4">
              <p className="text-white/90 font-medium mb-3">
                Important Disclaimer:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The Mirror is <strong>NOT</strong> a replacement for therapy
                  or professional mental health care
                </li>
                <li>
                  The Mirror is <strong>NOT</strong> a crisis intervention
                  service
                </li>
                <li>
                  The Mirror is <strong>NOT</strong> providing medical or
                  psychological advice
                </li>
                <li>
                  The Mirror is <strong>NOT</strong> a diagnostic tool
                </li>
              </ul>
              <p className="mt-4 text-white/60 italic">
                If you are experiencing a mental health crisis, please contact a
                professional immediately. In the US, call or text 988 for the
                Suicide & Crisis Lifeline. In Colombia, call Línea de la Vida:
                800-911-2000.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Acceptable Use
            </h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Use The Mirror for personal self-reflection only</li>
              <li>Not attempt to bypass rate limits or security measures</li>
              <li>
                Not use The Mirror to generate harmful, illegal, or abusive
                content
              </li>
              <li>
                Not reverse-engineer, copy, or replicate the system prompts or
                AI behavior
              </li>
              <li>Not use The Mirror if you are under 18 years old</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Intellectual Property
            </h2>
            <p>
              The Mirror, including its design, code, prompts, and branding, is
              owned by MachineMind Consulting. Your reflections and the
              questions generated for you remain yours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              API Access
            </h2>
            <p>
              The Mirror Protocol API is available for licensed integration
              partners. Unauthorized API access is prohibited. Contact us for
              licensing inquiries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Limitation of Liability
            </h2>
            <p>
              The Mirror is provided "as is" without warranties of any kind.
              MachineMind Consulting is not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Any decisions you make based on using The Mirror</li>
              <li>Emotional distress from self-reflection</li>
              <li>Service interruptions or data loss</li>
              <li>Actions of third-party services (Anthropic, OpenAI, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Changes to Terms
            </h2>
            <p>
              We may update these terms at any time. Continued use of The Mirror
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-['Cormorant_Garamond',Georgia,serif] text-white/90 mb-4">
              Contact
            </h2>
            <p>
              Questions about these terms? Contact us at{" "}
              <a
                href="mailto:legal@machinemind.io"
                className="text-white/90 underline"
              >
                legal@machinemind.io
              </a>
            </p>
          </section>

          <section className="pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm">
              MachineMind Consulting
              <br />© 2026 All rights reserved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
