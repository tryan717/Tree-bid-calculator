import React, { useMemo, useState } from 'react';
import { Calculator, RotateCcw, TreePine, Mountain, Truck, ShieldCheck } from 'lucide-react';

const pointRates = [200, 225, 250, 275];
const LOG_DEDUCTION = 400;
const LIMB_DEDUCTION = 300;
const DEBRIS_DEDUCTION_EFFECTIVENESS = 0.85;

const treeSizeOptions = [
  { label: 'Small (<12” / <40 ft)', points: 1 },
  { label: 'Medium (12–24” / 40–70 ft)', points: 2 },
  { label: 'Large (24–36” / 70–90 ft)', points: 3 },
  { label: 'Extra Large (36”+ / 90 ft+)', points: 4 },
];

const canopyOptions = [
  { label: 'Light / sparse canopy', points: 0 },
  { label: 'Medium canopy', points: 0.5 },
  { label: 'Large / broad canopy', points: 1 },
  { label: 'Extra large / massive canopy', points: 1.5 },
];

const targetOptions = [
  { label: 'Open drop zone', points: 0 },
  { label: 'Light obstacles', points: 1 },
  { label: 'Fence / landscaping', points: 2 },
  { label: 'Near structure', points: 3 },
  { label: 'Multiple tight targets', points: 4 },
];

const riggingOptions = [
  { label: 'Can be felled', points: 0 },
  { label: 'Simple climbing', points: 1 },
  { label: 'Piece-out required', points: 2 },
  { label: 'Rigging required', points: 3 },
  { label: 'Technical rigging', points: 4 },
  { label: 'Advanced / multi tie-in', points: 5 },
];

const accessOptions = [
  { label: 'Tight / backyard access', points: 2 },
  { label: 'Steep / difficult terrain', points: 2 },
  { label: 'Long drag distance', points: 1 },
  { label: 'Limited equipment access', points: 1 },
];

const cleanupOptions = [
  { label: 'Basic cleanup', points: 0 },
  { label: 'Standard cleanup', points: 1 },
  { label: 'Full cleanup', points: 2 },
];

const makeTree = (active = false) => ({
  active,
  size: 0,
  canopy: 0,
  condition: 0,
  hollow: false,
  leaning: false,
  target: 0,
  rigging: 0,
  subtractLogHaul: false,
  subtractLimbHaul: false,
});

function formatPoints(n) {
  return Number.isInteger(n) ? `${n}` : `${n.toFixed(1)}`;
}

function currency(n) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

function CardContent({ children }) {
  return <div className="card-content">{children}</div>;
}

