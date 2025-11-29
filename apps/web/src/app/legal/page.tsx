import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Legal Information</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
            <div className="bg-muted rounded-lg p-6">
              <p><strong>Legal Entity:</strong> Twinarklabs LLP</p>
              <p><strong>Product Name:</strong> FlashInvite</p>
              <p><strong>Registered Address:</strong> Kochi, Kerala, India</p>
              <p><strong>Country of Registration:</strong> India</p>
              <p><strong>Email:</strong>{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> +91 8304895463</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Legal Documents</h2>
            <p>
              FlashInvite operates under a comprehensive legal framework designed to protect both our users and 
              our business. Please review the following documents to understand your rights and obligations:
            </p>
            
            <div className="grid gap-4 mt-6">
              <Link 
                href="/terms-and-conditions" 
                className="block p-6 border border-border rounded-lg hover:border-primary transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-muted-foreground">
                  Outlines the rules and regulations for using the FlashInvite platform, including user 
                  responsibilities, acceptable use policies, and service terms.
                </p>
              </Link>

              <Link 
                href="/privacy-policy" 
                className="block p-6 border border-border rounded-lg hover:border-primary transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">Privacy Policy</h3>
                <p className="text-muted-foreground">
                  Describes how we collect, use, share, and protect your personal information in compliance 
                  with data protection laws.
                </p>
              </Link>

              <Link 
                href="/refund-and-cancellation" 
                className="block p-6 border border-border rounded-lg hover:border-primary transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">Refund & Cancellation Policy</h3>
                <p className="text-muted-foreground">
                  Details the terms and conditions for subscription cancellations and refund requests.
                </p>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Compliance and Regulations</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">Indian Laws</h3>
            <p>FlashInvite complies with the following Indian regulations:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Information Technology Act, 2000:</strong> Governs electronic commerce and digital signatures</li>
              <li><strong>Information Technology (Reasonable Security Practices) Rules, 2011:</strong> 
                Mandates data protection and privacy measures</li>
              <li><strong>Payment and Settlement Systems Act, 2007:</strong> Regulates payment processing</li>
              <li><strong>Consumer Protection Act, 2019:</strong> Protects consumer rights in e-commerce</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">International Standards</h3>
            <p>We also follow international best practices including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>GDPR principles for European users</li>
              <li>Industry-standard security protocols and encryption</li>
              <li>PCI DSS compliance for payment processing</li>
              <li>ISO 27001 information security management principles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p>
              All content, features, and functionality of the FlashInvite platform, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Software code and architecture</li>
              <li>Design elements and user interface</li>
              <li>Trademarks, logos, and brand assets</li>
              <li>Documentation and marketing materials</li>
            </ul>
            <p className="mt-4">
              are owned by Twinarklabs LLP and protected by Indian and international copyright, trademark, 
              and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">Jurisdiction</h3>
            <p>
              Any disputes arising from the use of FlashInvite shall be subject to the exclusive jurisdiction 
              of the courts in Kochi, Kerala, India.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Arbitration</h3>
            <p>
              Before pursuing legal action, parties agree to attempt resolution through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Direct negotiation with our support team</li>
              <li>Mediation if informal resolution fails</li>
              <li>Arbitration under the Indian Arbitration and Conciliation Act, 1996</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Liability and Disclaimers</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">Service Disclaimer</h3>
            <p>
              FlashInvite is provided "as is" without warranties of any kind, either express or implied. 
              We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Uninterrupted or error-free service</li>
              <li>Specific results or outcomes from using the platform</li>
              <li>Compatibility with all devices or systems</li>
              <li>Accuracy of third-party integrations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Twinarklabs LLP shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages arising from your use of FlashInvite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p>
              FlashInvite integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Telegram API for bot functionality</li>
              <li>Payment processors for transaction handling</li>
              <li>Cloud hosting providers for infrastructure</li>
              <li>Analytics and monitoring services</li>
            </ul>
            <p className="mt-4">
              These third-party services have their own terms and privacy policies. We are not responsible 
              for their practices or content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Protection Officer</h2>
            <p>
              For data protection inquiries, privacy concerns, or to exercise your data rights, contact our 
              Data Protection Officer:
            </p>
            <div className="bg-muted rounded-lg p-6 mt-4">
              <p><strong>Email:</strong>{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> +91 8304895463</p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Reporting Violations</h2>
            <p>
              If you become aware of any violations of our Terms of Service, illegal activities, or security 
              concerns, please report them immediately:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>General Violations:</strong> flashinvitebot@gmail.com</li>
              <li><strong>Security Issues:</strong> Mark email subject with "URGENT - SECURITY"</li>
              <li><strong>Abuse Reports:</strong> Include detailed information and evidence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Updates to Legal Documents</h2>
            <p>
              We may update our legal documents from time to time. Material changes will be communicated through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Email notifications to registered users</li>
              <li>Prominent notices on our platform</li>
              <li>In-app notifications through our bots</li>
            </ul>
            <p className="mt-4">
              Continued use of FlashInvite after changes constitutes acceptance of updated terms.
            </p>
          </section>

          <section className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-2">Questions?</h3>
            <p>
              If you have questions about any of our legal documents or policies, please don't hesitate to 
              contact us at{' '}
              <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                flashinvitebot@gmail.com
              </a>. We're here to help clarify any concerns.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last Updated: November 29, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
