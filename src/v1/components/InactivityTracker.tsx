// src/components/TestModalButton.tsx
import { useState } from 'react';
import Modal from './ui/Modal';

export default function TestModalButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Add this button somewhere in your layout */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
      >
        🧪 Test Modal
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="🧪 Manual Test Modal"
        className="max-w-md"
      >
        <div className="text-center p-6">
          <img 
            src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png" 
            alt="ORG Logo" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-green-600 mb-2">
            ✅ Modal Works!
          </h3>
          <p className="text-gray-600 mb-4">
            If you can see this, the modal component is working.
          </p>
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}