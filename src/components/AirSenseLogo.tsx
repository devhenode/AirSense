import React from 'react';

interface AirSenseLogoProps {
  className?: string;
  onClick?: () => void;
}

const AirSenseLogo: React.FC<AirSenseLogoProps> = ({ className = "h-19", onClick }) => {
  return (
    <img 
      src="/airsense-logo.png" 
      alt="AirSense" 
      className={className}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    />
  );
};

export default AirSenseLogo;