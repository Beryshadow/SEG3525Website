import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../utilities/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white p-6 text-center">
      <SEO 
        title="404 - Page Not Found" 
        description="The page you are looking for does not exist on Ryan Beland's portfolio website. Return to the home page to find active projects and portals." 
        canonicalUrl="https://ryanbeland.ca/404"
      />
      <div 
        style={{
          boxShadow: 'inset 4px 4px 8px #070a0e, inset -4px -4px 8px #131820',
          borderRadius: '20px',
          padding: '40px',
          backgroundColor: '#0d1117'
        }}
        className="max-w-md w-full border border-white/5"
      >
        <h1 
          style={{
            fontSize: '6rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ff4d4d, #f9cb28)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0'
          }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4 text-[#ff4d4d]">Page Not Found</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. 
        </p>
        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            backgroundColor: '#ff4d4d',
            color: '#white',
            fontWeight: 'bold',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(255, 77, 77, 0.4)',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
          className="hover:scale-105"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
