import Link from 'next/link';

export default function RefundAndCancellationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Refund & Cancellation Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p>
              This Refund and Cancellation Policy outlines the terms and conditions for subscription cancellations 
              and refund requests for FlashInvite services, operated by Twinarklabs LLP. We are committed to 
              providing fair and transparent policies for our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Subscription Cancellation</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">How to Cancel</h3>
            <p>You can cancel your subscription at any time through:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your account dashboard on the FlashInvite platform</li>
              <li>Contacting our support team at{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Cancellation Terms</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellations take effect at the end of your current billing period</li>
              <li>You will retain access to paid features until the end of the billing period</li>
              <li>No partial refunds are provided for unused time in the current billing period</li>
              <li>Recurring billing will stop after the current period ends</li>
              <li>You can reactivate your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Policy</h2>

            <h3 className="text-xl font-semibold mb-3 mt-4">Eligibility for Refunds</h3>
            <p>Refunds may be granted in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Technical Issues:</strong> If our platform experiences significant technical problems 
                that prevent you from using the service for an extended period</li>
              <li><strong>Duplicate Charges:</strong> If you were charged multiple times for the same subscription</li>
              <li><strong>Unauthorized Charges:</strong> If charges were made without your authorization</li>
              <li><strong>Service Not Delivered:</strong> If you paid for services that were not provided</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Non-Refundable Items</h3>
            <p>The following are generally not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Partial month or unused subscription time after cancellation</li>
              <li>Change of mind or dissatisfaction with features</li>
              <li>Violation of Terms of Service resulting in account termination</li>
              <li>Services already rendered or consumed</li>
              <li>Third-party payment processing fees</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Refund Request Process</h3>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Contact our support team at{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </li>
              <li>Provide your account details and transaction information</li>
              <li>Explain the reason for your refund request</li>
              <li>Include any relevant documentation or screenshots</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3 mt-6">Refund Processing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests are reviewed within 5-7 business days</li>
              <li>Approved refunds are processed within 10-14 business days</li>
              <li>Refunds are issued to the original payment method</li>
              <li>You will receive email confirmation once the refund is processed</li>
              <li>Bank processing times may vary and are beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Member Subscription Refunds</h2>
            <p>
              For members who have paid to join a group or channel through FlashInvite:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Refund policies are set by individual group/channel administrators</li>
              <li>Contact the group/channel administrator directly for refund requests</li>
              <li>FlashInvite facilitates payment processing but does not control refund decisions</li>
              <li>Disputes should be resolved between members and administrators</li>
              <li>FlashInvite may mediate disputes in cases of fraud or Terms violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Administrator Revenue and Payouts</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">Payout Cancellation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scheduled payouts can be cancelled before processing begins</li>
              <li>Once processing starts, payouts cannot be cancelled</li>
              <li>Contact support immediately if you need to cancel a payout</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Refund Impact on Revenue</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Member refunds will be deducted from administrator revenue</li>
              <li>Platform fees are not refunded for refunded transactions</li>
              <li>Administrators are responsible for managing their refund policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Chargebacks and Disputes</h2>
            <p>
              If you initiate a chargeback with your payment provider:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your account may be suspended pending investigation</li>
              <li>We encourage contacting us first to resolve issues</li>
              <li>Chargebacks may result in additional fees</li>
              <li>Fraudulent chargebacks may result in account termination</li>
              <li>We will provide documentation to payment providers as needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Special Circumstances</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">Service Discontinuation</h3>
            <p>
              If FlashInvite discontinues its services:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>We will provide advance notice when possible</li>
              <li>Pro-rated refunds may be offered for prepaid subscriptions</li>
              <li>Data export options will be provided</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Force Majeure</h3>
            <p>
              We are not liable for refunds due to circumstances beyond our control, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Natural disasters</li>
              <li>Government actions or regulations</li>
              <li>Internet service provider failures</li>
              <li>Third-party service disruptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Currency and Exchange Rates</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds are processed in the original transaction currency</li>
              <li>Exchange rate fluctuations are not grounds for additional refunds</li>
              <li>Currency conversion fees are the responsibility of the user</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Policy Updates</h2>
            <p>
              We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be 
              communicated through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Email notification to registered users</li>
              <li>Prominent notice on our platform</li>
              <li>In-app notifications</li>
            </ul>
            <p className="mt-4">
              Continued use of the platform after policy changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              For cancellation or refund inquiries, please contact us:
            </p>
            <div className="bg-muted rounded-lg p-6 mt-4">
              <p><strong>Company:</strong> Twinarklabs LLP</p>
              <p><strong>Product:</strong> FlashInvite</p>
              <p><strong>Email:</strong>{' '}
                <a href="mailto:flashinvitebot@gmail.com" className="text-primary hover:underline">
                  flashinvitebot@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> +91 8304895463</p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          <section className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p>
              If you have questions about cancellations or refunds, our support team is here to help. 
              We're committed to resolving issues fairly and promptly.
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