function LabelText({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="label">{children}</label>;
}

function Metric({ label, value, sub }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function SelectCardGroup({ options, value, setValue }) {
  return (
    <div className="option-grid">
      {options.map((option) => {
        const active = value === option.points;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => setValue(option.points)}
            className={`option-button ${active ? 'active' : ''}`}
          >
            <span>{option.label}</span>
            <span className={`pill ${active ? 'pill-active' : ''}`}>
              {formatPoints(option.points)} pt{option.points === 1 ? '' : 's'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleButton({ label, active, onClick, activeText = 'On', inactiveText = 'Off' }) {
  return (
    <button type="button" onClick={onClick} className={`toggle-button ${active ? 'active' : ''}`}>
      <span>{label}</span>
      <span className={`pill ${active ? 'pill-active' : ''}`}>{active ? activeText : inactiveText}</span>
    </button>
  );
}

export default function TreeBidPhoneCalculator() {
  const [trees, setTrees] = useState([makeTree(true), makeTree(false), makeTree(false), makeTree(false)]);
  const [accessSelections, setAccessSelections] = useState([]);
  const [cleanup, setCleanup] = useState(1);
  const [miniAssist, setMiniAssist] = useState(true);
  const [logHauling, setLogHauling] = useState(true);
  const [largeWoodHandling, setLargeWoodHandling] = useState(false);
  const [secondClimber, setSecondClimber] = useState(false);
  const [pointRate, setPointRate] = useState(200);
  const [manualAdjustment, setManualAdjustment] = useState('0');
  const [estimatedDays, setEstimatedDays] = useState('1');
  const [targetDayRate, setTargetDayRate] = useState('3400');
  const [useTargetAdjustment, setUseTargetAdjustment] = useState(false);

  const updateTree = (index, patch) => {
    setTrees((prev) => prev.map((tree, i) => (i === index ? { ...tree, ...patch } : tree)));
  };

  const toggleAccess = (option) => {
    setAccessSelections((prev) => {
      const active = prev.some((item) => item.label === option.label);
      return active ? prev.filter((item) => item.label !== option.label) : [...prev, option];
    });
  };

  const activeTrees = trees.map((tree, index) => ({ ...tree, index })).filter((tree) => tree.active);

  const treeBreakdownSeed = activeTrees.map((tree) => ({
    index: tree.index,
    points: tree.size + tree.canopy + tree.condition + (tree.hollow ? 1 : 0) + (tree.leaning ? 1 : 0) + tree.target + tree.rigging,
    subtractLogHaul: tree.subtractLogHaul,
    subtractLimbHaul: tree.subtractLimbHaul,
  }));

  const sizePoints = activeTrees.reduce((sum, tree) => sum + tree.size, 0);
  const canopyPoints = activeTrees.reduce((sum, tree) => sum + tree.canopy, 0);
  const treeRiskPoints = activeTrees.reduce((sum, tree) => sum + tree.condition + (tree.hollow ? 1 : 0) + (tree.leaning ? 1 : 0) + tree.target + tree.rigging, 0);
  const accessPoints = accessSelections.reduce((sum, option) => sum + option.points, 0);
  const equipmentPoints = (miniAssist ? 2 : 0) + (logHauling ? 2 : 0) + (largeWoodHandling ? 1 : 0) + (secondClimber ? 3 : 0);
  const rawJobWidePoints = accessPoints + cleanup + equipmentPoints;

  const avgTreeSize = activeTrees.length > 0 ? sizePoints / activeTrees.length : 0;
  const treeCountScale = activeTrees.length >= 3 ? 1 : activeTrees.length === 2 ? 0.85 : activeTrees.length === 1 ? 0.65 : 0;
  const treeSizeScale = avgTreeSize >= 3 ? 1 : avgTreeSize >= 2 ? 0.9 : avgTreeSize > 0 ? 0.8 : 0;
  const jobWideScale = Math.min(1, treeCountScale + (treeSizeScale - 0.8));
  const scaledJobWidePoints = rawJobWidePoints * jobWideScale;
  const totalPoints = sizePoints + canopyPoints + treeRiskPoints + scaledJobWidePoints;

  const adjustment = Number(manualAdjustment) || 0;
  const days = Math.max(Number(estimatedDays) || 0, 0);
  const dayRateTarget = Number(targetDayRate) || 0;
  const pointBasedTotal = totalPoints * pointRate + adjustment;
  const targetBasedTotal = days > 0 ? dayRateTarget * days : 0;
  const preDeductionTotal = useTargetAdjustment && targetBasedTotal > 0 ? Math.max(pointBasedTotal, targetBasedTotal) : pointBasedTotal;

  const haulOffDeductionTotal = treeBreakdownSeed.reduce((sum, tree) => {
    const rawDeduction = (tree.subtractLogHaul ? LOG_DEDUCTION : 0) + (tree.subtractLimbHaul ? LIMB_DEDUCTION : 0);
    return sum + rawDeduction * DEBRIS_DEDUCTION_EFFECTIVENESS;
  }, 0);

  const finalTotal = Math.max(0, preDeductionTotal - haulOffDeductionTotal);

  const totalTreePoints = treeBreakdownSeed.reduce((sum, tree) => sum + tree.points, 0);
  const baseTreePortion = treeBreakdownSeed.reduce((sum, tree) => sum + tree.points * pointRate, 0);
  const sharedAllocationPool = Math.max(0, finalTotal - baseTreePortion + haulOffDeductionTotal);

  const treeBreakdown = treeBreakdownSeed.map((tree) => {
    const weight = totalTreePoints > 0 ? tree.points / totalTreePoints : 0;
    const treeBasePrice = tree.points * pointRate;
    const logDeduction = tree.subtractLogHaul ? LOG_DEDUCTION * DEBRIS_DEDUCTION_EFFECTIVENESS : 0;
    const limbDeduction = tree.subtractLimbHaul ? LIMB_DEDUCTION * DEBRIS_DEDUCTION_EFFECTIVENESS : 0;
    const totalDeduction = logDeduction + limbDeduction;
    const sharedAllocation = sharedAllocationPool * weight;
    const finalTreePrice = Math.max(0, treeBasePrice + sharedAllocation - totalDeduction);
    return { ...tree, treeBasePrice, sharedAllocation, logDeduction, limbDeduction, totalDeduction, finalTreePrice };
  });

  const reconciledTreeTotal = treeBreakdown.reduce((sum, tree) => sum + tree.finalTreePrice, 0);
  const pricePerDay = days > 0 ? finalTotal / days : 0;
  const pointPricePerDay = days > 0 ? pointBasedTotal / days : 0;
  const targetGapPerDay = days > 0 ? pricePerDay - dayRateTarget : 0;

  const priceRange = useMemo(() => ({
    low: totalPoints * 200,
    mid: totalPoints * 225,
    high: totalPoints * 250,
  }), [totalPoints]);

  const resetAll = () => {
    setTrees([makeTree(true), makeTree(false), makeTree(false), makeTree(false)]);
    setAccessSelections([]);
    setCleanup(1);
    setMiniAssist(true);
    setLogHauling(true);
    setLargeWoodHandling(false);
    setSecondClimber(false);
    setPointRate(200);
    setManualAdjustment('0');
    setEstimatedDays('1');
    setTargetDayRate('3400');
    setUseTargetAdjustment(false);
  };

  return (
    <div className="page">
      <main className="container">
        <Card className="hero">
          <CardHeader>
            <div className="hero-row">
              <div>
                <h1><Calculator size={26} /> Tree Bid Calculator</h1>
                <p>Per-tree scoring with canopy, debris deductions, stackable access, and day-rate checking.</p>
              </div>
              <button type="button" className="secondary-button" onClick={resetAll}><RotateCcw size={16} /> Reset</button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader><h2><TreePine size={22} /> Trees</h2></CardHeader>
          <CardContent>
            <div className="note">Pick one size, canopy, condition, target level, and rigging level for each tree.</div>
            <div className="stack">
              {trees.map((tree, index) => {
                const treePoints = tree.active ? tree.size + tree.canopy + tree.condition + (tree.hollow ? 1 : 0) + (tree.leaning ? 1 : 0) + tree.target + tree.rigging : 0;
                return (
                  <Card key={index} className="inner-card">
                    <CardHeader>
                      <div className="tree-header">
                        <h3>Tree {index + 1}</h3>
                        <div className="inline">
                          {tree.active && <span className="small-pill">{formatPoints(treePoints)} pts</span>}
                          <button type="button" className={tree.active ? 'primary-button' : 'secondary-button'} onClick={() => updateTree(index, tree.active ? makeTree(false) : makeTree(true))}>
                            {tree.active ? 'Included' : 'Add tree'}
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    {tree.active && (
                      <CardContent>
                        <div className="field"><LabelText>Size</LabelText><SelectCardGroup options={treeSizeOptions} value={tree.size} setValue={(value) => updateTree(index, { size: value })} /></div>
                        <div className="field"><LabelText>Canopy modifier</LabelText><SelectCardGroup options={canopyOptions} value={tree.canopy} setValue={(value) => updateTree(index, { canopy: value })} /></div>
                        <div className="field"><LabelText>Main condition</LabelText><SelectCardGroup options={[{ label: 'Healthy / no extra condition', points: 0 }, { label: 'Dead', points: 1 }, { label: 'Very dead / brittle', points: 2 }]} value={tree.condition} setValue={(value) => updateTree(index, { condition: value })} /></div>
                        <div className="two-col">
                          <ToggleButton label="Hollow / compromised (+1)" active={tree.hollow} onClick={() => updateTree(index, { hollow: !tree.hollow })} />
                          <ToggleButton label="Leaning toward target (+1)" active={tree.leaning} onClick={() => updateTree(index, { leaning: !tree.leaning })} />
                        </div>
                        <div className="field"><LabelText>Target difficulty</LabelText><SelectCardGroup options={targetOptions} value={tree.target} setValue={(value) => updateTree(index, { target: value })} /></div>
                        <div className="field"><LabelText>Rigging complexity</LabelText><SelectCardGroup options={riggingOptions} value={tree.rigging} setValue={(value) => updateTree(index, { rigging: value })} /></div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2><Mountain size={22} /> Job-Wide Factors</h2></CardHeader>
          <CardContent>
            <div className="note">Access is stackable. Job-wide points are scaled by tree count and average tree size.</div>
            <div className="field">
              <LabelText>Access factors</LabelText>
              <div className="option-grid">
                {accessOptions.map((option) => {
                  const active = accessSelections.some((item) => item.label === option.label);
                  return <ToggleButton key={option.label} label={`${option.label} (+${option.points})`} active={active} onClick={() => toggleAccess(option)} />;
                })}
              </div>
            </div>
            <div className="field"><LabelText>Cleanup level</LabelText><SelectCardGroup options={cleanupOptions} value={cleanup} setValue={setCleanup} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2><Truck size={22} /> Equipment & Crew Adders</h2></CardHeader>
          <CardContent>
            <div className="option-grid">
              <ToggleButton label="Mini excavator assist (+2)" active={miniAssist} onClick={() => setMiniAssist(!miniAssist)} />
              <ToggleButton label="Log hauling in base price (+2)" active={logHauling} onClick={() => setLogHauling(!logHauling)} />
              <ToggleButton label="Large wood handling (+1)" active={largeWoodHandling} onClick={() => setLargeWoodHandling(!largeWoodHandling)} />
              <ToggleButton label="Second climber required (+3)" active={secondClimber} onClick={() => setSecondClimber(!secondClimber)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2><ShieldCheck size={22} /> Rate, Days & Adjustment</h2></CardHeader>
          <CardContent>
            <div className="field">
              <LabelText>Point rate</LabelText>
              <div className="rate-grid">
                {pointRates.map((rate) => <button key={rate} type="button" className={pointRate === rate ? 'primary-button' : 'secondary-button'} onClick={() => setPointRate(rate)}>${rate}/pt</button>)}
              </div>
            </div>
            <div className="two-col">
              <div className="field"><LabelText htmlFor="estimatedDays">Estimated job days</LabelText><input id="estimatedDays" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} placeholder="1" inputMode="decimal" /></div>
              <div className="field"><LabelText htmlFor="targetDayRate">Target daily rate</LabelText><input id="targetDayRate" value={targetDayRate} onChange={(e) => setTargetDayRate(e.target.value)} placeholder="3400" inputMode="numeric" /></div>
            </div>
            <ToggleButton label="Use target daily rate floor" active={useTargetAdjustment} onClick={() => setUseTargetAdjustment(!useTargetAdjustment)} />
            <div className="field"><LabelText htmlFor="adjustment">Manual adjustment (+/-)</LabelText><input id="adjustment" value={manualAdjustment} onChange={(e) => setManualAdjustment(e.target.value)} placeholder="0" inputMode="numeric" /></div>
          </CardContent>
        </Card>

        <Card className="job-total">
          <CardHeader><h2>Job Total</h2></CardHeader>
          <CardContent>
            <div className="metric-grid six">
              <Metric label="Trees" value={activeTrees.length} />
              <Metric label="Size" value={formatPoints(sizePoints)} />
              <Metric label="Canopy" value={formatPoints(canopyPoints)} />
              <Metric label="Tree Risk" value={formatPoints(treeRiskPoints)} />
              <Metric label="Job-Wide" value={formatPoints(scaledJobWidePoints)} sub={`raw ${formatPoints(rawJobWidePoints)} × ${jobWideScale.toFixed(2)}`} />
              <Metric label="Total Points" value={formatPoints(totalPoints)} />
            </div>
            <hr />
            <div className="metric-grid three">
              <Metric label="Low" value={currency(priceRange.low)} sub="200/pt" />
              <div className="metric featured">
                <div className="metric-label">Final Total</div>
                <div className="metric-value large">{currency(finalTotal)}</div>
                <div className="metric-sub">Point-based: {currency(pointBasedTotal)}</div>
                <div className="metric-sub">Pre-deduction: {currency(preDeductionTotal)}</div>
                {haulOffDeductionTotal > 0 && <div className="metric-sub">Debris deductions: -{currency(haulOffDeductionTotal)}</div>}
              </div>
              <Metric label="High" value={currency(priceRange.high)} sub="250/pt" />
            </div>
            <div className="metric-grid four">
              <Metric label="Estimated days" value={days || 0} />
              <Metric label="Actual price/day" value={days > 0 ? currency(pricePerDay) : '—'} />
              <Metric label="Point price/day" value={days > 0 ? currency(pointPricePerDay) : '—'} />
              <Metric label="Vs target/day" value={days > 0 ? `${targetGapPerDay >= 0 ? '+' : '-'}${currency(Math.abs(targetGapPerDay))}` : '—'} sub={`Target: ${dayRateTarget > 0 ? currency(dayRateTarget) : '—'}/day`} />
            </div>
            <div className="field">
              <h3>Per-tree breakdown</h3>
              <div className="tree-breakdown-grid">
                {treeBreakdown.map((tree) => (
                  <div key={tree.index} className="tree-price-card">
                    <div className="tree-header"><strong>Tree {tree.index + 1}</strong><span>{formatPoints(tree.points)} pts</span></div>
                    <div className="tree-price">{currency(tree.finalTreePrice)}</div>
                    <div className="metric-sub">Tree base: {currency(tree.treeBasePrice)} • shared allocation: {currency(tree.sharedAllocation)}</div>
                    <div className="option-grid compact">
                      <ToggleButton label="Subtract log haul-off" active={tree.subtractLogHaul} onClick={() => updateTree(tree.index, { subtractLogHaul: !tree.subtractLogHaul })} activeText="-$340" inactiveText="Off" />
                      <ToggleButton label="Subtract limb haul-off" active={tree.subtractLimbHaul} onClick={() => updateTree(tree.index, { subtractLimbHaul: !tree.subtractLimbHaul })} activeText="-$255" inactiveText="Off" />
                    </div>
                    {tree.totalDeduction > 0 && <div className="metric-sub">Tree deduction total: -{currency(tree.totalDeduction)}</div>}
                  </div>
                ))}
              </div>
              <div className="metric-sub">Per-tree sum check: {currency(reconciledTreeTotal)} total</div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
