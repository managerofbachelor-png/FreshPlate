import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BmiInputs } from '../types';
import { CountUpNumber } from './CountUpNumber';

interface BmiViewProps {
  savedBmi: BmiInputs;
  onSaveBmi: (val: BmiInputs) => void;
}

export const BmiView: React.FC<BmiViewProps> = ({ savedBmi, onSaveBmi }) => {
  const [unit, setUnit] = useState<'metric' | 'imperial'>(savedBmi.unit);
  const [cm, setCm] = useState<string>(String(savedBmi.cm || 172));
  const [kg, setKg] = useState<string>(String(savedBmi.kg || 70));
  const [feet, setFeet] = useState<string>(String(savedBmi.feet || 5));
  const [inches, setInches] = useState<string>(String(savedBmi.inches || 8));
  const [lbs, setLbs] = useState<string>(String(savedBmi.lbs || 154));
  const [calcCount, setCalcCount] = useState<number>(1);

  const result = useMemo(() => {
    let heightM = 1.72;
    let weightKg = 70;

    if (unit === 'metric') {
      heightM = Math.max(1.0, Math.min(2.4, (Number(cm) || 170) / 100));
      weightKg = Math.max(25, Math.min(250, Number(kg) || 70));
    } else {
      const totalIn = Math.max(40, (Number(feet) || 5) * 12 + (Number(inches) || 0));
      heightM = totalIn * 0.0254;
      weightKg = Math.max(55, Number(lbs) || 154) * 0.453592;
    }

    const bmi = weightKg / (heightM * heightM);
    const clampedBmi = Math.max(10, Math.min(45, bmi));

    let band = 'Healthy Weight';
    let color = '#7CB342';
    let tip =
      'Great balance! Focus on colourful vegetables, whole grains, and steady protein at each meal to keep your energy high.';

    if (bmi < 18.5) {
      band = 'Underweight';
      color = '#FFC53D';
      tip =
        'Add nutrient-dense calories with peanut butter oats, banana smoothies, eggs, and extra dal or chicken portions.';
    } else if (bmi >= 25 && bmi < 30) {
      band = 'Overweight';
      color = '#F59E0B';
      tip =
        'Fill half your plate with Fresh Salad or Vegetable Bhaji first, pair with lean protein like grilled chicken or fish, and watch oil portions.';
    } else if (bmi >= 30) {
      band = 'Obese';
      color = '#E4572E';
      tip =
        'Aim for steady, sustainable meals: prioritize high-protein dishes (30g+ protein) and high-fiber veggies to feel full longer.';
    }

    const minHealthyKg = 18.5 * heightM * heightM;
    const maxHealthyKg = 24.9 * heightM * heightM;

    const rangeLabel =
      unit === 'metric'
        ? `${minHealthyKg.toFixed(1)} – ${maxHealthyKg.toFixed(1)} kg`
        : `${Math.round(minHealthyKg * 2.20462)} – ${Math.round(maxHealthyKg * 2.20462)} lb`;

    // Needle rotation: map BMI [12 .. 40] -> [-90deg .. +90deg]
    const norm = Math.max(0, Math.min(1, (clampedBmi - 12) / (40 - 12)));
    const angle = -90 + norm * 180;

    return {
      bmi: Number(bmi.toFixed(1)),
      band,
      color,
      tip,
      rangeLabel,
      angle,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, cm, kg, feet, inches, lbs, calcCount]);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const safeCm = clamp(Number(cm) || 172, 100, 240);
    const safeKg = clamp(Number(kg) || 70, 25, 250);
    const safeFeet = clamp(Math.round(Number(feet) || 5), 3, 8);
    const safeInches = clamp(Math.round(Number(inches) || 0), 0, 11);
    const safeLbs = clamp(Number(lbs) || 154, 55, 550);
    setCm(String(safeCm));
    setKg(String(safeKg));
    setFeet(String(safeFeet));
    setInches(String(safeInches));
    setLbs(String(safeLbs));
    onSaveBmi({
      unit,
      cm: safeCm,
      kg: safeKg,
      feet: safeFeet,
      inches: safeInches,
      lbs: safeLbs,
    });
    setCalcCount((c) => c + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-28 pt-5 px-4 sm:px-6 max-w-3xl mx-auto relative z-10"
    >
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A]">
        BMI Checker
      </h1>
      <p className="mt-1 text-sm text-[#7A8A76]">
        Adult body mass index & healthy weight range guide.
      </p>

      {/* Inputs + Unit Switcher */}
      <form onSubmit={handleCalculate} className="mt-5 fresh-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#7A8A76]">Measurement Units</span>
          <div className="inline-flex rounded-full bg-[#E9F2E3] p-1">
            <button
              type="button"
              onClick={() => setUnit('metric')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors min-h-[36px] ${
                unit === 'metric' ? 'bg-[#7CB342] text-white' : 'text-[#1C2B1A]'
              }`}
            >
              cm / kg
            </button>
            <button
              type="button"
              onClick={() => setUnit('imperial')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors min-h-[36px] ${
                unit === 'imperial' ? 'bg-[#7CB342] text-white' : 'text-[#1C2B1A]'
              }`}
            >
              ft / lb
            </button>
          </div>
        </div>

        {unit === 'metric' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bmi-cm" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                Height (cm)
              </label>
              <input
                id="bmi-cm"
                type="number"
                min={100}
                max={240}
                value={cm}
                onChange={(e) => setCm(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3 font-display text-xl font-bold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bmi-kg" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                Weight (kg)
              </label>
              <input
                id="bmi-kg"
                type="number"
                min={25}
                max={250}
                step={0.5}
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3 font-display text-xl font-bold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="bmi-ft" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                Feet
              </label>
              <input
                id="bmi-ft"
                type="number"
                min={3}
                max={8}
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3 font-display text-xl font-bold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bmi-in" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                Inches
              </label>
              <input
                id="bmi-in"
                type="number"
                min={0}
                max={11}
                value={inches}
                onChange={(e) => setInches(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3 font-display text-xl font-bold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bmi-lb" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                Weight (lb)
              </label>
              <input
                id="bmi-lb"
                type="number"
                min={60}
                max={550}
                value={lbs}
                onChange={(e) => setLbs(e.target.value)}
                className="w-full rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3 font-display text-xl font-bold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
          </div>
        )}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white font-display text-base font-bold py-4 shadow-[0_10px_24px_rgba(141,198,63,0.34)] transition-colors min-h-[52px]"
        >
          Calculate
        </motion.button>
      </form>

      {/* Animated BMI Gauge Result Card */}
      <motion.div
        key={calcCount}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-5 fresh-card p-6 text-center"
      >
        {/* Semicircular SVG Gauge with Sweeping Needle */}
        <div className="mx-auto w-64 h-36 relative flex items-end justify-center">
          <svg viewBox="0 0 240 135" className="w-full h-full overflow-visible">
            {/* Underweight arc (12 - 18.5) */}
            <path
              d="M 24 120 A 96 96 0 0 1 65 42"
              fill="none"
              stroke="#FFC53D"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Healthy arc (18.5 - 25) */}
            <path
              d="M 73 36 A 96 96 0 0 1 132 25"
              fill="none"
              stroke="#7CB342"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Overweight arc (25 - 30) */}
            <path
              d="M 140 27 A 96 96 0 0 1 186 52"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Obese arc (30 - 40) */}
            <path
              d="M 192 59 A 96 96 0 0 1 216 120"
              fill="none"
              stroke="#E4572E"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Sweeping Needle */}
            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: result.angle }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              style={{ transformOrigin: '120px 120px' }}
            >
              <line
                x1="120"
                y1="120"
                x2="120"
                y2="34"
                stroke="#1C2B1A"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="120" cy="120" r="9" fill="#1C2B1A" />
              <circle cx="120" cy="120" r="4" fill="#FFFFFF" />
            </motion.g>
          </svg>
        </div>

        {/* Big Bold BMI Number + Shifting Band Color */}
        <div className="mt-1">
          <div className="font-display text-5xl font-extrabold text-[#1C2B1A]">
            <CountUpNumber value={result.bmi} decimals={1} />
          </div>
          <div
            className="mt-1.5 font-display text-lg font-bold"
            style={{ color: result.color }}
          >
            {result.band}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#F4F9F0] p-4 text-sm">
          <div className="text-xs font-semibold text-[#7A8A76]">Healthy Weight Range for Your Height</div>
          <div className="font-display text-lg font-bold text-[#1C2B1A] mt-0.5 tabular-nums">
            {result.rangeLabel}
          </div>
        </div>

        <p className="mt-4 text-sm text-[#1C2B1A] leading-relaxed max-w-md mx-auto">
          {result.tip}
        </p>

        <p className="mt-4 text-xs text-[#7A8A76]">
          BMI is a general guide only, not medical advice.
        </p>
      </motion.div>
    </motion.div>
  );
};
