import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './context/AuthContext';

const KITCHEN_PAIRING_KEY = 'kitchen_pairing_token';

export default function KitchenPair() {
  const [pairingToken, setPairingToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const cleanedToken = pairingToken.trim();
      const response = await api.post('/auth/kitchen/authorize', {
        pairingToken: cleanedToken,
      });

      localStorage.setItem(KITCHEN_PAIRING_KEY, cleanedToken);
      await login(response.data.access_token, response.data.user, 'kitchen');
      navigate('/kitchen');
    } catch {
      setError('Pairing failed. Verify the token and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-[#0b1b3d] mb-2">Kitchen Pairing</h1>
        <p className="text-slate-500 mb-8">Enter the pairing token generated from dashboard terminal settings.</p>

        <form onSubmit={onSubmit} className="space-y-5">
          {error ? <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-rose-700">{error}</div> : null}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pairing Token
            </label>
            <input
              value={pairingToken}
              onChange={(event) => setPairingToken(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400"
              placeholder="Paste token"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0b1b3d] py-3 text-white font-black uppercase tracking-wide disabled:opacity-70"
          >
            {submitting ? 'Pairing...' : 'Authorize Kitchen'}
          </button>
        </form>
      </div>
    </div>
  );
}
