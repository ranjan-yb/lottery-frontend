import { useState, useEffect, useCallback } from "react";

const useWalletBalance = () => {

    const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/game/wallet/deposit`, {   /// api
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch balance");
      }

      const user = await res.json();
      setBalance(user.deposit || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
};

export default useWalletBalance;
