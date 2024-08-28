import React from 'react';

const CircuitSpinner = () => {
  return (
    <div className="circuit-spinner">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#3498db" strokeWidth="2" />
        <g className="rotating-circuit">
          <path className="circuit-path" d="M50 5 L50 20 M95 50 L80 50 M50 95 L50 80 M5 50 L20 50" stroke="#3498db" strokeWidth="2" strokeLinecap="round" />
          <circle className="circuit-node" cx="50" cy="20" r="3" fill="#3498db" />
          <circle className="circuit-node" cx="80" cy="50" r="3" fill="#3498db" />
          <circle className="circuit-node" cx="50" cy="80" r="3" fill="#3498db" />
          <circle className="circuit-node" cx="20" cy="50" r="3" fill="#3498db" />
        </g>
      </svg>
      <style jsx>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .rotating-circuit {
          animation: rotate 3s linear infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};

export default CircuitSpinner;