import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../../utilities/GameContext';

const getAdjacentNodes = (idx, gridSize) => {
  const r = Math.floor(idx / gridSize);
  const c = idx % gridSize;
  const neighbors = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
      neighbors.push(nr * gridSize + nc);
    }
  }
  return neighbors;
};

const getDiagonalNodes = (idx, gridSize) => {
  const r = Math.floor(idx / gridSize);
  const c = idx % gridSize;
  const neighbors = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nr = r + i;
      const nc = c + j;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        neighbors.push(nr * gridSize + nc);
      }
    }
  }
  return neighbors;
};

const generateFillSequence = (gridSize, pathLogic) => {
  const total = gridSize * gridSize;
  let path = [];

  const dfs = (curr) => {
    path.push(curr);
    if (path.length === total) return true;

    let possibleNext = [];
    if (pathLogic === 'adjacent') {
      possibleNext = getAdjacentNodes(curr, gridSize);
    } else if (pathLogic === 'diagonal') {
      possibleNext = getDiagonalNodes(curr, gridSize);
    } else {
      possibleNext = Array.from({ length: total }, (_, i) => i);
    }

    let neighbors = possibleNext.filter(n => !path.includes(n));
    neighbors.sort(() => Math.random() - 0.5);
    for (let n of neighbors) {
      if (dfs(n)) return true;
    }

    path.pop();
    return false;
  };

  const startNodes = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let start of startNodes) {
    if (dfs(start)) return path;
  }

  return Array.from({ length: total }, (_, i) => i);
};

const generateNextNode = (currentSeq, gridSize, gameType, pathLogic) => {
  const total = gridSize * gridSize;
  const lastNode = currentSeq.length > 0 ? currentSeq[currentSeq.length - 1] : -1;
  const prevNode = currentSeq.length > 1 ? currentSeq[currentSeq.length - 2] : -1;

  let valid = [];
  if (gameType === 'infinite') {
    for (let i = 0; i < total; i++) {
      if (i !== lastNode && i !== prevNode) valid.push(i);
    }
  } else {
    for (let i = 0; i < total; i++) {
      if (!currentSeq.includes(i)) valid.push(i);
    }
  }

  if (valid.length === 0) return null;

  if (pathLogic === 'adjacent' && lastNode !== -1) {
    let adj = getAdjacentNodes(lastNode, gridSize).filter(n => valid.includes(n));
    if (adj.length > 0) return adj[Math.floor(Math.random() * adj.length)];
  } else if (pathLogic === 'diagonal' && lastNode !== -1) {
    let diag = getDiagonalNodes(lastNode, gridSize).filter(n => valid.includes(n));
    if (diag.length > 0) return diag[Math.floor(Math.random() * diag.length)];
  }

  return valid[Math.floor(Math.random() * valid.length)];
};

const getCoordinatePercent = (idx, gridSize) => {
  const r = Math.floor(idx / gridSize);
  const c = idx % gridSize;
  const totalUnits = 2 * gridSize - 1;
  const x = ((c * 2 + 0.5) / totalUnits) * 100;
  const y = ((r * 2 + 0.5) / totalUnits) * 100;
  return { x, y, totalUnits };
};

