import { useState } from "react";
import { calculateIPU } from "../services/calculateIPU";
import { formatNumber } from "../utils/number/formatNumber";
import { parseNumber } from "../utils/number/numberParser";

export const useCalculator = () => {
  const [iso, setIso] = useState("");
  const [poliol, setPoliol] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const calculate = () => {
    const isoParsed = parseNumber(iso);
    const poliolParsed = parseNumber(poliol);

    // 🔴 validação
    if (Number.isNaN(isoParsed) || Number.isNaN(poliolParsed)) {
      setError(true);
      setResult(null);
      return;
    }

    setError(false);

    const value = calculateIPU(isoParsed, poliolParsed);
    const formatted = formatNumber(value);

    setResult(formatted);
  };

  return {
    iso,
    poliol,
    setIso,
    setPoliol,
    result,
    error,
    calculate,
  };
};