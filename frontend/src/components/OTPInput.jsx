import { useRef, useState } from "react";

export default function OTPInput({ onComplete, loading }) {
  const [values, setValues] = useState(Array(6).fill(""));
  const inputs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, ""); // digits only
    if (!val) return;

    const newValues = [...values];

    // Handle paste (e.g., pasting full 6-digit OTP)
    if (val.length > 1) {
      const chars = val.slice(0, 6).split("");
      chars.forEach((c, i) => { if (index + i < 6) newValues[index + i] = c; });
      setValues(newValues);
      const nextIndex = Math.min(index + chars.length, 5);
      inputs.current[nextIndex]?.focus();
      if (newValues.every((v) => v !== "")) onComplete(newValues.join(""));
      return;
    }

    newValues[index] = val;
    setValues(newValues);
    if (index < 5) inputs.current[index + 1]?.focus();
    if (newValues.every((v) => v !== "")) onComplete(newValues.join(""));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newValues = [...values];
      if (values[index]) {
        newValues[index] = "";
        setValues(newValues);
      } else if (index > 0) {
        newValues[index - 1] = "";
        setValues(newValues);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="otp-wrapper">
      <div className="otp-boxes">
        {values.map((val, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            className={`otp-box ${val ? "filled" : ""}`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={val}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {loading && <p className="verifying">Verifying…</p>}
    </div>
  );
}
