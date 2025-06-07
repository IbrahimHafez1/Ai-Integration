import './Google.css';

const GoogleLoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/google`;
  };

  return (
    <div className="google-login-container">
      <div className="google-login-box">
        <h2 className="google-login-title">Welcome to Dragify</h2>
        <p className="google-login-subtitle"></p>
        <button className="google-login-button" onClick={handleGoogleLogin}>
          Connect with Google
        </button>
      </div>
    </div>
  );
};

export default GoogleLoginPage;