export const SwipeGame = ({ t }) => {
  const [gridSize, setGridSize] = useLocalStorage('swipe-grid', 3);
  const [gameType, setGameType] = useLocalStorage('swipe-game-type', 'classic');
  const [pathLogic, setPathLogic] = useLocalStorage('swipe-path-logic', 'diagonal');
  const [highScore, setHighScore] = useLocalStorage('swipe-highscore', 0);

  const [phase, setPhase] = useState('idle');
  const [sequence, setSequence] = useState([]);
  const [displaySequence, setDisplaySequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [round, setRound] = useState(1);
  const [cursorPos, setCursorPos] = useState(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const containerRef = useRef(null);
  const gameIdRef = useRef(0);
  const userSeqRef = useRef([]);

  const boardMaxWidth = (gridSize * 2 - 1) * 60 + 40;

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
      backgroundColor: ['var(--accent)', '#fff', 'var(--text-main)'][Math.floor(Math.random() * 3)]
    }));
  }, []);

  const startGame = (overrideGrid, overrideType, overrideLogic) => {
    setIsPulsing(false);
    gameIdRef.current += 1;
    const g = overrideGrid || gridSize;
    const tType = overrideType || gameType;
    const pLogic = overrideLogic || pathLogic;

    let seq = [];
    if (tType === 'puzzle') {
      seq = generateFillSequence(g, pLogic);
    } else {
      const firstNode = Math.floor(Math.random() * (g * g));
      seq = [firstNode];
      const nextNode = generateNextNode(seq, g, tType, pLogic);
      if (nextNode !== null && nextNode !== undefined) seq.push(nextNode);

      if (seq.length < 2) {
        let fallback = 0;
        while (fallback === seq[0]) fallback++;
        seq.push(fallback);
      }
    }

    setRound(1);
    setSequence(seq);
    setUserSequence([]);
    userSeqRef.current = [];
    setCursorPos(null);
    setPhase('showing');
  };

  useEffect(() => {
    let isCancelled = false;

    const animateSequence = async () => {
      if (phase !== 'showing' || sequence.length === 0) return;

      setDisplaySequence([]);
      await new Promise(r => setTimeout(r, 400));

      let currentDisplay = [];
      for (let i = 0; i < sequence.length; i++) {
        if (isCancelled) return;
        currentDisplay = [...currentDisplay, sequence[i]];
        setDisplaySequence(currentDisplay);
        await new Promise(r => setTimeout(r, 450));
      }

      if (isCancelled) return;
      await new Promise(r => setTimeout(r, 400));

      if (isCancelled) return;
      setDisplaySequence([]);
      setPhase('playing');
    };

    animateSequence();

    return () => {
      isCancelled = true;
    };
  }, [phase, sequence]);

  useEffect(() => {
    if (phase === 'completed') {
      setIsPulsing(true);
      setShowConfetti(true);

      setTimeout(() => setShowConfetti(false), 3000);
    } else if (phase === 'idle' || phase === 'gameover') {
      setShowConfetti(false);
      setIsPulsing(false);
    }
  }, [phase]);

  const handleTriggerNode = (idx) => {
    if (phase !== 'playing') return;

    const currentSeq = userSeqRef.current;

    if (gameType === 'infinite') {
      if (currentSeq.length > 0 && currentSeq[currentSeq.length - 1] === idx) return;
      if (currentSeq.length > 1 && currentSeq[currentSeq.length - 2] === idx) return;
    } else {
      if (currentSeq.includes(idx)) return;
    }

    if (currentSeq.length >= sequence.length) return;

    const expectedIdx = sequence[currentSeq.length];

    if (idx === null || idx === undefined || isNaN(idx)) return;

    if (idx !== expectedIdx) {
      setPhase('gameover');
      const errorSeq = [...currentSeq, idx];
      userSeqRef.current = errorSeq;
      setUserSequence(errorSeq);
      setCursorPos(null);
      setIsDragging(false);

      const currentGameId = gameIdRef.current;
      setTimeout(() => {
        if (currentGameId === gameIdRef.current) {
          startGame(gridSize, gameType, pathLogic);
        }
      }, 1000);
      return;
    }

    const newSeq = [...currentSeq, idx];
    userSeqRef.current = newSeq;
    setUserSequence(newSeq);

    if (newSeq.length === sequence.length) {
      setPhase('success');
      setCursorPos(null);
      setIsDragging(false);

      if (round > highScore && gameType !== 'puzzle') setHighScore(round);

      const currentGameId = gameIdRef.current;
      setTimeout(() => {
        if (currentGameId !== gameIdRef.current) return;

        if (gameType === 'puzzle') {
          setPhase('completed');
        } else {
          setSequence(prevSeq => {
            const next = generateNextNode(prevSeq, gridSize, gameType, pathLogic);
            if (next !== null && next !== undefined) {
              return [...prevSeq, next];
            }
            return prevSeq;
          });
          setUserSequence([]);
          userSeqRef.current = [];

          const nextNodeCheck = generateNextNode(sequence, gridSize, gameType, pathLogic);
          if (nextNodeCheck !== null && nextNodeCheck !== undefined) {
            setRound(prev => prev + 1);
            setPhase('showing');
          } else {
            setPhase('completed');
          }
        }
      }, 1500);
    }
  };

  const processPointerEvent = (clientX, clientY) => {
    if (!containerRef.current || phase !== 'playing') return;

    const rect = containerRef.current.getBoundingClientRect();

    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;

    const xPercent = (cursorX / rect.width) * 100;
    const yPercent = (cursorY / rect.height) * 100;

    setCursorPos({ x: xPercent, y: yPercent });

    const hitThresholdPx = 16;
    for (let i = 0; i < gridSize * gridSize; i++) {
      const nodePosPct = getCoordinatePercent(i, gridSize);

      const nodePxX = (nodePosPct.x / 100) * rect.width;
      const nodePxY = (nodePosPct.y / 100) * rect.height;

      const dist = Math.hypot(nodePxX - cursorX, nodePxY - cursorY);

      if (dist <= hitThresholdPx) {
        handleTriggerNode(i);
        break;
      }
    }
  };

  const handlePointerDown = (e) => {
    if (phase !== 'playing') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    processPointerEvent(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || phase !== 'playing') return;
    processPointerEvent(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setCursorPos(null);
  };

  const renderLines = (seq, isErrorMode, currentGameType) => {
    const validSeq = seq.filter(n => typeof n === 'number' && !isNaN(n) && n >= 0);
    const lines = [];

    if (validSeq.length >= 2) {
      for (let i = 0; i < validSeq.length - 1; i++) {
        const start = validSeq[i];
        const end = validSeq[i + 1];

        const startCoord = getCoordinatePercent(start, gridSize);
        const endCoord = getCoordinatePercent(end, gridSize);

        let opacity = 0.6;
        let strokeWidth = "6";

        if (currentGameType === 'infinite') {
          const distFromEnd = (validSeq.length - 2) - i;
          if (distFromEnd === 0) { opacity = 0.8; strokeWidth = "8"; }
          else if (distFromEnd === 1) { opacity = 0.4; }
          else if (distFromEnd === 2) { opacity = 0.15; }
          else opacity = 0;
        }

        if (opacity > 0) {
          lines.push(
            <line
              key={`${i}-${start}-${end}`}
              x1={`${startCoord.x}%`} y1={`${startCoord.y}%`}
              x2={`${endCoord.x}%`} y2={`${endCoord.y}%`}
              stroke={isErrorMode ? '#ef4444' : 'var(--text-main)'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{ opacity }}
            />
          );
        }
      }
    }

    return lines;
  };

  const activeSeq = phase === 'showing' ? displaySequence : userSequence;
  const isErrorState = phase === 'gameover';
  const isSuccessState = phase === 'success' || phase === 'completed';

  const getStatusText = () => {
    switch (phase) {
      case 'showing': return t?.swipeStatusShowing || 'Observe...';
      case 'playing': return t?.swipeStatusPlaying || 'Your turn!';
      case 'completed': return t?.swipeStatusCompleted || 'Total Victory!';
      case 'success': return t?.swipeStatusSuccess || 'Perfect!';
      case 'gameover': return t?.swipeStatusGameOver || 'Oops, try again...';
      default: return t?.swipeStatusIdle || 'Waiting';
    }
  };

  return (
    <section id="password-swipe" className="mb-32 min-h-[calc(100vh-100px)] relative flex flex-col justify-center items-center w-full px-4">

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
          {confettiParticles.map((c) => (
            <div
              key={c.id}
              className="confetti-particle"
              style={{
                left: c.left,
                animationDelay: c.animationDelay,
                animationDuration: c.animationDuration,
                backgroundColor: c.backgroundColor
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-accent mb-2">{t?.swipeGameTitle || 'Spatial Password'}</h2>
        <p className="text-textMuted max-w-2xl mx-auto">
          {t?.swipeGameDesc || 'Memorize the sequence and redraw it by swiping.'}
        </p>
      </div>

      <div className="neu-panel p-6 mb-8 flex flex-col gap-6 bg-surface shadow-md rounded-2xl relative z-10">
        <div className="flex flex-wrap gap-6 items-center justify-center">

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t?.swipeGridSize || 'Grid Size'}</label>
            <select
              className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl"
              value={gridSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setGridSize(val);
                if (phase !== 'idle') startGame(val, gameType, pathLogic);
              }}
            >
              <option value={2}>{t?.swipeEasy || '2 x 2 (Easy)'}</option>
              <option value={3}>{t?.swipeStandard || '3 x 3 (Standard)'}</option>
              <option value={4}>{t?.swipeExpert || '4 x 4 (Expert)'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t?.swipeGameType || 'Game Type'}</label>
            <select
              className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl"
              value={gameType}
              onChange={(e) => {
                const val = e.target.value;
                setGameType(val);
                if (phase !== 'idle') startGame(gridSize, val, pathLogic);
              }}
            >
              <option value="classic">{t?.swipeClassic || 'Classic'}</option>
              <option value="infinite">{t?.swipeInfinite || 'Infinite'}</option>
              <option value="puzzle">{t?.swipePuzzle || 'Puzzle'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t?.swipePathLogic || 'Path Logic'}</label>
            <select
              className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl"
              value={pathLogic}
              onChange={(e) => {
                const val = e.target.value;
                setPathLogic(val);
                if (phase !== 'idle') startGame(gridSize, gameType, val);
              }}
            >
              <option value="adjacent">{t?.swipeAdjacent || 'Adjacent'}</option>
              <option value="diagonal">{t?.swipeDiagonal || 'Diagonal'}</option>
              <option value="random">{t?.swipeRandom || 'Random'}</option>
            </select>
          </div>

          <div className="mt-2 md:mt-0 md:ml-auto">
            <button onClick={() => startGame(gridSize, gameType, pathLogic)} className="neu-btn px-6 py-3 font-bold text-accent rounded-xl hover:bg-opacity-80 transition-all">
              <i className={phase === 'idle' ? "fas fa-play mr-2" : "fas fa-rotate-right mr-2"}></i>
              {phase === 'idle' ? (t?.swipeBtnStart || 'Start') : (t?.swipeBtnRestart || 'Restart')}
            </button>
          </div>
        </div>

        <hr className="border-textMuted opacity-20" />

        <div className="flex justify-around items-center text-center">
          <div>
            <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">{t?.swipeRoundLabel || 'Round'}</p>
            <p className="text-xl font-bold text-textMain">{phase === 'idle' ? '-' : gameType === 'puzzle' ? (t?.swipeMaxLabel || 'Max') : round}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">{t?.swipeStatusLabel || 'Status'}</p>
            <p className="text-sm font-bold mt-1 px-3 py-1 rounded-full" style={{
              color: isErrorState ? '#ef4444' : isSuccessState ? '#4ade80' : phase === 'showing' ? 'var(--accent)' : 'var(--text-muted)'
            }}>
              {getStatusText()}
            </p>
          </div>
          <div>
            <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">{t?.swipeRecordLabel || 'Highscore'}</p>
            <p className="text-xl font-bold text-accent"><i className="fas fa-crown text-sm mr-1"></i> {gameType === 'puzzle' ? '-' : highScore}</p>
          </div>
        </div>
      </div>

      <div
        className={`relative mx-auto rounded-3xl p-4 neu-panel transition-all duration-700  ${isErrorState ? 'animate-shake' : ''} ${isPulsing? ' neu-flat scale-105 board-won' : 'scale-105'}`}
        style={{
          width: '100%',
          maxWidth: `${boardMaxWidth}px`,
          aspectRatio: '1 / 1'
        }}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full cursor-default touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
            {renderLines(activeSeq, isErrorState, gameType)}

            {isDragging && phase === 'playing' && userSequence.length > 0 && userSequence.length < sequence.length && cursorPos && (
              <line
                x1={`${getCoordinatePercent(userSequence[userSequence.length - 1], gridSize).x}%`}
                y1={`${getCoordinatePercent(userSequence[userSequence.length - 1], gridSize).y}%`}
                x2={`${cursorPos.x}%`}
                y2={`${cursorPos.y}%`}
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
                style={{ opacity: 0.8 }}
                className="transition-none"
              />
            )}
          </svg>

          <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const isActive = activeSeq.includes(idx);
              const { x, y, totalUnits } = getCoordinatePercent(idx, gridSize);
              const sizePercent = (1 / totalUnits) * 100;

              let bgColor = 'var(--accent)';
              let opacity = isActive ? 1 : 0.4;
              let scaleClass = isActive ? 'scale-125' : 'scale-75';
              let shadowClass = '';

              if (isActive) {
                if (isErrorState) {
                  bgColor = '#ef4444';
                  shadowClass = 'shadow-[0_0_15px_#ef4444]';
                } else if (isSuccessState) {
                  bgColor = '#4ade80';
                  shadowClass = 'shadow-[0_0_15px_#4ade80]';
                } else {
                  shadowClass = 'shadow-[0_0_15px_var(--accent)]';
                }
              }

              return (
                <div
                  key={idx}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${x}%`, top: `${y}%`,
                    width: `${sizePercent}%`, height: `${sizePercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`rounded-full transition-all duration-300 ${scaleClass} ${shadowClass}`} style={{ width: '24px', height: '24px', backgroundColor: bgColor, opacity: opacity }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SwipeGame;
