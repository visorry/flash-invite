import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using FlashInvite ("Platform"), operated by Twinarklabs LLP, you accept and agree 
              to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use 
              our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p>
              FlashInvite is a Telegram-based user membership platform that enables group and channel administrators 
              to monetize their communities through subscription-based access management. Our services include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Time-limited invite link generation</li>
              <li>Automated member management and access control</li>
              <li>Payment processing and subscription management</li>
              <li>Analytics and reporting tools</li>
              <li>Bot integration for Telegram groups and channels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
            <p>
              You must be at least 18 years old to use our Platform. By using FlashInvite, you represent and 
              warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Account Registration and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">Subscription Fees</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees are charged based on the plan you select</li>
              <li>All fees are exclusive of applicable taxes unless stated otherwise</li>
              <li>Payment is processed through our secure payment partners</li>
              <li>Fees are non-refundable except as specified in our Refund Policy</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">Revenue Sharing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Group/channel administrators earn revenue from member subscriptions</li>
              <li>Platform fees and payment processing charges apply as per your plan</li>
              <li>Payouts are processed according to the schedule specified in your account</li>
              <li>Minimum payout thresholds may apply</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Distribute spam, malware, or harmful content</li>
              <li>Engage in fraudulent activities or payment manipulation</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Attempt unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Content and Intellectual Property</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">Your Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain ownership of content you create and share through the Platform</li>
              <li>You grant us a license to use your content to provide and improve our services</li>
              <li>You are responsible for ensuring you have rights to any content you share</li>
              <li>We may remove content that violates these Terms or applicable laws</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">Our Intellectual Property</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Platform, including its design, features, and code, is owned by Twinarklabs LLP</li>
              <li>Our trademarks, logos, and brand elements are protected intellectual property</li>
              <li>You may not copy, modify, or distribute our intellectual property without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p>
              Your use of the Platform is also governed by our Privacy Policy. We collect, use, and protect your 
              personal information in accordance with applicable data protection laws, including the Information 
              Technology Act, 2000 of India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Service Availability and Modifications</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We strive to maintain high availability but do not guarantee uninterrupted service</li>
              <li>We may modify, suspend, or discontinue features with or without notice</li>
              <li>Scheduled maintenance will be communicated in advance when possible</li>
              <li>We are not liable for service interruptions or data loss</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Twinarklabs LLP and its affiliates shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages resulting from unauthorized access to your account</li>
              <li>Content or conduct of third parties on the Platform</li>
              <li>Service interruptions or technical failures</li>
            </ul>
            <p className="mt-4">
              Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Twinarklabs LLP, its officers, directors, employees, and 
              agents from any claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of third parties</li>
              <li>Your content or conduct on the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p>
              We may suspend or terminate your account and access to the Platform at our discretion, with or 
              without notice, for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activities</li>
              <li>Extended periods of inactivity</li>
              <li>Non-payment of fees</li>
            </ul>
            <p className="mt-4">
              Upon termination, your right to use the Platform ceases immediately. We may delete your data in 
              accordance with our data retention policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">Governing Law</h3>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive 
              jurisdiction of the courts in Kochi, Kerala, India.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">Dispute Resolution Process</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact us first to resolve disputes informally</li>
              <li>If informal resolution fails, disputes may be subject to arbitration</li>
              <li>Arbitration shall be conducted in accordance with Indian Arbitration and Conciliation Act, 1996</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes 
              through email or prominent notice on the Platform. Your continued use after changes constitutes 
              acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <div className="bg-muted rounded-lg p-6 mt-4">
              <p><strong>Company:</strong> Twinarklabs LLP</p>
              <p><strong>Product:</strong> FlashInvite</p>
              <p><strong>Address:</strong> Kochi, Kerala, India</p>
              <p><strong>Email:</strong>{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> +91 8304895463</p>
            </div>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last Updated: November 29, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
