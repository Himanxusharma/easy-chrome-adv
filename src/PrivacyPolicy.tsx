import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Collection</h2>
        <p className="mb-4">We store the following data locally on your device:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Passwords (encrypted)</li>
          <li>Notes</li>
          <li>Auto-refresh settings</li>
          <li>Archived tabs</li>
          <li>Daily URLs</li>
        </ul>
        <p className="mb-4">No data is sent to external servers. All data is stored using Chrome's local storage.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Permissions</h2>
        <p className="mb-2">We use the following permissions:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>activeTab</strong>: Required for features like screenshot and PiP</li>
          <li><strong>browsingData</strong>: Required for hard refresh functionality</li>
          <li><strong>cookies</strong>: Required for hard refresh functionality</li>
          <li><strong>storage</strong>: Required to store settings and notes</li>
          <li><strong>tabCapture</strong>: Required for screenshot functionality</li>
          <li><strong>scripting</strong>: Required for features like PiP and tab locking</li>
          <li><strong>clipboardWrite</strong>: Required for URL shortening</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Usage</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>All data is used only within the extension</li>
          <li>No data is shared with third parties</li>
          <li>You can clear all stored data at any time</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@ootmlab.com</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy; 