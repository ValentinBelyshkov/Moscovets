import React from 'react';
import BiometryApp from '../components/BiometryApp';
import '../components/BiometryApp.css';

const BiometryPage: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <BiometryApp />
    </div>
  );
};

export default BiometryPage;