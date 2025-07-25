import React from 'react';
import { UnifiedModal } from './UnifiedModal';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
}

interface DealerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
}

interface ContactDealerModalProps {
  visible: boolean;
  onClose: () => void;
  car: Car;
  dealerInfo?: DealerInfo;
}

export const ContactDealerModal: React.FC<ContactDealerModalProps> = ({
  visible,
  onClose,
  car,
  dealerInfo,
}) => {
  return (
    <UnifiedModal
      visible={visible}
      onClose={onClose}
      variant="default"
      title="Contact Dealer"
      subtitle={`${car.year} ${car.make} ${car.model}`}
      showHeader={true}
      size="medium"
    >
      <div style={{ padding: '20px' }}>
        <p>Contact the dealer about this vehicle:</p>
        <h4>{car.year} {car.make} {car.model}</h4>
        <p>Price: ${car.price.toLocaleString()}</p>
        
        {dealerInfo && (
          <div style={{ marginTop: '20px' }}>
            <h5>Dealer Information:</h5>
            <p><strong>Name:</strong> {dealerInfo.name}</p>
            <p><strong>Phone:</strong> {dealerInfo.phone}</p>
            <p><strong>Email:</strong> {dealerInfo.email}</p>
            <p><strong>Address:</strong> {dealerInfo.address}</p>
            <p><strong>Hours:</strong> {dealerInfo.hours}</p>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <label>
            Your Message:
            <textarea 
              style={{ 
                width: '100%', 
                height: '100px', 
                marginTop: '8px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="I'm interested in this vehicle..."
            />
          </label>
        </div>
      </div>
    </UnifiedModal>
  );
};
