import React, { useState, useEffect } from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import CustomerPortal from './CustomerPortal';
import './styles.css';

function App() {
  // Initialize with a default domain (e.g., 'customer portal' or 'management')
  const [domain, setDomain] = useState<string>('customer portal');
  const [isCustomerPortal, setIsCustomerPortal] = useState<boolean>(true);
  const [isManagement, setIsManagement] = useState<boolean>(false);

  // Unified domain change handler
  const changeUIDomain = (dm: string) => {
    setDomain(dm);
  };

  // Sync boolean flags cleanly whenever 'domain' changes
  useEffect(() => {
    if (domain === 'customer portal') {
      setIsCustomerPortal(true);
      setIsManagement(false);
    } else if (domain === 'management') {
      setIsManagement(true);
      setIsCustomerPortal(false);
    }
  }, [domain]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {isManagement && (
        <ResponsiveLayout domainFunc={changeUIDomain} />
      )}
      {isCustomerPortal && (
        <CustomerPortal domainFunc={changeUIDomain} subdomain="portal" domain="amgreat.id" />
      )}
    </div>
  );
}

export default App;