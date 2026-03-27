"use client";

import Head from 'next/head';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <>
      <Head>
        <title>Offline - QuizWeb</title>
        <meta name="description" content="You're currently offline. Some features may not be available." />
      </Head>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          📱
        </div>
        
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          You&apos;re Offline
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          It looks like you&apos;ve lost your internet connection. Some features may not be available until you&apos;re back online.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            Try Again
          </button>
          
          <Link href="/" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}>
            Go to Homepage
          </Link>
        </div>
        
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <p style={{ margin: 0 }}>
            <strong>Note:</strong> Your quiz progress and favorites will be synced when you're back online.
          </p>
        </div>
      </div>
    </>
  );
}
