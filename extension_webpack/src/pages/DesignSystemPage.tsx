import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '../components/ui/Modal';

const colors = [
  { name: 'Primary', hex: '#6200EE', className: 'bg-primary' },
  { name: 'Primary Dark', hex: '#3700B3', className: 'bg-primary-dark' },
  { name: 'Secondary', hex: '#03DAC6', className: 'bg-secondary' },
  { name: 'Secondary Dark', hex: '#018786', className: 'bg-secondary-dark' },
  { name: 'Error', hex: '#B00020', className: 'bg-error' },
  { name: 'Background', hex: '#FFFFFF', className: 'bg-background', border: true },
  { name: 'Surface', hex: '#FFFFFF', className: 'bg-surface', border: true },
];

const grays = [
  { name: 'Gray 50', hex: '#F9FAFB', className: 'bg-gray-50' },
  { name: 'Gray 100', hex: '#F3F4F6', className: 'bg-gray-100' },
  { name: 'Gray 200', hex: '#E5E7EB', className: 'bg-gray-200' },
  { name: 'Gray 300', hex: '#D1D5DB', className: 'bg-gray-300' },
  { name: 'Gray 400', hex: '#9CA3AF', className: 'bg-gray-400' },
  { name: 'Gray 500', hex: '#6B7280', className: 'bg-gray-500' },
  { name: 'Gray 600', hex: '#4B5563', className: 'bg-gray-600' },
  { name: 'Gray 700', hex: '#374151', className: 'bg-gray-700' },
  { name: 'Gray 800', hex: '#1F2937', className: 'bg-gray-800' },
  { name: 'Gray 900', hex: '#111827', className: 'bg-gray-900' },
];

const DesignSystemPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <header className="mb-12">
        <h1 className="text-5xl font-bold text-gray-900">Design System</h1>
        <p className="text-lg text-gray-600 mt-2">A showcase of the new UI components for Job Hunter.</p>
      </header>

      {/* Colors Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b pb-2">Colors</h2>
        <h3 className="text-xl font-medium mb-4 text-gray-700">Main Palette</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
          {colors.map((color) => (
            <div key={color.name} className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-lg shadow-md ${color.className} ${color.border ? 'border border-gray-300' : ''}`} />
              <span className="mt-2 font-semibold text-sm">{color.name}</span>
              <span className="text-xs text-gray-500">{color.hex}</span>
            </div>
          ))}
        </div>
        <h3 className="text-xl font-medium mt-8 mb-4 text-gray-700">Grays</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-4">
          {grays.map((color) => (
            <div key={color.name} className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-lg shadow-md ${color.className}`} />
              <span className="mt-2 font-semibold text-sm">{color.name}</span>
              <span className="text-xs text-gray-500">{color.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b pb-2">Typography</h2>
        <div className="space-y-4">
          <p className="text-5xl font-bold">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-4xl font-semibold">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-3xl font-medium">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-2xl">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-xl">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-lg">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-base">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-xs">The quick brown fox jumps over the lazy dog.</p>
        </div>
      </section>

      {/* Components Section */}
      <section>
        <h2 className="text-3xl font-semibold mb-6 border-b pb-2">Components</h2>

        {/* Button Component */}
        <div className="mb-10">
          <h3 className="text-2xl font-medium mb-4">Button</h3>
          <Card>
            <CardContent className="p-6 flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </CardContent>
          </Card>
        </div>

        {/* Card Component */}
        <div className="mb-10">
          <h3 className="text-2xl font-medium mb-4">Card</h3>
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>This is a description of the card.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Here is the main content of the card. It can contain any elements you need.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Input Component */}
        <div className="mb-10">
          <h3 className="text-2xl font-medium mb-4">Input</h3>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Input placeholder="Standard Input" />
              <Input placeholder="Disabled Input" disabled />
            </CardContent>
          </Card>
        </div>

        {/* Modal Component */}
        <div>
          <h3 className="text-2xl font-medium mb-4">Modal</h3>
          <Card>
            <CardContent className="p-6">
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            </CardContent>
          </Card>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Modal Title</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p>This is the body of the modal. You can put any content here.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemPage;