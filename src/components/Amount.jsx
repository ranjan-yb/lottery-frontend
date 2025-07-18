import { useState } from "react";

export default function Amount({ onCancel, onConfirm }) {
  const [balance, setBalance] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  // const [agreed, setAgreed] = useState(false);

  const balances = [1, 10, 100, 1000];
  const multipliers = [1, 5, 10, 20, 50, 100];

  const total = balance * quantity * multiplier;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow-lg space-y-4 font-sans  bottom-0 top-0">
      <h1 className="text-xl font-bold text-center text-teal-300">WinAll 30sec</h1>

      {/* Balance Selection */}
      <div>
        <label className="font-semibold text-teal-300">Balance:</label>
        <div className="flex gap-2 mt-2">
          {balances.map((b) => (
            <button
              key={b}
              onClick={() => setBalance(b)}
              className={`px-3 py-1 rounded ${
                balance === b ? "bg-blue-500 text-white" : "bg-gray-400"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div>
        <label className="font-semibold text-teal-300">Quantity:</label>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            -
          </button>
          <span className="font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1 bg-gray-400 rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Multiplier Selection */}
      <div>
        <label className="font-semibold text-teal-300">Multiplier:</label>
        <div className="flex gap-2 mt-2">
          {multipliers.map((m) => (
            <button
              key={m}
              onClick={() => setMultiplier(m)}
              className={`px-3 py-1 rounded ${
                multiplier === m ? "bg-green-500 text-white" : "bg-gray-400"
              }`}
            >
              X{m}
            </button>
          ))}
        </div>
      </div>

      {/* Checkbox */}
      {/* <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="w-4 h-4"
        />
        {/* <label>
          I agree to{" "}
          <span className="text-blue-600 underline">Pre-sale rules</span>
        </label> */}
      {/* </div> */} 

      {/* Cancel + Total */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="text-lg font-bold bg-black p-4 text-white"
          onClick={() => onConfirm(total)}
        >
          Total amount ₹{total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
