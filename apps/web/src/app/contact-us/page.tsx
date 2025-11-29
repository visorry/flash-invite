import Link from 'next/link';

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-lg">
            We're here to help! If you have any questions, concerns, or feedback about FlashInvite, 
            please don't hesitate to reach out to us.
          </p>

          <section className="bg-muted rounded-lg p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                <p><strong>Company:</strong> Twinarklabs LLP</p>
                <p><strong>Product:</strong> FlashInvite</p>
                <p><strong>Location:</strong> Kochi, Kerala, India</p>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-2">Contact Details</h3>
                <p className="mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                    flashinvitebot@gmail.com
                  </a>
                </p>
                <p className="mb-2">
                  <strong>Phone:</strong>{' '}
                  <a href="tel:+918304895463" className="text-primary hover:underline">
                    +91 8304895463
                  </a>
                </p>
                <p>
                  <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">What Can We Help You With?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Technical support and troubleshooting</li>
              <li>Account and billing inquiries</li>
              <li>Feature requests and feedback</li>
              <li>Privacy and data protection questions</li>
              <li>Partnership and business opportunities</li>
              <li>Security concerns and incident reporting</li>
            </ul>
          </section>

          <section className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-2">Security Notice</h3>
            <p>
              FlashInvite will never ask for your password, bank account passwords, or other sensitive 
              credentials via email, phone, or any other communication method. If you receive such requests, 
              please report them immediately to our security team at{' '}
              <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                flashinvitebot@gmail.com
              </a>.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Response Time</h2>
            <p>
              We strive to respond to all inquiries within 24-48 hours during business days. For urgent 
              security matters, please mark your email subject with "URGENT - SECURITY" for priority handling.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">For International Users</h2>
            <p>
              While our company is based in India, we serve users globally. If you are located outside India 
              and have specific concerns related to data protection in your region, you may also contact your 
              local data protection authority.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
