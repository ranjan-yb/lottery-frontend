import React from "react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import Amount from "../Amount";

function SecondLottery() {
  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

  localStorage.setItem(
    "adminToken",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjg4MGZmYjljNmNkZjAwM2EzOTQyOTY3IiwiaWF0IjoxNzUzMjg1NjcxLCJleHAiOjE3NTMzNzIwNzF9.5r8p5FAPrNSgoJK6_mxEhSEzK3YkiBUViGpNTJvxros"
  ); // ✅ Set it once
  const token = localStorage.getItem("adminToken"); // ✅ Retrieve it properly

  const [timeLeft, setTimeLeft] = useState(30);
  const [firstNumber, setFirstNumber] = useState(3);
  const [secondNumber, setSecondNumber] = useState(0);

  const [restart, setRestart] = useState(false);

  const [resultMessage, setResultMessage] = useState("");
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

  // TIME REMAINING
  useEffect(() => {
    const str = String(timeLeft).padStart(2, "0");
    setFirstNumber(str[0]);
    setSecondNumber(str[1]);
  }, [timeLeft]);

  // COUNTDOWN
  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimeLeft((prv) => {
          if (prv <= 1) {
            clearInterval(timer);
            setIsTimerRunning(false);
            setRestart(true);
            return 0;
          }
          return prv - 1;
        });
      }, 1000);
    }
    // 🧼 Cleanup: Clear the timer on unmount or when effect reruns
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // RESTARTING COUNTDOWN AFTER 5 SECONDS
  useEffect(() => {
    if (!restart) return;

    const timeout = setTimeout(() => {
      // sendSelectionToBackend(); // SENDING DATA TO BACKEND
      handleRoundEnd(); // RESET SELECTIONS
      setTimeLeft(30); // Reset to full time
      setIsTimerRunning(true); // Start again
      setRestart(false); // Reset flag
    }, 5000);

    return () => clearTimeout(timeout); // Cleanup timeout properly
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
  };

  // SEND SELECTED CHOICES TO BACKEND BY (post)
  const sendSelectionToBackend = async () => {
    // console.log(
    //   `color Choice = ${selectedColorRef.current} with amount = ${colorAmountRef.current}`
    // );
    // console.log(
    //   `number Choice = ${selectedNumberRef.current} with amount = ${numberAmountRef.current}`
    // );
    // console.log(
    //   `BIG/SMALL Choice = ${selectBigSmallRef.current} with amount = ${bigSmallAmountRef.current}`
    // );

    try {
      const payload = {};

      if (selectBigSmallRef.current) {
        payload.userBigSmall = selectBigSmallRef.current;
        payload.bigSmallAmount = Number(bigSmallAmountRef.current) || 0;
      }

      if (selectedColorRef.current) {
        payload.userColor = selectedColorRef.current;
        payload.colorAmount = Number(colorAmountRef.current) || 0;
      }

      if (
        selectedNumberRef.current !== null &&
        selectedNumberRef.current !== undefined
      ) {
        payload.userNumber = selectedNumberRef.current;
        payload.numberAmount = Number(numberAmountRef.current) || 0;
      }

      console.log("Final payload:", payload);

      const res = await fetch(`${API_URL}/api/game/play`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Add this
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Auto generated:", data);

      fetchGameHistory(currentPage); // ✅ Fetch latest history for current page

      // RESULTS MESSAGE
      if (data.userBigSmall !== undefined && data.userBigSmall !== null) {
        setBigSmallResultMessage(
          data.randomChoiceBigSmall === data.userBigSmall
            ? "Win"
            : "YOU LOST 🥲"
        );
      }
      if (data.userColor !== undefined && data.userColor !== null) {
        setColorResultMessage(
          data.randomChoiceColor === data.userColor ? "Win" : "YOU LOST 🥲"
        );
      }
      if (data.userNumber !== undefined && data.userNumber !== null) {
        setNumberResultMessage(
          data.randomChoiceNumber === data.userNumber ? "Win" : "YOU LOST 🥲"
        );
      }
    } catch (error) {
      console.log("error in sending data", error);
    }
  };
  // send choices to backend after everytime after round ends
  useEffect(() => {
    if (timeLeft === 1) {
      sendSelectionToBackend();
    }
  }, [timeLeft]);

  //FETCH GAME HISTORY
  const fetchGameHistory = async (page = 1) => {
    try {
      const res = await fetch(`${API_URL}/api/game/history?page=${page}`);
      const data = await res.json();
      console.log("Fetched History:", data);

      if (Array.isArray(data.history)) {
        setGameHistory(data.history);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        console.error("Invalid history response:", data);
        setGameHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setGameHistory([]);
    }
  };

  //USESTATE FOR FETCHING HISTORY
  useEffect(() => {
    fetchGameHistory(currentPage);
  }, [currentPage]);

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
      </div>

      {/* Wallet */}
      <div className="flex justify-center items-center mb-3 w-full px-4 mt-6 lg:mt-10 ">
        <div className="backdrop-blur-md bg-white/20 rounded-xl px-6 py-3 shadow-lg flex flex-col items-center w-full max-w-2xl">
          <span className="text-2xl font-bold text-gray-100 flex items-center mb-1">
            <span className="mr-1">₹</span> 300
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
          <div className="flex flex-col items-end space-y-1">
            <span className="text-sm font-semibold text-gray-800">
              Time remaining
            </span>
            <div className="flex space-x-1">
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                0
              </span>
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                0
              </span>
              <span className="bg-black text-white px-2 py-1 font-bold rounded-sm text-lg leading-none">
                {firstNumber}
              </span>
              <span
                className={`bg-black px-2 py-1 font-bold rounded-sm text-lg leading-none ${
                  timeLeft <= 5 ? "text-red-500" : "text-white"
                }`}
              >
                {secondNumber}
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
              }}
            />
          </div>
        )}

      {/* <!-- 🎨 Color Buttons --> */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          className={`bg-green-400 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Green" ? "ring-4 ring-green-100" : ""
          }`}
          onClick={() => {
            if (selectedColorRef.current) return;
            selectedColorRef.current = "Green";
            setSelectedColor("Green");
            setShowAmountBox(true); // <-- ✅ Show amount
          }}
        >
          Green
        </button>
        <button
          className={`bg-purple-600 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Purple" ? "ring-4 ring-purple-300" : ""
          }`}
          onClick={() => {
            if (selectedColorRef.current) return;
            selectedColorRef.current = "Purple";
            setSelectedColor("Purple");
            setShowAmountBox(true); // <-- ✅ Show amount
          }}
        >
          Purple
        </button>
        <button
          className={`bg-red-600 text-white font-semibold px-6 py-2 rounded shadow ${
            selectedColor === "Red" ? "ring-4 ring-red-300" : ""
          }`}
          onClick={() => {
            if (selectedColorRef.current) return;
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
              className={`w-14 h-14 flex items-center justify-center rounded-full text-lg font-bold transition-all duration-200
        ${
          selectedNumber === num
            ? "ring-4 ring-pink-400 bg-yellow-300 text-black"
            : ""
        }
      `}
              style={{
                background:
                  selectedNumber === num
                    ? undefined // Remove gradient on selection
                    : "radial-gradient(circle at center, #ffffff 30%, #ff4d4d 40%, #a100ff 70%)",
                boxShadow:
                  "inset 0 0 10px rgba(255,255,255,0.5), 0 0 10px rgba(0,0,0,0.5)",
                color: selectedNumber === num ? "#000000" : "#a100ff",
              }}
              onClick={() => {
                if (selectedNumberRef.current !== null) return;
                selectedNumberRef.current = num;
                setSelectedNumber(num);
                setShowAmountBox(true); // <-- ✅ Show amount
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
            className={`w-32 py-2 rounded-l-full font-semibold transition ${
              selectBigSmallRef.current === "Big"
                ? "ring-4 ring-orange-300 bg-orange-500"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
            onClick={() => {
              if (selectBigSmallRef.current) return;
              selectBigSmallRef.current = "Big"; // 🔥 Add this line
              setSelectedBigSmall("Big");
              setShowAmountBox(true);
            }}
          >
            Big
          </button>
          <button
            className={`w-32 py-2 rounded-r-full font-semibold transition ${
              selectBigSmallRef.current === "Small"
                ? "ring-4 ring-blue-300 bg-blue-500"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            onClick={() => {
              if (selectBigSmallRef.current) return;
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
            className="grid grid-cols-4 text-sm font-semibold text-white bg-[#1a1a1a] p-2 rounded justify-between text-center"
          >
            <div>{item.period}</div>
            <div style={{ color: "blue" }}>
              {item.randomChoiceNumber ?? "-"}
            </div>
            <div style={{ color: "yellow" }}>{item.randomChoiceBigSmall}</div>
            <div
              style={{
                color:
                  item.randomChoiceColor === "Green"
                    ? "green"
                    : item.randomChoiceColor === "Purple"
                    ? "purple"
                    : item.randomChoiceColor === "Red"
                    ? "red"
                    : "white",
              }}
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
