import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              This Privacy Policy describes how FlashInvite ("we," "our," or "us"), operated by Twinarklabs LLP, 
              a company registered in India, collects, uses, shares, and protects your personal information when 
              you use our Telegram-based user membership platform accessible via our website{' '}
              <a href="https://www.flash-invite.com" className="text-primary hover:underline">
                https://www.flash-invite.com
              </a>{' '}
              and related services (collectively, the "Platform").
            </p>
            <p>
              While our company is based in India, we serve users globally. This policy complies with Information 
              Technology Act, 2000 and incorporates international best practices for data protection. By using our 
              Platform, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
            <p>
              We are committed to protecting your privacy and ensuring transparency in how we handle your data. 
              This policy explains your rights and our obligations regarding your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> User ID, username, profile information</li>
              <li><strong>Contact Information:</strong> Email address, phone number (when provided)</li>
              <li><strong>Payment Information:</strong> Payment method details, transaction history, billing information</li>
              <li><strong>Group/Channel Data:</strong> Admin details, member counts, subscription information</li>
              <li><strong>Communication Data:</strong> Messages with our support team, feedback, and inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Usage and Technical Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform usage analytics and interaction patterns</li>
              <li>Device information, IP addresses, browser type</li>
              <li>Log files, cookies, and similar tracking technologies</li>
              <li>Performance metrics and error reports</li>
              <li>Geographic location data (country/region level)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Content and Activity Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Group/channel content metadata (not the actual content)</li>
              <li>Subscription and membership activity</li>
              <li>Revenue and transaction analytics</li>
              <li>User engagement metrics</li>
            </ul>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2">Security Notice:</h4>
              <p>
                FlashInvite will never ask for your password, bank account passwords, or other sensitive credentials 
                via email, phone, or any other communication method. If you receive such requests, please report them 
                immediately to our security team at{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Service Provision</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate group/channel monetization and access management</li>
              <li>Process payments and manage subscriptions</li>
              <li>Provide customer support and technical assistance</li>
              <li>Deliver platform features including bots, analytics, and reporting</li>
              <li>Manage user accounts and authentication</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Platform Improvement</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Develop new features and improve existing ones</li>
              <li>Conduct research and analytics for platform optimization</li>
              <li>Generate anonymized insights and reports</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Legal and Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Detect and prevent fraud, abuse, and illegal activities</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Protect our rights, property, and user safety</li>
              <li>Enforce our Terms of Service and platform policies</li>
              <li>Respond to legal requests and court orders</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processors and financial institutions</li>
              <li>Cloud hosting and data storage providers</li>
              <li>Analytics and monitoring services</li>
              <li>Customer support and communication tools</li>
              <li>Security and fraud prevention services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Legal Requirements</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>When required by laws of India or international legal obligations</li>
              <li>To respond to valid legal processes, subpoenas, or court orders</li>
              <li>To protect against fraud, abuse, or illegal activities</li>
              <li>To safeguard the rights, property, or safety of our users and the public</li>
              <li>In connection with law enforcement investigations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the 
              acquiring entity, subject to the same privacy protections.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security and Protection</h2>
            <p>We implement comprehensive security measures to protect your personal information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard protocols</li>
              <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
              <li><strong>Regular Audits:</strong> Periodic security assessments and vulnerability testing</li>
              <li><strong>Secure Infrastructure:</strong> Use of secure cloud providers with compliance certifications</li>
              <li><strong>Employee Training:</strong> Regular security training for all team members</li>
              <li><strong>Incident Response:</strong> Established procedures for handling security incidents</li>
            </ul>
            <p className="mt-4">
              While we implement robust security measures, no system is completely secure. Users are responsible for 
              maintaining the security of their accounts and should report any suspicious activity immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p>
              As we serve users globally while being based in India, your data may be processed and stored in India 
              or other countries where our service providers operate. We ensure that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>All international transfers comply with applicable data protection laws</li>
              <li>Adequate safeguards are in place to protect your data</li>
              <li>Service providers maintain appropriate security standards</li>
              <li>Data processing agreements include privacy protection clauses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                flashinvitebot@gmail.com
              </a>. We will respond to your request within 30 days or as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p>We retain your information for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal information within 90 days, 
              except where retention is required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p>
              Our Platform is not intended for users under 18 years of age. We do not knowingly collect personal 
              information from children under 18. If we become aware that we have collected such information, we 
              will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal 
              requirements, or other factors. We will notify you of material changes through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our Platform</li>
              <li>In-app notifications through our bots</li>
            </ul>
            <p className="mt-4">
              Your continued use of our Platform after the effective date of changes constitutes acceptance of the 
              updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="bg-muted rounded-lg p-6 mt-4">
              <h3 className="text-lg font-semibold mb-3">Data Protection Officer</h3>
              <p><strong>Company:</strong> Twinarklabs LLP</p>
              <p><strong>Product:</strong> FlashInvite</p>
              <p><strong>Address:</strong> Kochi, Kerala, India</p>
              <p><strong>Email:</strong>{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> +91 8304895463</p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
            <p className="mt-4">
              <strong>For International Users:</strong> If you are located outside India and have privacy concerns 
              or complaints, you may also contact your local data protection authority.
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
