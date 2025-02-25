import * as React from 'react';

interface EmailTemplateProps {
  email: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  email,
}) => {
  // Add null check and default value
  const username = typeof email === 'string' ? email.split('@')[0] : 'there';

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}>
        <img
          src="https://holo.deepanshumishra.me/logo.png"
          alt="holo.ai"
          style={{
            width: '120px',
            marginBottom: '24px'
          }}
        />

        <h1 style={{
          color: '#111827',
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '16px',
        }}>
          Welcome to the holo.ai waitlist, {username}!
        </h1>

        <p style={{
          color: '#4B5563',
          fontSize: '16px',
          lineHeight: '24px',
          marginBottom: '24px',
        }}>
          Thanks for joining our waitlist! We're thrilled to have you as one of our early supporters.
          You're now among the first to experience the future of AI chat.
        </p>

        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            color: '#111827',
            fontSize: '18px',
            fontWeight: '500',
            marginBottom: '12px',
          }}>
            What's next?
          </h2>
          <ul style={{
            color: '#4B5563',
            fontSize: '16px',
            lineHeight: '24px',
            margin: '0',
            paddingLeft: '20px',
          }}>
            <li>We'll notify you when early access becomes available</li>
            <li>You'll be among the first to create and chat with AI characters</li>
            <li>Get exclusive updates about our development progress</li>
          </ul>
        </div>

        <p style={{
          color: '#4B5563',
          fontSize: '16px',
          lineHeight: '24px',
          marginBottom: '32px',
        }}>
          In the meantime, follow us on Twitter <a href="https://twitter.com/DeepanshuDipxsy" style={{ color: '#2563EB', textDecoration: 'none' }}>@DeepanshuDipxsy</a> for
          the latest updates and behind-the-scenes content.
        </p>

        <div style={{
          borderTop: '1px solid #E5E7EB',
          paddingTop: '24px',
          color: '#6B7280',
          fontSize: '14px',
          textAlign: 'center' as const,
        }}>
          <p style={{ margin: '0 0 8px' }}>
            holo.ai - Chat with your favorite characters
          </p>
          <p style={{ margin: '0' }}>
            Made with ❤️ by Deepanshu Mishra
          </p>
        </div>
      </div>
    </div>
  );
};
