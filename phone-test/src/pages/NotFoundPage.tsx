import React from 'react';
import { Typography, Button } from '@aircall/tractor';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        padding: '20px',
        borderRadius: '16px',
      }}
    >
      <Typography variant="displayM" color="primary" style={{ marginBottom: '16px' }}>
        Oops! Bad Route
      </Typography>
      <Typography
        variant="body"
        color="secondary"
        style={{ marginBottom: '32px', textAlign: 'center', maxWidth: '400px' }}
      >
        The page you're looking for doesn't exist or was moved. 
      </Typography>
      <Button variant="primary" onClick={() => navigate('/calls')}>
        Go Back to Calls
      </Button>
    </div>
  );
};
