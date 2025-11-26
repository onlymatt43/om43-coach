import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

const VideoPlayer = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [code, setCode] = useState('');
  const [accessUrl, setAccessUrl] = useState('');
  const [error, setError] = useState('');

  const handleValidate = async () => {
    try {
      setError('');
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (data && data.valid) setHasAccess(true);
      else setError('Code invalide ou expiré.');
    } catch (err) {
      setError('Erreur de validation');
    }
  };

  const getAccessForDemo = async () => {
    try {
      setError('');
      // demo video id is 99999 in the original file
      const res = await fetch(`${API_BASE}/api/videos/vid001/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || res.statusText);
      }

      const { accessUrl } = await res.json();
      setAccessUrl(accessUrl.startsWith('http') ? accessUrl : `${API_BASE}${accessUrl}`);
    } catch (err) {
      setError(err.message || 'Failed to get access');
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Visionnement Complet</h2>
      {!hasAccess ? (
        <div>
          <p>Entrez un code d’accès (valable 1h) :</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={handleValidate}>Valider</button>
          {error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
        </div>
      ) : (
        <div>
          {!accessUrl ? (
            <div>
              <button onClick={getAccessForDemo}>Demander l'accès puis jouer</button>
              {error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
            </div>
          ) : (
            <iframe
              src={accessUrl}
          width="640"
          height="360"
          allow="autoplay; fullscreen"
          title="Film Adulte Complet"
        ></iframe>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;