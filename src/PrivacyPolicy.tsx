import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Easy Chrome Extension Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-6">Last updated: April 2024</p>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
        <p className="mb-4">
          This Privacy Policy describes how Easy Chrome ("we", "our", or "us") handles your information when you use our Chrome extension. 
          We are committed to protecting your privacy and ensuring transparency about our data practices.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Data Collection and Storage</h2>
        <p className="mb-4">We store the following data locally on your device using Chrome's local storage:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Encrypted passwords (for tab locking feature only)</li>
          <li>Notes and annotations</li>
          <li>Auto-refresh settings and intervals</li>
          <li>Archived tabs information</li>
          <li>Daily URLs list</li>
          <li>Tab activity timestamps</li>
        </ul>
        <p className="mb-4">All data is stored locally and never transmitted to external servers.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Data We Do Not Collect</h2>
        <p className="mb-4">We explicitly do not collect:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Personally identifiable information (name, email, address, etc.)</li>
          <li>Browsing history or web content</li>
          <li>Financial or payment information</li>
          <li>Location data</li>
          <li>Health information</li>
          <li>Personal communications</li>
          <li>User activity logs</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. External Services</h2>
        <p className="mb-4">The extension uses the following external services:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>TinyURL</strong>: Only the URL you want to shorten is sent to their service</li>
          <li><strong>Supabase</strong>: Used only for optional feedback submission (if you choose to provide it)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Required Permissions</h2>
        <p className="mb-2">We use the following Chrome permissions:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>activeTab</strong>: For accessing current tab content and URL</li>
          <li><strong>browsingData</strong>: For hard refresh functionality</li>
          <li><strong>cookies</strong>: For hard refresh functionality</li>
          <li><strong>storage</strong>: For local data storage</li>
          <li><strong>tabCapture</strong>: For screenshot functionality</li>
          <li><strong>scripting</strong>: For tab management features</li>
          <li><strong>clipboardWrite</strong>: For URL shortening feature</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Data Usage</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>All data is used only within the extension</li>
          <li>No data is shared with third parties (except for URL shortening)</li>
          <li>You can clear all stored data at any time using the "Clear Data" feature</li>
          <li>Data is not used for advertising or analytics</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Security</h2>
        <p className="mb-4">
          We implement appropriate security measures to protect your data:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>All data is stored locally on your device</li>
          <li>Passwords are encrypted before storage</li>
          <li>No sensitive data is transmitted over the network</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
          on this page and updating the "Last updated" date.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          <br />
          Email: support@ootmlab.com
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy; 