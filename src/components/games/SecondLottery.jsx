import React from "react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import Amount from "../Amount";
import useWalletBalance from "../hooks/useWalletBalance";

function SecondLottery() {
  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

   // WALLET
  const { balance, loading, error, refetch } = useWalletBalance();

  const token = localStorage.getItem("token"); // ✅ Retrieve it properly

  const [timeLeft, setTimeLeft] = useState(30);
  const [firstNumber, setFirstNumber] = useState(3);
  const [secondNumber, setSecondNumber] = useState(0);

  const [restart, setRestart] = useState(false);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // USER CHOICES
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [selectedBigSmall, setSelectedBigSmall] = useState(null);

  const selectBigSmallRef = useRef(null);
  const selectedColorRef = useRef(null);
  const selectedNumberRef = useRef(null);

  // user selected AMount
  const bigSmallAmountRef = useRef(null);
  const colorAmountRef = useRef(null);
  const numberAmountRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [bigSmallResultMessage, setBigSmallResultMessage] = useState("");
  const [numberResultMessage, setNumberResultMessage] = useState("");
  const [colorResultMessage, setColorResultMessage] = useState("");

  //amount selected
  const [showAmountBox, setShowAmountBox] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0); // 💰 For backend use

  // LAST SECONDS
  const [left25Sec, setLeft25Sec] = useState(false);

  // pause
  const [isPaused, setIsPaused] = useState(true);

  const lastPayload = useRef(null); // At top of component

  // TO CHECK IF USER PLACED A BET OR NOT
  const betPlacedRef = useRef(false);

  // TO DISABLE BETTING WHEN TIMELEFT <= 5
  const [isSelectionAllowed, setIsSelectionAllowed] = useState(true);

  // TIME REMAINING
  useEffect(() => {
    const str = String(timeLeft).padStart(2, "0");
    setFirstNumber(str[0]);
    setSecondNumber(str[1]);
  }, [timeLeft]);

  // COUNTDOWN FROM BACKEND
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/game/time`)
        .then((res) => res.json())
        .then((data) => {
          setTimeLeft(data.timeLeft); // ← controlled by server
          setIsPaused(data.isPaused);
          // console.log("countdown from backend", data.isPaused);
        })
        .catch((err) => console.error("❌ Timer sync error", err));
    }, 1000); // Sync every second

    return () => clearInterval(interval);
  }, []);

  // restarting
  useEffect(() => {
    if (timeLeft === 0 && !restart) {
      setRestart(true); // trigger 5s pause logic
      setIsTimerRunning(false); // pause countdown UI
    }
  }, [timeLeft, restart]);

  // RESTARTING COUNTDOWN AFTER 5 SECONDS
  useEffect(() => {
    if (!restart) return;

    const timeout = setTimeout(() => {
      handleRoundEnd(); // Clear user selections
      setRestart(false);
      setIsTimerRunning(true); // Resume UI timer if needed
      // Do not setTimeLeft(30) — let backend send correct time
    }, 1000);

    return () => clearTimeout(timeout);
  }, [restart]);

  // FUNCTION FOR RESET SELECTION
  const handleRoundEnd = () => {
    selectBigSmallRef.current = null;
    selectedColorRef.current = null;
    selectedNumberRef.current = null;
    setSelectedColor(null);
    setSelectedNumber(null);
    setSelectedBigSmall(null);

    bigSmallAmountRef.current = null;
    colorAmountRef.current = null;
    numberAmountRef.current = null;

    lastPayload.current = null;

    setLeft25Sec(false);

    resetGameStateBackend();

    betPlacedRef.current = false;
  };

  // user can place bet at any time
  const handlePlaceBet = async () => {
    if (!token) {
      console.error("No token found.");
      return;
    }

    const payload = {};

    if (selectBigSmallRef.current) {
      payload.userBigSmall = selectBigSmallRef.current;
      payload.bigSmallAmount = Number(bigSmallAmountRef.current);
    }

    if (selectedColorRef.current) {
      payload.userColor = selectedColorRef.current;
      payload.colorAmount = Number(colorAmountRef.current);
    }

    if (
      selectedNumberRef.current !== null &&
      selectedNumberRef.current !== undefined
    ) {
      payload.userNumber = selectedNumberRef.current;
      payload.numberAmount = Number(numberAmountRef.current);
    }

    try {
      const res = await fetch(`${API_URL}/api/game/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || data.error || "Bet failed");

      console.log("✅ Bet placed:", data.message || data.msg, payload);

      // Update wallet immediately
      refetch(); // custom hook to get updated wallet

      // Save for /play
      lastPayload.current = payload;
      betPlacedRef.current = true;
    } catch (error) {
      console.log("❌ Error placing bet:", error.message);
    }
  };

  // SEND EMPTY BET WHEN THERE IS NO USER
  const sendEmptyBetToBackend = async () => {
    const payload = {
      last5Sec: true,
      last25Sec: false,
      userBigSmall: null,
      bigSmallAmount: 0,
      userColor: null,
      colorAmount: 0,
      userNumber: null,
      numberAmount: 0,
    };

    console.log("📤 Sending EMPTY bet:", payload);

    try {
      const res = await fetch(`${API_URL}/api/game/play`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("✅ Empty bet recorded:", data);
    } catch (error) {
      console.log("❌ Error sending empty bet:", error);
    }
  };

  // TRIGGER EMPTY BET
  useEffect(() => {
    if (timeLeft === 5 && !betPlacedRef.current) {
      // Send empty bet payload
      sendEmptyBetToBackend();
    }
  }, [timeLeft]);

  // game result
  const getBigSmallResult = async () => {
    if (!betPlacedRef.current || !lastPayload.current) return;

    try {
      const res = await fetch(`${API_URL}/api/game/play`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...lastPayload.current,
          last5Sec: true,
          last25Sec: false,
        }),
      });

      const data = await res.json();
      console.log("🎯 Game Result =", data);

      // 💰 Refetch wallet after win
      refetch();

      // Set Big/Small result
      if (lastPayload.current.userBigSmall) {
        setBigSmallResultMessage(
          data.result === "Win"
            ? "🎉 You Win Big/Small!"
            : "❌ You Lost Big/Small"
        );
      } else {
        setBigSmallResultMessage("");
      }

      // Set Color result
      if (lastPayload.current.userColor) {
        setColorResultMessage(
          data.winnerColor === lastPayload.current.userColor
            ? "🎉 You Win Color!"
            : "❌ You Lost Color"
        );
      } else {
        setColorResultMessage("");
      }

      // Set Number result
      if (lastPayload.current.userNumber) {
        setNumberResultMessage(
          data.winnerNumber === lastPayload.current.userNumber
            ? "🎉 You Win Number!"
            : "❌ You Lost Number"
        );
      } else {
        setNumberResultMessage("");
      }

      // Clear bet state
      betPlacedRef.current = false;
      lastPayload.current = null;
    } catch (error) {
      console.log("❌ Error fetching result:", error.message);
    }
  };

  useEffect(() => {
    if (timeLeft === 1) {
      getBigSmallResult();
    }
  }, [timeLeft]);

  // useeffect to fetch game result
  useEffect(() => {
    if (timeLeft === 0) {
      fetchGameHistory();
    }
  }, [timeLeft]);

  // RESET GAME BACKEND
  const resetGameStateBackend = async () => {
    try {
      const res = await fetch(`${API_URL}/api/game/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Reset error: ${res.status}`);
      }

      const data = await res.json();
      // console.log("✅ Game reset:", data);
    } catch (error) {
      console.error("❌ error in resetting game", error);
    }
  };

  //FETCH GAME HISTORY
  const fetchGameHistory = async (page = 1) => {
    try {
      const res = await fetch(
        `${API_URL}/api/game/history?page=${page}`
      );
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();

      if (Array.isArray(data.history)) {
        setGameHistory(data.history);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1); // ✅ this was missing!
      } else {
        console.warn("❌ Unexpected history format:", data);
        setGameHistory([]);
      }
    } catch (error) {
      console.error("🔥 Error fetching history:", error);
      setGameHistory([]);
    }
  };

  // RESULT POPUP MESSAGE
  useEffect(() => {
    let timeout;

    const shouldShowMessage =
      bigSmallResultMessage || numberResultMessage || colorResultMessage;

    if (shouldShowMessage) {
      timeout = setTimeout(() => {
        setBigSmallResultMessage("");
        setNumberResultMessage("");
        setColorResultMessage("");
      }, 3000);
    }

    // Also clear instantly if countdown hits 30 (e.g. reset round)
    if (timeLeft === 30) {
      setBigSmallResultMessage("");
      setNumberResultMessage("");
      setColorResultMessage("");
    }

    return () => clearTimeout(timeout);
  }, [bigSmallResultMessage, numberResultMessage, colorResultMessage]);

  // send Time to backend
  useEffect(() => {
    if (timeLeft === 25) {
      setLeft25Sec(true);
      // console.log("last 5 seconds", left25Sec);
    }
  });

  // Time
  useEffect(() => {
    if (timeLeft === 25) {
      setLeft25Sec(true);
    }
  }, [timeLeft]);

  // THIS IS FOR PAGINATION
  useEffect(() => {
    fetchGameHistory(currentPage);
  }, [currentPage]);

  // DISABEL SELECTION WHEN TIME === 5
  useEffect(() => {
    if (timeLeft > 5) {
      setIsSelectionAllowed(true);
    } else {
      setIsSelectionAllowed(false);
    }
  }, [timeLeft]);


    // logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // Redirect to login page after logout
  };

  return (
    <>
      {/* <!-- Center: Title -->  */}
      <div className="flex justify-center px-4 items-center mt-4 w-full pt-10">
        <div className="flex items-center text-yellow-400 text-3xl sm:text-2xl md:text-4xl font-extrabold tracking-wider drop-shadow-md whitespace-nowrap">
          <svg
            className="w-10 h-10 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 text-yellow-300 animate-bounce"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <circle cx="10" cy="10" r="8" />
          </svg>
          Lottery
        </div>
        <button
          onClick={handleLogout}
          className="px-2 py-1 text-white rounded-lg text-lg bg-red-500"
        >
          Logout
        </button>
      </div>

      {/* Wallet */}
      <div className="flex justify-center items-center mb-3 w-full px-4 mt-6 lg:mt-10 ">
        <div className="backdrop-blur-md bg-white/20 rounded-xl px-6 py-3 shadow-lg flex flex-col items-center w-full max-w-2xl">
          <span className="text-2xl font-bold text-gray-100 flex items-center mb-1">
            <span className="mr-1">₹</span>
            {balance}
          </span>
          <span className="flex items-center text-gray-300 mb-2 text-sm">
            <i className="fas fa-wallet mr-1"></i> Wallet Balance
          </span>
          <div className="flex items-center gap-6 mt-1">
            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-1.5 rounded-lg shadow transition">
              Withdraw
            </button>
            <Link
              to="/wallet/deposit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-1.5 rounded-lg shadow transition"
            >
              Deposit
            </Link>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div className="px-4 mb-3">
        <div className="flex justify-between items-center bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-xl shadow-lg px-4 py-2 text-black">
          {/* Left: Game Info + History */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold text-gray-900">
              WinGo 30sec
            </span>
            <div className="flex space-x-2 mt-1">
              <div className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                2
              </div>
              <div className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                2
              </div>
              <div className="w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </div>
              <div className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                8
              </div>
              <div className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                6
              </div>
            </div>
          </div>

          {/* Right: Countdown */}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-sm font-semibold text-gray-800">
              Time remaining
            </span>
            <div className="flex space-x-1">
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                {isPaused ? "0" : "0"}
              </span>
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                {isPaused ? "0" : "0"}
              </span>
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                {isPaused ? "0" : firstNumber}
              </span>
              <span
                className={`bg-black px-2 py-1 font-bold rounded-sm text-lg leading-none ${
                  timeLeft <= 5 && !isPaused ? "text-red-500" : "text-white"
                }`}
              >
                {isPaused ? "0" : secondNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Messages (Sticky Top Message) */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 space-y-2">
        {bigSmallResultMessage && (
          <div
            className={`text-lg font-semibold rounded-lg shadow-lg  ${
              bigSmallResultMessage.includes("Win")
                ? "bg-green-600 text-yellow-300 w-60 text-center"
                : "bg-red-600 text-yellow-300 w-60 text-center"
            }`}
          >
            {bigSmallResultMessage}
          </div>
        )}

        {numberResultMessage && (
          <div
            className={`text-lg font-semibold rounded-lg shadow-lg  ${
              numberResultMessage.includes("Win")
                ? "bg-green-600 text-blue-300 w-60 text-center"
                : "bg-red-600 text-blue-300 w-60 text-center"
            }`}
          >
            {numberResultMessage}
          </div>
        )}

        {colorResultMessage && (
          <div
            className={`text-lg font-semibold rounded-lg shadow-lg  ${
              colorResultMessage.includes("Win")
                ? "bg-green-600 text-white w-60   text-center"
                : "bg-red-600 text-white w-60   text-center "
            }`}
          >
            {colorResultMessage}
          </div>
        )}
      </div>

      {/* Show Amount only when something is selected */}
      {(selectedColor || selectedNumber !== null || selectedBigSmall) &&
        showAmountBox && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-40">
            <Amount
              onCancel={() => {
                setShowAmountBox(false);

                // 💥 Reset everything
                setSelectedColor(null);
                selectedColorRef.current = null;

                setSelectedNumber(null);
                selectedNumberRef.current = null;

                setSelectedBigSmall(null);
                selectBigSmallRef.current = null;

                setIsButtonDisabled(false);
              }}
              onConfirm={(amount) => {
                setTotalAmount(amount);
                setShowAmountBox(false);
                console.log("💰 Final Total:", amount);

                if (
                  selectBigSmallRef.current &&
                  bigSmallAmountRef.current === null
                ) {
                  bigSmallAmountRef.current = amount;
                }
                if (
                  selectedColorRef.current &&
                  colorAmountRef.current === null
                ) {
                  colorAmountRef.current = amount;
                }
                if (
                  selectedNumberRef.current !== null &&
                  numberAmountRef.current === null
                ) {
                  numberAmountRef.current = amount;
                }

                // ✅ Now place bet
                handlePlaceBet();
              }}
            />
          </div>
        )}

      {/* <!-- 🎨 Color Buttons --> */}
      <div className="flex gap-2 justify-center mb-4">
        <button
        disabled={!isSelectionAllowed}
          className={`bg-green-400 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Green" ? "ring-4 ring-green-100" : "disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          onClick={() => {
            if (!isSelectionAllowed || selectedColorRef.current) return;
            selectedColorRef.current = "Green";
            setSelectedColor("Green");
            setShowAmountBox(true); // <-- ✅ Show amount
          }}
        >
          Green
        </button>
        <button
        disabled={!isSelectionAllowed}
          className={`bg-purple-600 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Purple" ? "ring-4 ring-purple-300" : "disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          onClick={() => {
            if (!isSelectionAllowed || selectedColorRef.current) return;
            selectedColorRef.current = "Purple";
            setSelectedColor("Purple");
            setShowAmountBox(true); // <-- ✅ Show amount
          }}
        >
          Purple
        </button>
        <button
        disabled={!isSelectionAllowed}
          className={`bg-red-600 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Red" ? "ring-4 ring-red-300" : "disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          onClick={() => {
            if (!isSelectionAllowed || selectedColorRef.current) return;
            selectedColorRef.current = "Red";
            setSelectedColor("Red");
            setShowAmountBox(true); // <-- ✅ Show amount
          }}
        >
          Red
        </button>
      </div>

      <div className="rounded-xl px-4 py-3">
        <div className="grid grid-cols-5 gap-3 justify-center">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              disabled={!isSelectionAllowed}
              className={`w-14 h-14 flex items-center justify-center rounded-full text-lg font-bold transition-all duration-200
    ${selectedNumber === num ? "ring-4 ring-pink-400 bg-yellow-300" : ""}
    ${!isSelectionAllowed ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
  `}
              style={{
                background:
                  selectedNumber === num
                    ? undefined
                    : "radial-gradient(circle at center, #ffffff 30%, #ff4d4d 40%, #a100ff 70%)",
                boxShadow:
                  "inset 0 0 10px rgba(255,255,255,0.5), 0 0 10px rgba(0,0,0,0.5)",
                color: selectedNumber === num ? "#000000" : "#a100ff",
              }}
              onClick={() => {
                if (!isSelectionAllowed || selectedNumberRef.current !== null)
                  return;
                selectedNumberRef.current = num;
                setSelectedNumber(num);
                setShowAmountBox(true);
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* User Selection */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mx-4 mb-6 shadow-lg space-y-6">
        <div className="flex justify-center gap-4">
          <button
            disabled={!isSelectionAllowed}
            className={`w-32 py-2 rounded-l-full font-semibold transition ${
              selectBigSmallRef.current === "Big"
                ? "ring-4 ring-orange-300 bg-orange-500"
                : "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
            onClick={() => {
              if (!isSelectionAllowed || selectBigSmallRef.current) return;

              selectBigSmallRef.current = "Big";
              setSelectedBigSmall("Big");
              setShowAmountBox(true);
            }}
          >
            Big
          </button>

          <button
            disabled={!isSelectionAllowed}
            className={`w-32 py-2 rounded-r-full font-semibold transition ${
              selectBigSmallRef.current === "Small"
                ? "ring-4 ring-blue-300 bg-blue-500"
                : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
            onClick={() => {
              if (!isSelectionAllowed || selectBigSmallRef.current) return;
              selectBigSmallRef.current = "Small"; // 🔥 Add this line
              setSelectedBigSmall("Small");
              setShowAmountBox(true);
            }}
          >
            Small
          </button>
        </div>
      </div>


      <div className="w-full px-4" id="result-section">
        <h3 className="text-white mb-4">Game History</h3>
        <div className="grid grid-cols-4 text-sm font-semibold text-white bg-[#68587e] p-2 rounded-t justify-between text-center">
          <div>Period</div>
          <div>Number</div>
          <div>Big Small</div>
          <div>Color</div>
        </div>
      </div>

      {/* Game History */}
      <div className="space-y-2 px-4 mb-6 w-full">
        {gameHistory.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-4 text-sm font-semibold text-white bg-[#1a1a1a] p-2 rounded text-center"
          >
            <div>{item.period || "-"}</div>
            <div className="text-blue-400">
              {item.randomChoiceNumber ?? "-"}
            </div>
            <div className="text-yellow-400">
              {item.randomChoiceBigSmall || "-"}
            </div>
            <div
              className={
                item.randomChoiceColor === "Green"
                  ? "text-green-500"
                  : item.randomChoiceColor === "Red"
                  ? "text-red-500"
                  : item.randomChoiceColor === "Purple"
                  ? "text-purple-400"
                  : "text-white"
              }
            >
              {item.randomChoiceColor || "-"}
            </div>
          </div>
        ))}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mt-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-white font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="w-full mb-30"></div>
    </>
  );
}

export default SecondLottery;
